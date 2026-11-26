// PortAI accounts + end-to-end encrypted chat sync on Cloudflare D1.
//
// Zero-knowledge design: the browser derives three independent values from the
// passphrase (PBKDF2 -> HKDF): an account id, an auth secret and an AES key.
// The server only receives the id and the auth secret (stored as a SHA-256
// hash) plus opaque ciphertext. It can never read chats or recover the passphrase.

import { allow } from './portai-core.mjs';

const MAX_CHAT_CHARS = 1_500_000; // base64 ciphertext per chat (D1 row limit is ~2 MB)
const MAX_CHATS_PER_ACCOUNT = 5000;
const ID_RE = /^[a-f0-9]{64}$/;
const AUTH_RE = /^[A-Za-z0-9_-]{43}$/;
const CHAT_ID_RE = /^[a-f0-9]{24}$/;

const json = (status, obj) => new Response(JSON.stringify(obj), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...(status === 429 ? { 'Retry-After': '60' } : {}) },
});

async function sha256hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function parseCredentials(request) {
  const m = (request.headers.get('Authorization') || '').match(/^Bearer ([a-f0-9]{64})\.([A-Za-z0-9_-]{43})$/);
  return m ? { id: m[1], auth: m[2] } : null;
}

async function guard(request, env) {
  if (!env.DB) return { error: json(501, { error: 'Accounts are not enabled on this server.' }) };
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (!(await allow(`sync:${ip}`, 120))) return { error: json(429, { error: 'Rate limit hit. Please wait a minute and try again.' }) };
  const creds = parseCredentials(request);
  if (!creds || !ID_RE.test(creds.id) || !AUTH_RE.test(creds.auth)) return { error: json(401, { error: 'Missing or invalid credentials.' }) };
  return { creds };
}

async function authenticate(request, env) {
  const g = await guard(request, env);
  if (g.error) return g;
  const row = await env.DB.prepare('SELECT auth_hash FROM accounts WHERE id = ?').bind(g.creds.id).first();
  if (!row) return { error: json(404, { error: 'No account found for this passphrase.' }) };
  if (!timingSafeEqual(row.auth_hash, await sha256hex(g.creds.auth))) return { error: json(401, { error: 'Wrong credentials.' }) };
  return { accountId: g.creds.id };
}

// POST /api/account: create an account (idempotent for the same passphrase).
export async function createAccount(request, env) {
  const g = await guard(request, env);
  if (g.error) return g.error;
  const hash = await sha256hex(g.creds.auth);
  const existing = await env.DB.prepare('SELECT auth_hash FROM accounts WHERE id = ?').bind(g.creds.id).first();
  if (existing) {
    if (!timingSafeEqual(existing.auth_hash, hash)) return json(409, { error: 'Please choose a different passphrase.' });
    return json(200, { ok: true, existed: true });
  }
  await env.DB.prepare('INSERT INTO accounts (id, auth_hash, created_at) VALUES (?, ?, ?)').bind(g.creds.id, hash, Date.now()).run();
  return json(201, { ok: true, existed: false });
}

// POST /api/account/login: verify credentials.
export async function login(request, env) {
  const a = await authenticate(request, env);
  return a.error || json(200, { ok: true });
}

// DELETE /api/account: permanently delete the account and all its chats.
export async function deleteAccount(request, env) {
  const a = await authenticate(request, env);
  if (a.error) return a.error;
  await env.DB.batch([
    env.DB.prepare('DELETE FROM chats WHERE account_id = ?').bind(a.accountId),
    env.DB.prepare('DELETE FROM accounts WHERE id = ?').bind(a.accountId),
  ]);
  return json(200, { ok: true });
}

// GET /api/chats: all encrypted chats (and deletion tombstones) for the account.
export async function listChats(request, env) {
  const a = await authenticate(request, env);
  if (a.error) return a.error;
  const { results } = await env.DB.prepare('SELECT id, data, updated_at, deleted FROM chats WHERE account_id = ?').bind(a.accountId).all();
  return json(200, { chats: (results || []).map((r) => ({ id: r.id, data: r.data, updatedAt: r.updated_at, deleted: !!r.deleted })) });
}

// PUT /api/chats/:id: upsert one encrypted chat (last write wins).
export async function putChat(request, env, chatId) {
  const a = await authenticate(request, env);
  if (a.error) return a.error;
  if (!CHAT_ID_RE.test(chatId)) return json(400, { error: 'Invalid chat id.' });
  let body;
  try { body = await request.json(); } catch { return json(400, { error: 'Invalid JSON body.' }); }
  const { data, updatedAt } = body || {};
  if (typeof data !== 'string' || !/^[A-Za-z0-9+/=]+$/.test(data)) return json(400, { error: 'data must be base64 ciphertext.' });
  if (data.length > MAX_CHAT_CHARS) return json(413, { error: 'This conversation is too long to sync.' });
  if (!Number.isSafeInteger(updatedAt)) return json(400, { error: 'updatedAt must be a timestamp.' });

  const exists = await env.DB.prepare('SELECT 1 FROM chats WHERE account_id = ? AND id = ?').bind(a.accountId, chatId).first();
  if (!exists) {
    const { n } = await env.DB.prepare('SELECT COUNT(*) AS n FROM chats WHERE account_id = ?').bind(a.accountId).first();
    if (n >= MAX_CHATS_PER_ACCOUNT) return json(413, { error: 'Too many saved chats. Delete some old ones.' });
  }
  await env.DB.prepare(
    `INSERT INTO chats (account_id, id, data, updated_at, deleted) VALUES (?, ?, ?, ?, 0)
     ON CONFLICT (account_id, id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at, deleted = 0
     WHERE excluded.updated_at >= chats.updated_at`,
  ).bind(a.accountId, chatId, data, updatedAt).run();
  return json(200, { ok: true });
}

// DELETE /api/chats/:id: delete a chat (keeps an empty tombstone so other devices drop it too).
export async function deleteChat(request, env, chatId) {
  const a = await authenticate(request, env);
  if (a.error) return a.error;
  if (!CHAT_ID_RE.test(chatId)) return json(400, { error: 'Invalid chat id.' });
  await env.DB.prepare(
    `INSERT INTO chats (account_id, id, data, updated_at, deleted) VALUES (?, ?, '', ?, 1)
     ON CONFLICT (account_id, id) DO UPDATE SET data = '', updated_at = excluded.updated_at, deleted = 1`,
  ).bind(a.accountId, chatId, Date.now()).run();
  return json(200, { ok: true });
}
