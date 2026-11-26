/* This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// PortAI core for Cloudflare Pages Functions (Workers runtime, Web APIs only).
// Mirrors server.js: validates requests, forwards ONLY messages/model/temperature
// to Workers AI or an OpenAI-compatible endpoint, streams the reply back, logs nothing.

import { MULTIPORT_KNOWLEDGE } from './multiport-knowledge.mjs';
import { rateLimit, rateLimitResponse } from './portai-ratelimit.mjs';

export const DEFAULT_MODELS = 'swiss-ai/apertus-v1.5-70b,swiss-ai/apertus-v1.5-8b';
export const DEFAULT_API_BASE = 'https://api.publicai.co/v1';
export const DEFAULT_SYSTEM_PROMPT = [
  'You are PortAI, a free, helpful, honest and privacy-respecting AI assistant made by Multiport and powered by open-source language models.',
  'Answer clearly and concisely, using Markdown when it helps readability.',
  'Respond in the language the user writes in.',
  'Never ask users for personal data you do not need. If they share sensitive information, do not repeat it unnecessarily.',
  'If you are unsure or do not know something, say so instead of guessing.',
].join(' ');

const MAX_BODY_BYTES = 512 * 1024;
const MAX_MESSAGES = 100;
const MAX_MESSAGE_CHARS = 32000;

const list = (v) => String(v || '').split(',').map((s) => s.trim()).filter(Boolean);

export function prettyModelName(id) {
  const base = id.split('/').pop();
  return base
    .replace(/-?v(\d+(\.\d+)?)/i, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\b(\d+)b\b/gi, '$1B');
}

export function buildConfig(env = {}) {
  const labels = list(env.PORTAI_MODEL_LABELS);
  return {
    apiBase: (env.PORTAI_API_BASE || DEFAULT_API_BASE).replace(/\/+$/, ''),
    apiKey: env.PORTAI_API_KEY || '',
    models: list(env.PORTAI_MODELS || DEFAULT_MODELS).map((id, i) => ({ id, label: labels[i] || prettyModelName(id) })),
    systemPrompt: env.PORTAI_SYSTEM_PROMPT || DEFAULT_SYSTEM_PROMPT,
    mock: env.PORTAI_MOCK === '1',
    rateLimit: Number(env.PORTAI_RATE_LIMIT) || 60,      // messages per minute per person
    dailyLimit: Number(env.PORTAI_DAILY_LIMIT) || 500,   // messages per day per person
    thinking: env.PORTAI_THINKING === '1',               // hidden reasoning: slower first word
    maxTokens: Number(env.PORTAI_MAX_TOKENS) || 2048,
  };
}

// Rules for using the Multiport knowledge base (kept separate so operators can
// override the persona with PORTAI_SYSTEM_PROMPT and still keep the grounding).
export const IDENTITY_RULES = [
  'Your name is PortAI, an assistant made by Multiport. Always refer to yourself as PortAI (with your UseX model version), never as Gemma, GLM, ChatGPT, Claude, Llama, DeepSeek or any other assistant, and never say you were created or trained by Google, Zhipu AI, OpenAI or another company.',
  'If a user directly asks what technology powers you, answer honestly but briefly: you are PortAI by Multiport, built on open-source language models (as described in the Multiport knowledge). Do not deny it, and do not volunteer it otherwise.',
].join(' ');

export const KNOWLEDGE_RULES = [
  'Below is reference information about Multiport, the company that makes PortAI, inside <multiport_knowledge> tags.',
  'Use it to answer questions about Multiport, its products, PortAI itself, support, privacy and licensing.',
  'Treat it as the source of truth: do not invent Multiport products, features, prices, release dates, people or URLs that are not in it.',
  'If something about Multiport is not covered, say you are not sure and point the user to https://support.multiportllc.com or support@multiportllc.com.',
  'The counter.dev analytics mentioned there applies to the multiportllc.com website only. PortAI itself has no analytics, ads or tracking.',
  'When a Multiport product genuinely fits what the user needs (for example a counter, a quiz, browser games, fonts, a new tab extension, coaster info or support), recommend it by name with its link in a short sentence, after answering their question. Do not recommend products that do not fit, and do not repeat the same recommendation in every message.',
].join(' ');

export function composeSystemPrompt(cfg, modelId, knowledge = MULTIPORT_KNOWLEDGE) {
  const label = cfg.models.find((m) => m.id === modelId)?.label;
  return [
    cfg.systemPrompt,
    label ? `You are currently running as the "${label}" model. If asked which model or version you are, say you are PortAI ${label}.` : '',
    IDENTITY_RULES,
    knowledge ? `${KNOWLEDGE_RULES}\n\n<multiport_knowledge>\n${knowledge}\n</multiport_knowledge>` : '',
  ].filter(Boolean).join('\n\n');
}

export function validateChatRequest(body, cfg) {
  if (!body || typeof body !== 'object') return { error: 'Invalid JSON body.' };
  const model = body.model || cfg.models[0]?.id;
  if (!cfg.models.some((m) => m.id === model)) return { error: 'Unknown model.' };
  if (!Array.isArray(body.messages) || body.messages.length === 0) return { error: 'messages must be a non-empty array.' };
  if (body.messages.length > MAX_MESSAGES) return { error: `Too many messages (max ${MAX_MESSAGES}).` };
  const messages = [];
  for (const m of body.messages) {
    if (!m || !['user', 'assistant'].includes(m.role) || typeof m.content !== 'string') {
      return { error: 'Each message needs role "user" or "assistant" and string content.' };
    }
    if (m.content.length > MAX_MESSAGE_CHARS) return { error: `Message too long (max ${MAX_MESSAGE_CHARS} characters).` };
    messages.push({ role: m.role, content: m.content });
  }
  let temperature = Number(body.temperature);
  if (!Number.isFinite(temperature)) temperature = 0.7;
  temperature = Math.min(2, Math.max(0, temperature));
  return { value: { model, messages: [{ role: 'system', content: composeSystemPrompt(cfg, model) }, ...messages], temperature, stream: true } };
}

// Best-effort, per-isolate rate limiting. IPs are HMAC'd with a random salt
// that lives only in memory. For hard limits use Cloudflare's WAF rate limiting.
let saltKey; // created lazily: Workers forbid random generation at global scope
let windowStart = Date.now();
let counts = new Map();
export async function allow(ip, limit) {
  const now = Date.now();
  if (now - windowStart >= 60000) { counts = new Map(); windowStart = now; }
  saltKey ||= await crypto.subtle.importKey('raw', crypto.getRandomValues(new Uint8Array(32)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', saltKey, new TextEncoder().encode(ip)));
  const key = btoa(String.fromCharCode(...sig));
  const n = (counts.get(key) || 0) + 1;
  counts.set(key, n);
  return n <= limit;
}

const json = (status, obj) => new Response(JSON.stringify(obj), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...(status === 429 ? { 'Retry-After': '60' } : {}) },
});

export function handleConfig(env) {
  const cfg = buildConfig(env);
  return json(200, { models: cfg.models, mock: cfg.mock, accounts: !!env.DB });
}

export async function handleChat(request, env) {
  const cfg = buildConfig(env);
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const limited = await rateLimit(env, 'chat', ip, { perMinute: cfg.rateLimit, perDay: cfg.dailyLimit });
  if (!limited.ok) return rateLimitResponse(limited);

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return json(413, { error: 'Request too large.' });
  let body;
  try { body = JSON.parse(text); } catch { return json(400, { error: 'Invalid JSON body.' }); }
  const { value, error } = validateChatRequest(body, cfg);
  if (error) return json(400, { error });

  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const send = (obj) => writer.write(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

  const run = async () => {
    try {
      await send({ status: 'thinking' }); // tells the UI the model has started working
      if (cfg.mock) {
        const last = value.messages[value.messages.length - 1].content;
        await send({ delta: `**Mock mode**: no upstream model is configured.\n\nYou said:\n\n> ${last.split('\n').join('\n> ')}` });
      } else if (value.model.startsWith('@cf/')) {
        if (!env.AI) await send({ error: 'Workers AI is not connected: add an AI binding named "AI" to this Pages project and redeploy.' });
        else await runWorkersAI(value, env.AI, send, cfg);
      } else if (!cfg.apiKey) {
        await send({ error: 'PortAI is not configured yet: add the PORTAI_API_KEY secret in your Cloudflare Pages project settings and redeploy.' });
      } else {
        await proxyUpstream(value, cfg, send, request.signal);
      }
    } catch {
      await send({ error: 'Could not reach the model provider.' }).catch(() => {});
    } finally {
      await writer.write(encoder.encode('data: [DONE]\n\n')).catch(() => {});
      await writer.close().catch(() => {});
    }
  };
  const done = run();

  return {
    response: new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-store, no-transform',
      },
    }),
    done,
  };
}

// Cloudflare Workers AI (free daily allocation, no API key, zero data retention).
async function runWorkersAI(payload, ai, send, cfg = {}) {
  let stream;
  try {
    stream = await ai.run(payload.model, {
      messages: payload.messages,
      temperature: payload.temperature,
      max_tokens: cfg.maxTokens || 2048,
      stream: true,
      // Thinking mode makes the first word take 5-7 s; off by default for chat.
      ...(cfg.thinking ? {} : { chat_template_kwargs: { enable_thinking: false } }),
    });
  } catch (e) {
    const msg = String(e?.message || e);
    await send({
      error: /3036|daily free allocation/i.test(msg) ? "Today's free AI allowance has been used up. It resets at 00:00 UTC."
        : /429|rate.?limit|too many/i.test(msg) ? 'Rate limit hit. Please wait a moment and try again.'
        : /3040|capacity/i.test(msg) ? 'The model is busy right now. Please try again in a moment.'
        : /access|allowed|permission|terms|5018|5035|403/i.test(msg) ? 'This Cloudflare account is not allowed to use this model. Pick another model in wrangler.toml.'
        : 'The model could not be reached.',
    });
    return;
  }
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += typeof value === 'string' ? value : decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (data === '[DONE]') return;
      try {
        const j = JSON.parse(data);
        // Some (older) Workers AI models send digit tokens as JSON numbers, e.g. {"response":1}.
        const raw = j.response ?? j.choices?.[0]?.delta?.content; // reasoning/thinking tokens are not shown
        const delta = typeof raw === 'string' ? raw : typeof raw === 'number' ? String(raw) : '';
        if (delta) await send({ delta });
      } catch { /* ignore partial lines */ }
    }
  }
}

async function proxyUpstream(payload, cfg, send, signal) {
  const upstream = await fetch(`${cfg.apiBase}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      'User-Agent': 'PortAI/0.1',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!upstream.ok || !upstream.body) {
    const s = upstream.status;
    await send({
      error: s === 401 || s === 403 ? 'The model provider rejected the server credentials.'
        : s === 429 ? 'Rate limit hit. Please wait a moment and try again.'
        : s === 404 ? 'The selected model is not available at the configured provider.'
        : `The model provider returned an error (${s}).`,
    });
    return;
  }

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (data === '[DONE]') return;
      try {
        const delta = JSON.parse(data).choices?.[0]?.delta?.content;
        if (delta) await send({ delta });
      } catch { /* ignore keep-alives / partial lines */ }
    }
  }
}
