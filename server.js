'use strict';
/**
 * PortAI server — a tiny, dependency-free, privacy-first proxy in front of an
 * OpenAI-compatible endpoint serving open models (e.g. Apertus).
 *
 * Privacy guarantees enforced here:
 *  - No request/response bodies are ever logged or persisted.
 *  - No IP addresses are stored: rate limiting uses a keyed hash with a random
 *    per-process salt, kept in memory for at most one minute.
 *  - Only the chat messages, the model id and sampling parameters are forwarded
 *    upstream. Client headers (cookies, user agent, IP, referrer…) are not.
 *  - No cookies, no analytics, no third-party scripts, strict CSP.
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

loadDotEnv(path.join(__dirname, '.env'));

function loadDotEnv(file) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { return; }
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m || line.trim().startsWith('#')) continue;
    let value = m[2];
    if (/^(['"]).*\1$/.test(value)) value = value.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
}

function list(v) {
  return String(v || '').split(',').map((s) => s.trim()).filter(Boolean);
}

function buildConfig(env = process.env) {
  const models = list(env.PORTAI_MODELS || 'swiss-ai/apertus-v1.5-70b,swiss-ai/apertus-v1.5-8b');
  const labels = list(env.PORTAI_MODEL_LABELS);
  return {
    port: Number(env.PORT) || 8080,
    host: env.HOST || '127.0.0.1',
    apiBase: (env.PORTAI_API_BASE || 'https://api.publicai.co/v1').replace(/\/+$/, ''),
    apiKey: env.PORTAI_API_KEY || '',
    models: models.map((id, i) => ({ id, label: labels[i] || prettyModelName(id) })),
    rateLimit: Number(env.PORTAI_RATE_LIMIT) || 30,
    hsts: env.PORTAI_HSTS === '1',
    trustProxy: env.PORTAI_TRUST_PROXY === '1',
    mock: env.PORTAI_MOCK === '1',
    systemPrompt: env.PORTAI_SYSTEM_PROMPT || DEFAULT_SYSTEM_PROMPT,
    maxBodyBytes: 512 * 1024,
    maxMessages: 100,
    maxMessageChars: 32000,
    upstreamTimeoutMs: Number(env.PORTAI_UPSTREAM_TIMEOUT_MS) || 120000,
  };
}

function prettyModelName(id) {
  const base = id.split('/').pop();
  return base.replace(/-?v(\d+(\.\d+)?)/i, ' $1').replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim().replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\b(\d+)b\b/gi, '$1B');
}

const DEFAULT_SYSTEM_PROMPT = [
  'You are PortAI, a helpful, honest and privacy-respecting AI assistant powered by open-source language models.',
  'Answer clearly and concisely, using Markdown when it helps readability.',
  'Respond in the language the user writes in.',
  'Never ask users for personal data you do not need. If they share sensitive information, do not repeat it unnecessarily.',
  'If you are unsure or do not know something, say so instead of guessing.',
].join(' ');

// ---------------------------------------------------------------------------
// Security headers
// ---------------------------------------------------------------------------

function securityHeaders(cfg) {
  const h = {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self'",
      "img-src 'self' data:",
      "connect-src 'self'",
      "font-src 'self'",
      "object-src 'none'",
      "base-uri 'none'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=(), browsing-topics=()',
  };
  if (cfg.hsts) h['Strict-Transport-Security'] = 'max-age=63072000; includeSubDomains';
  return h;
}

// ---------------------------------------------------------------------------
// Rate limiting without storing IPs
// ---------------------------------------------------------------------------

function createRateLimiter(limitPerMinute) {
  const salt = crypto.randomBytes(32); // never leaves memory, rotates on restart
  let windowStart = Date.now();
  let counts = new Map();
  return function allow(ip) {
    const now = Date.now();
    if (now - windowStart >= 60000) { counts = new Map(); windowStart = now; }
    const key = crypto.createHmac('sha256', salt).update(String(ip)).digest('base64');
    const n = (counts.get(key) || 0) + 1;
    counts.set(key, n);
    return n <= limitPerMinute;
  };
}

function clientIp(req, cfg) {
  if (cfg.trustProxy) {
    const fwd = req.headers['x-forwarded-for'];
    if (fwd) return String(fwd).split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

// ---------------------------------------------------------------------------
// Request validation
// ---------------------------------------------------------------------------

function validateChatRequest(body, cfg) {
  if (!body || typeof body !== 'object') return { error: 'Invalid JSON body.' };
  const model = body.model || cfg.models[0]?.id;
  if (!cfg.models.some((m) => m.id === model)) return { error: 'Unknown model.' };
  if (!Array.isArray(body.messages) || body.messages.length === 0) return { error: 'messages must be a non-empty array.' };
  if (body.messages.length > cfg.maxMessages) return { error: `Too many messages (max ${cfg.maxMessages}).` };
  const messages = [];
  for (const m of body.messages) {
    if (!m || !['user', 'assistant'].includes(m.role) || typeof m.content !== 'string') {
      return { error: 'Each message needs role "user" or "assistant" and string content.' };
    }
    if (m.content.length > cfg.maxMessageChars) return { error: `Message too long (max ${cfg.maxMessageChars} characters).` };
    messages.push({ role: m.role, content: m.content });
  }
  const temperature = clampNumber(body.temperature, 0, 2, 0.7);
  return {
    value: {
      model,
      messages: [{ role: 'system', content: cfg.systemPrompt }, ...messages],
      temperature,
      stream: true,
    },
  };
}

function clampNumber(v, min, max, dflt) {
  const n = Number(v);
  if (!Number.isFinite(n)) return dflt;
  return Math.min(max, Math.max(min, n));
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
};

function sendJson(res, status, obj, headers) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { ...headers, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}

function readBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > maxBytes) { reject(Object.assign(new Error('Body too large'), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function serveStatic(req, res, cfg, publicDir) {
  const headers = securityHeaders(cfg);
  let urlPath;
  try { urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { urlPath = '/'; }
  if (urlPath === '/') urlPath = '/index.html';
  const file = path.normalize(path.join(publicDir, urlPath));
  if (!file.startsWith(publicDir + path.sep)) { res.writeHead(403, headers); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) {
      // SPA fallback
      if (!path.extname(urlPath)) return serveStatic({ ...req, url: '/' }, res, cfg, publicDir);
      res.writeHead(404, { ...headers, 'Content-Type': 'text/plain' });
      return res.end('Not found');
    }
    res.writeHead(200, {
      ...headers,
      'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': file.endsWith('index.html') ? 'no-cache' : 'public, max-age=3600',
    });
    res.end(req.method === 'HEAD' ? undefined : data);
  });
}

// ---------------------------------------------------------------------------
// Chat proxy
// ---------------------------------------------------------------------------

async function handleChat(req, res, cfg, allow) {
  const headers = securityHeaders(cfg);
  if (!allow(clientIp(req, cfg))) return sendJson(res, 429, { error: 'Too many requests. Please wait a minute.' }, headers);

  let parsed;
  try { parsed = JSON.parse(await readBody(req, cfg.maxBodyBytes)); } catch (e) {
    return sendJson(res, e.status || 400, { error: e.status === 413 ? 'Request too large.' : 'Invalid JSON body.' }, headers);
  }
  const { value, error } = validateChatRequest(parsed, cfg);
  if (error) return sendJson(res, 400, { error }, headers);

  res.writeHead(200, {
    ...headers,
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-store, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), cfg.upstreamTimeoutMs);
  res.on('close', () => controller.abort());

  try {
    if (cfg.mock) {
      await mockStream(value, send, controller.signal);
    } else if (!cfg.apiKey && !/^https?:\/\/(localhost|127\.|\[::1\])/.test(cfg.apiBase)) {
      send({ error: 'PortAI is not configured yet: set PORTAI_API_KEY (and optionally PORTAI_API_BASE) on the server.' });
    } else {
      await proxyUpstream(value, cfg, send, controller.signal);
    }
  } catch (e) {
    if (!res.destroyed) {
      send({ error: controller.signal.aborted ? 'The model took too long to respond.' : 'Could not reach the model provider.' });
    }
  } finally {
    clearTimeout(timer);
    if (!res.destroyed) { res.write('data: [DONE]\n\n'); res.end(); }
  }
}

async function proxyUpstream(payload, cfg, send, signal) {
  const upstream = await fetch(`${cfg.apiBase}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      'User-Agent': 'PortAI/0.1',
      ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!upstream.ok || !upstream.body) {
    const status = upstream.status;
    const msg = status === 401 || status === 403 ? 'The model provider rejected the server credentials.'
      : status === 429 ? 'The model provider is rate limiting requests. Please try again shortly.'
      : status === 404 ? 'The selected model is not available at the configured provider.'
      : `The model provider returned an error (${status}).`;
    send({ error: msg });
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';
  for await (const chunk of upstream.body) {
    buffer += decoder.decode(chunk, { stream: true });
    let idx;
    while ((idx = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (data === '[DONE]') return;
      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) send({ delta });
      } catch { /* ignore keep-alives / partial lines */ }
    }
  }
}

async function mockStream(payload, send, signal) {
  const last = payload.messages[payload.messages.length - 1].content;
  const reply = `**Mock mode** — no upstream model is configured.\n\nYou said:\n\n> ${last.split('\n').join('\n> ')}\n\nSet \`PORTAI_API_KEY\` and \`PORTAI_API_BASE\` to talk to **${payload.model}**.`;
  for (const word of reply.split(/(?<=\s)/)) {
    if (signal.aborted) return;
    send({ delta: word });
    await new Promise((r) => setTimeout(r, 12));
  }
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

function createServer(cfg = buildConfig()) {
  const publicDir = path.join(__dirname, 'public');
  const allow = createRateLimiter(cfg.rateLimit);

  return http.createServer((req, res) => {
    const url = req.url || '/';
    if (url === '/api/chat' && req.method === 'POST') {
      handleChat(req, res, cfg, allow).catch(() => { if (!res.headersSent) sendJson(res, 500, { error: 'Internal error.' }); else res.end(); });
      return;
    }
    if (url === '/api/config' && req.method === 'GET') {
      return sendJson(res, 200, { models: cfg.models, mock: cfg.mock }, securityHeaders(cfg));
    }
    if (url === '/api/health' && req.method === 'GET') {
      return sendJson(res, 200, { ok: true }, securityHeaders(cfg));
    }
    if (url.startsWith('/api/')) return sendJson(res, 404, { error: 'Not found.' }, securityHeaders(cfg));
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, securityHeaders(cfg)); return res.end(); }
    serveStatic(req, res, cfg, publicDir);
  });
}

if (require.main === module) {
  const cfg = buildConfig();
  createServer(cfg).listen(cfg.port, cfg.host, () => {
    // Startup info only — PortAI never logs requests.
    console.log(`PortAI listening on http://${cfg.host}:${cfg.port}`);
    console.log(cfg.mock ? 'Mode: mock (no upstream)' : `Upstream: ${cfg.apiBase}  Models: ${cfg.models.map((m) => m.id).join(', ')}`);
  });
}

module.exports = { createServer, buildConfig, validateChatRequest, createRateLimiter };
