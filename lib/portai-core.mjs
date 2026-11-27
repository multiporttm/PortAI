/* This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// PortAI core for Cloudflare Pages Functions (Workers runtime, Web APIs only).
// Mirrors server.js: validates requests, forwards ONLY messages/model/temperature
// to Workers AI or an OpenAI-compatible endpoint, streams the reply back, logs nothing.

import { MULTIPORT_KNOWLEDGE, MULTIPORT_KNOWLEDGE_DETAILS, MULTIPORT_LIBRARY } from './multiport-knowledge.mjs';
import { rateLimit, rateLimitResponse } from './portai-ratelimit.mjs';
import { webSearch, buildSearchQuery, searchContext } from './portai-search.mjs';
import { extractUrls, fetchPage, pageContext } from './portai-fetch.mjs';
import { weatherPlace, timePlace, parseCurrency, dictionaryWord } from './portai-sources.mjs';

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
  const bases = list(env.PORTAI_MODEL_BASES);
  return {
    apiBase: (env.PORTAI_API_BASE || DEFAULT_API_BASE).replace(/\/+$/, ''),
    apiKey: env.PORTAI_API_KEY || '',
    models: list(env.PORTAI_MODELS || DEFAULT_MODELS).map((id, i) => {
      // Per-model limits as "perMinute/perDay", e.g. "20/150". Missing values fall back to the global limits.
      const [perMinute, perDay] = (list(env.PORTAI_MODEL_LIMITS)[i] || '').split('/').map(Number);
      return {
        id,
        label: labels[i] || prettyModelName(id),
        base: bases[i] || prettyModelName(id), // the real model name, shown under the alias
        perMinute: perMinute || Number(env.PORTAI_RATE_LIMIT) || 60,
        perDay: perDay || Number(env.PORTAI_DAILY_LIMIT) || 500,
      };
    }),
    systemPrompt: env.PORTAI_SYSTEM_PROMPT || DEFAULT_SYSTEM_PROMPT,
    mock: env.PORTAI_MOCK === '1',
    rateLimit: Number(env.PORTAI_RATE_LIMIT) || 60,      // messages per minute per person
    dailyLimit: Number(env.PORTAI_DAILY_LIMIT) || 500,   // messages per day per person
    thinking: env.PORTAI_THINKING === '1',               // hidden reasoning: slower first word
    maxTokens: Number(env.PORTAI_MAX_TOKENS) || 2048,
    hedgeMs: env.PORTAI_HEDGE_MS === undefined ? 5000 : Number(env.PORTAI_HEDGE_MS), // start a backup model if no word after this long (0 = off)
    fallbackModels: list(env.PORTAI_FALLBACK_MODELS),
    // Opt-in web search (Cloudflare Web Search API with a free Wikipedia fallback).
    search: env.PORTAI_SEARCH !== '0',
    searchProvider: env.PORTAI_SEARCH_PROVIDER || 'ceramic',
    searchProviders: list(env.PORTAI_SEARCH_PROVIDERS),
    searchGateway: env.PORTAI_SEARCH_GATEWAY || 'default',
    searchContact: env.PORTAI_SEARCH_CONTACT || '',
    readLinks: env.PORTAI_READ_LINKS !== '0', // read pages the user pastes links to (no opt-in needed, like Lumo)
    searchRouter: env.PORTAI_SEARCH_ROUTER || '', // small model that decides when to search automatically
    searchLimits: (() => { const [m, d] = String(env.PORTAI_SEARCH_LIMITS || '20/150').split('/').map(Number); return { perMinute: m || 20, perDay: d || 150 }; })(),
  };
}

// Rules for using the Multiport knowledge base (kept separate so operators can
// override the persona with PORTAI_SYSTEM_PROMPT and still keep the grounding).
export const IDENTITY_RULES = [
  'Your name is PortAI, an assistant made by Multiport. Always refer to yourself simply as PortAI (do not call yourself "PortAI Pro" etc.), but do explain the PortAI model options (Regular, Lite, Mini, Coder, Pro), their uses and their limits when asked. Never refer to yourself as Gemma, GLM, ChatGPT, Claude, Llama, DeepSeek or any other assistant, and never say you were created or trained by Google, Zhipu AI, OpenAI or another company.',
  'When the user asks you to name examples ("name some", "which ones", "list them"), give specific, real names with the documented reason for each instead of only describing categories or saying the market changes too fast. Use the reference information and search results when they list names.',
  'Never invent what an unfamiliar name is. If you do not recognise a company, product, service or person and there are no search results or reference information about it, say you are not sure what it is and ask the user to clarify. Do not guess that it belongs to an unrelated industry, and do not tell the user they are mistaken.',
  'If a user directly asks what technology powers you, answer honestly but briefly: you are PortAI by Multiport, built on open-source language models (as described in the Multiport knowledge). Do not deny it, and do not volunteer it otherwise.',
].join(' ');

export const KNOWLEDGE_RULES = [
  'Below is reference information about Multiport, the company that makes PortAI, inside <multiport_knowledge> tags.',
  'Use it to answer questions about Multiport, its products, PortAI itself, support, privacy and licensing.',
  'Treat it as the source of truth: do not invent Multiport products, features, prices, release dates, people or URLs that are not in it.',
  'This knowledge only covers Multiport. For anything else (other companies, products, AI services, general questions), answer normally from your own general knowledge; do not say something is "not in your knowledge base".',
  'Only if a question about Multiport itself is not covered, say you are not sure and point the user to https://support.multiportllc.com or support@multiportllc.com.',
  'The counter.dev analytics mentioned there applies to the multiportllc.com website only. PortAI itself has no analytics, ads or tracking.',
  'Only recommend a Multiport product when the user is actively looking for a tool, app or website to do exactly what that product does (for example "what app can I use to count reps?" → Multiport Counter App, "any free browser games?" → Multiport Games). Then mention it once, in one short sentence with its link, after answering.',
  'Never add Multiport products, PortAI or "you might enjoy" suggestions to answers about other topics (facts, companies, news, explanations, homework, coding, writing, advice). Those answers must not mention Multiport at all unless the user asked about it. No advertising.',
].join(' ');

// Questions that need the detailed knowledge (PortAI guide, help, privacy, alternatives).
const DETAILS_RE = /\b(multiport\w*|portai|port ai|usex|(who|what) are you|about (you|yourself)|yourself|this (app|site|chat ?bot)|ghost mode|passphrase|(my|an|your) account|sign(ed)? ?(in|up|out)|sync\w*|chat history|export\w* (my )?chats?|delete (my )?(chats?|account|history)|settings|dark mode|which model|(the |your )?models?\b|regular|lite|mini|coder|pro model|rate limit|limit (hit|reached)|daily limit|allowance|busy|offline|security check|web search|search (the )?web|sources?|paste (a )?link|read (a |this )?(link|page)|install|home ?screen|privacy|private|encrypt\w*|tracking|trackers?|ads|cookies?|data retention|zero data|open[- ]source|proton\w*|lumo\w*|duckduckgo|duck\.ai|brave|signal|mullvad|firefox|tor browser|vpn|alternatives? to|compare|comparison|versus|how (do|can) i (use|get|sign|sync|install|turn|delete|export|change|switch)|support|counter app|everything quiz|fonts?|browser games|new tab|coaster|lunchbox|city scraper|mac or windows)\b/i;

/** Whether the latest user messages need the detailed Multiport/PortAI knowledge. */
export function needsDetails(messages = []) {
  return messages.filter((m) => m.role === 'user').slice(-2).some((m) => DETAILS_RE.test(m.content));
}

const norm = (t) => ` ${String(t).replace(/(\p{Ll}{2,})(\p{Lu}{2,})(?![\p{Ll}])/gu, '$1 $2').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ')} `;
const COMMON = new Set('the and for are you what who how why when where which with from that this does did can could would should tell about give list best most more much many some into your have has had was were will them they their there here then than also just like make made'.split(' '));

/**
 * Pick the (up to 3) library sections for the latest user messages. A section
 * needs a topic match; ties are broken by how many of the question's words appear
 * in the section text (so "capital of Peru" picks the Americas list).
 */
export function pickLibrary(messages = [], library = MULTIPORT_LIBRARY, max = 3) {
  const raw = messages.filter((m) => m.role === 'user').slice(-2).map((m) => m.content).join(' ');
  const text = norm(raw);
  const qWords = [...new Set(text.trim().split(' ').filter((w) => w.length >= 3 && !COMMON.has(w)))];
  const scored = library.map((sec) => {
    const topicHits = sec.topics.reduce((n, t) => n + (text.includes(norm(t)) ? 1 : 0), 0);
    const body = norm(sec.text);
    const topicWords = norm(sec.topics.join(' ')); // words like "capital" don't help tell sections apart
    const bodyHits = qWords.reduce((n, w) => n + (!topicWords.includes(` ${w} `) && body.includes(` ${w} `) ? 1 : 0), 0);
    return { sec, topicHits, bodyHits, score: topicHits * 100 + bodyHits };
  }).filter((x) => x.topicHits > 0).sort((a, b) => b.score - a.score);
  // If the best section actually contains the question's words, drop sections that don't.
  const best = scored[0];
  return scored.filter((x) => !(best?.bodyHits > 0 && x.bodyHits === 0)).slice(0, max).map((x) => x.sec);
}

export function composeSystemPrompt(cfg, modelId, knowledge = MULTIPORT_KNOWLEDGE, messages = [], details = MULTIPORT_KNOWLEDGE_DETAILS, library = MULTIPORT_LIBRARY) {
  if (details && needsDetails(messages)) knowledge = `${knowledge}\n\n${details}`;
  const sections = pickLibrary(messages, library);
  if (sections.length) knowledge = `${knowledge}\n\n# Knowledge library (relevant sections)\n${sections.map((x) => x.text).join('\n\n')}`;
  return [
    cfg.systemPrompt,
    'If asked which model or version you are, just say you are PortAI.',
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
  return { value: { model, messages: [{ role: 'system', content: composeSystemPrompt(cfg, model, MULTIPORT_KNOWLEDGE, messages) }, ...messages], temperature, stream: true } };
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
  return json(200, { models: cfg.models, mock: cfg.mock, accounts: !!env.DB, search: cfg.search, version: env.CF_PAGES_COMMIT_SHA || 'dev' });
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

  // Each model also has its own per-person limit (expensive models get lower ones).
  const modelInfo = cfg.models.find((m) => m.id === value.model);
  const modelLimited = await rateLimit(env, `model:${value.model}`, ip, { perMinute: modelInfo.perMinute, perDay: modelInfo.perDay });
  if (!modelLimited.ok) return rateLimitResponse(modelLimited, modelInfo.label);

  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const send = (obj) => writer.write(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

  // Opt-in web search: runs before the model, results are added to the system prompt.
  // search: true = always search, 'auto' = search only when needed (decided by a small model), false/absent = never.
  const searchMode = !cfg.search ? 'off' : body.search === true ? 'always' : body.search === 'auto' ? 'auto' : 'off';
  const runSearch = async (autoQuery) => {
    const limited = await rateLimit(env, 'search', ip, cfg.searchLimits);
    if (!limited.ok) {
      await send({ status: 'search_skipped', reason: limited.scope === 'day' ? 'Daily web search limit reached' : 'Too many searches, wait a moment' });
      return;
    }
    const query = normalizeBrands(autoQuery || buildSearchQuery(value.messages));
    await send({ status: 'searching', query });
    try {
      const { provider, items } = cfg.mock
        ? { provider: 'mock', items: [{ title: 'Example result', url: 'https://example.com/', description: 'Mock search result.' }] }
        : await webSearch(env, query, { ...cfg, userText: lastUser });
      if (!items.length) { await send({ status: 'search_skipped', reason: 'No results found' }); return; }
      value.messages[0] = { role: 'system', content: `${value.messages[0].content}\n\n${searchContext(query, items)}` };
      await send({ status: 'searched', provider, sources: items.map(({ title, url }) => ({ title, url })) });
    } catch {
      await send({ status: 'search_skipped', reason: 'Web search is unavailable right now' });
    }
  };

  // Links in the latest message are read automatically ("Extracting page content").
  const lastUser = [...value.messages].reverse().find((m) => m.role === 'user')?.content || '';
  const links = cfg.readLinks ? extractUrls(lastUser) : [];
  const runReadLinks = async () => {
    const limited = await rateLimit(env, 'links', ip, { perMinute: 20, perDay: 200 });
    if (!limited.ok) { await send({ status: 'read_skipped', reason: 'Link reading limit reached' }); return; }
    const pages = [];
    for (const url of links) {
      const host = new URL(url).hostname.replace(/^www\./, '');
      await send({ status: 'reading', url, host });
      try {
        const page = cfg.mock ? { url, title: host, text: `Mock content of ${url}` } : await fetchPage(url);
        pages.push(page);
        await send({ status: 'read', url: page.url, host, title: page.title });
      } catch {
        await send({ status: 'read_failed', url, host });
      }
    }
    if (pages.length) value.messages[0] = { role: 'system', content: `${value.messages[0].content}\n\n${pageContext(pages)}` };
  };

  const run = async () => {
    try {
      const hint = brandHint(lastUser);
      if (hint) value.messages[0] = { role: 'system', content: `${value.messages[0].content}\n\n${hint}` };
      if (links.length) await runReadLinks();
      if (searchMode === 'always') await runSearch();
      else if (searchMode === 'auto' && !links.length && !cfg.mock && env.AI) {
        const autoQuery = lookupQuery(value.messages) || await decideSearch(env.AI, cfg, value.messages);
        if (autoQuery) await runSearch(autoQuery);
      }
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

// How to turn hidden reasoning off (or as low as possible) for each model family.
export function thinkingOff(model) {
  if (/gpt-oss/.test(model)) return { reasoning_effort: 'low' }; // gpt-oss can't fully disable reasoning
  if (/granite/.test(model)) return {}; // no thinking mode
  return { chat_template_kwargs: { enable_thinking: false } };
}

// Cloudflare Workers AI (free daily allocation, no API key, zero data retention).
const ROUTER_PROMPT = [
  'You decide whether an AI assistant needs a web search to answer the latest user message well.',
  'Search for: current events, news, weather, local time, exchange rates, prices, sports, release dates, anything recent or that may have changed, statistics, and specific products, apps, companies, brands, people, places, books, shows or services the assistant may not know well (especially newer or smaller ones), or when the user asks to look something up. If unsure whether the assistant knows a named thing, search.',
  'Do not search for: greetings, small talk, general knowledge, math, coding, writing, translation, opinions or advice that do not need facts, or questions about Multiport or PortAI.',
  `Today is ${new Date().toISOString().slice(0, 10)}.`,
  'Reply with exactly one line: either NO, or SEARCH: followed by a short web search query (in the language of the question).',
].join(' ');

// Brand names people often type without their punctuation or spacing ("ATT" for AT&T).
export const BRAND_ALIASES = [
  [/\bATT\b|\bAT and T\b|\bAT ?& ?T\b/gi, 'AT&T'], [/\bT ?mobile\b|\bTmobile\b/gi, 'T-Mobile'], [/\bB ?of ?A\b|\bBofA\b/g, 'Bank of America'],
  [/\bH ?& ?M\b|\bHandM\b/gi, 'H&M'], [/\bP ?& ?G\b|\bPandG\b/g, 'Procter & Gamble'], [/\bJ ?& ?J\b/g, 'Johnson & Johnson'], [/\bA ?& ?W\b/g, 'A&W'],
  [/\bB ?& ?N\b|\bBarnes and Noble\b/gi, 'Barnes & Noble'], [/\bM ?& ?Ms?\b/g, "M&M's"], [/\bChick ?fil ?a\b/gi, 'Chick-fil-A'], [/\bWal ?mart\b/gi, 'Walmart'],
  [/\bMc ?donalds\b/gi, "McDonald's"], [/\bYou ?tube\b/gi, 'YouTube'], [/\bTik ?tok\b/gi, 'TikTok'], [/\bPlay ?station\b|\bPS5\b/gi, 'PlayStation'],
  [/\bX ?box\b/gi, 'Xbox'], [/\bCoca ?cola\b/gi, 'Coca-Cola'], [/\bDisney ?plus\b|\bDisney\+/gi, 'Disney+'], [/\bApple ?TV ?plus\b/gi, 'Apple TV+'],
  [/\bopen ?ai\b/gi, 'OpenAI'], [/\bchat ?gpt\b/gi, 'ChatGPT'], [/\bdeep ?seek\b/gi, 'DeepSeek'], [/\bduck ?duck ?go\b/gi, 'DuckDuckGo'], [/\bpay ?pal\b/gi, 'PayPal'],
];

/** Spell common brand names properly ("ATT" -> "AT&T"), for search queries. */
export function normalizeBrands(text) {
  return BRAND_ALIASES.reduce((t, [re, name]) => t.replace(re, name), String(text));
}

/** A note for the model when the user wrote a brand in a shortened form. */
export function brandHint(text) {
  const found = [];
  for (const [re, name] of BRAND_ALIASES) {
    for (const m of String(text).matchAll(new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`))) {
      if (m[0].toLowerCase() !== name.toLowerCase() && !found.some((f) => f[1] === name)) found.push([m[0], name]);
    }
  }
  return found.length ? `Note: in the user's message, ${found.map(([w, n]) => `"${w}" means ${n}`).join(', ')}.` : '';
}

// Comparisons and "what is X" questions about named things should always be looked up:
// small router models often answer NO for brands they don't know (e.g. "Cape vs AT&T").
const LOOKUP_RE = /\b(vs\.?|versus|compare[ds]?|comparison|difference between|better than|alternatives? to|review|reviews|worth it|what is|what's|who is|who's|tell me about|have you heard of|do you know)\b|\band\b.*\?$/i;
const SKIP_RE = /\b(multiport\w*|portai|port ai)\b/i;
/** A search query for the latest message when it compares or asks about named things (or null). */
export function lookupQuery(messages = []) {
  const last = normalizeBrands([...messages].reverse().find((m) => m.role === 'user')?.content?.trim() || '');
  if (!last || last.length > 300 || SKIP_RE.test(last) || /```/.test(last)) return null;
  // Live data (weather, local time, exchange rates, definitions) always needs a lookup.
  if (weatherPlace(last) || timePlace(last) || parseCurrency(last) || dictionaryWord(last)) return last.replace(/\s+/g, ' ').slice(0, 200);
  // Needs a name: a capitalised word that isn't the first word, or a brand like AT&T / T-Mobile.
  const all = last.split(/\s+/);
  const words = all.slice(1);
  const named = words.some((w, i) => !/[.!?:]$/.test(all[i]) && !/^(I|I'm|I've|I'd|I'll)$/.test(w) && /^[A-Z][\w&.-]*[A-Za-z&]/.test(w.replace(/^["“'(]/, ''))) || /\b[A-Z]+&[A-Z]+\b|\b[A-Z]-[A-Z][a-z]+/.test(last);
  if (!named) return null;
  if (!LOOKUP_RE.test(last) && words.length > 6) return null; // a short "Cape Carrier and AT&T" counts too
  return normalizeBrands(last.replace(/\s+/g, ' ')).slice(0, 200);
}

/**
 * Ask a small, cheap model whether the latest message needs a web search.
 * @returns {Promise<string|null>} the search query, or null for no search
 */
export async function decideSearch(ai, cfg, messages, timeoutMs = 3000) {
  const router = cfg.searchRouter || cfg.models.find((m) => /granite/.test(m.id))?.id || cfg.models.find((m) => m.id.startsWith('@cf/'))?.id;
  if (!router) return null;
  const convo = messages.filter((m) => m.role !== 'system').slice(-4)
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content.replace(/\s+/g, ' ').slice(0, 500)}`).join('\n');
  try {
    const result = await Promise.race([
      ai.run(router, { messages: [{ role: 'system', content: ROUTER_PROMPT }, { role: 'user', content: convo }], max_tokens: 40, temperature: 0, ...thinkingOff(router) }),
      new Promise((r) => setTimeout(r, timeoutMs, null)),
    ]);
    const text = String(result?.response ?? result?.choices?.[0]?.message?.content ?? '').trim();
    const m = text.match(/SEARCH:\s*["“]?(.+?)["”]?\s*$/im);
    return m ? m[1].slice(0, 200) : null;
  } catch {
    return null; // if unsure, just answer without searching
  }
}

function workersAiError(e) {
  const msg = String(e?.message || e);
  return /3036|daily free allocation/i.test(msg) ? "Today's free AI allowance has been used up. It resets at 00:00 UTC."
    : /429|rate.?limit|too many/i.test(msg) ? 'Rate limit hit. Please wait a moment and try again.'
    : /3040|capacity/i.test(msg) ? 'The model is busy right now. Please try again in a moment.'
    : /access|allowed|permission|terms|5018|5035|403/i.test(msg) ? 'This Cloudflare account is not allowed to use this model. Pick another model in wrangler.toml.'
    : 'The model could not be reached.';
}

/** Parse a Workers AI SSE stream into text deltas. Returning early cancels the stream. */
async function* workersAiDeltas(stream) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) return;
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
          if (delta) yield delta;
        } catch { /* ignore partial lines */ }
      }
    }
  } finally {
    reader.cancel().catch(() => {});
  }
}

/** Start a model and resolve once its first word arrives (or it fails / ends). */
function startModel(ai, model, payload, cfg) {
  const attempt = { model };
  attempt.first = (async () => {
    const stream = await ai.run(model, {
      messages: payload.messages,
      temperature: payload.temperature,
      max_tokens: cfg.maxTokens || 2048,
      stream: true,
      // Thinking makes the first word take 5-7 s, so keep it off/low by default for chat.
      ...(cfg.thinking ? {} : thinkingOff(model)),
    });
    attempt.iter = workersAiDeltas(stream);
    return attempt.iter.next();
  })();
  attempt.first.catch(() => {});
  return attempt;
}

/** Pick a backup model for when the chosen one is slow or busy (cheap, fast general models first). */
export function pickFallback(cfg, model) {
  const ids = cfg.models.map((m) => m.id).filter((id) => id.startsWith('@cf/') && id !== model);
  const preferred = cfg.fallbackModels?.length ? cfg.fallbackModels : ids.slice(0, 2);
  return preferred.find((id) => id !== model && ids.includes(id));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms, 'timeout'));

// Cloudflare Workers AI. If the chosen model hasn't produced its first word after
// a few seconds (it's queued/busy), a backup model is started in parallel and
// whichever answers first wins; the other is cancelled. The UI is told honestly.
async function runWorkersAI(payload, ai, send, cfg = {}) {
  const label = (id) => cfg.models?.find((m) => m.id === id)?.label || id;
  let primary = startModel(ai, payload.model, payload, cfg);
  let winner = primary;
  let firstResult;
  const hedgeMs = cfg.hedgeMs ?? 5000;
  const fallbackId = hedgeMs > 0 ? pickFallback(cfg, payload.model) : undefined;

  const outcome = await Promise.race([primary.first.then(() => 'primary', () => 'primary-failed'), fallbackId ? sleep(hedgeMs) : new Promise(() => {})]);
  if (outcome === 'primary') {
    firstResult = await primary.first;
  } else if (!fallbackId) {
    await send({ error: workersAiError(await primary.first.catch((e) => e)) });
    return;
  } else {
    // Slow or failed: try the backup model (in parallel if the primary is merely slow).
    const backup = startModel(ai, fallbackId, payload, cfg);
    const race = [backup.first.then((r) => ({ a: backup, r }))];
    if (outcome === 'timeout') race.push(primary.first.then((r) => ({ a: primary, r })));
    try {
      ({ a: winner, r: firstResult } = await Promise.any(race));
    } catch (e) {
      const err = await primary.first.catch((x) => x);
      await send({ error: workersAiError(err instanceof Error ? err : e?.errors?.[0]) });
      return;
    }
    const loser = winner === backup ? primary : backup;
    loser.first.then(() => loser.iter?.return()).catch(() => {});
    if (winner === backup) await send({ status: 'switched', from: label(payload.model), to: label(fallbackId), reason: outcome === 'timeout' ? 'busy' : 'error' });
  }

  if (!firstResult || firstResult.done) return;
  await send({ delta: firstResult.value });
  for (;;) {
    const { value, done } = await winner.iter.next();
    if (done) return;
    await send({ delta: value });
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
