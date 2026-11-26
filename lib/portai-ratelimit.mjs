// Durable, privacy-preserving rate limiting on Cloudflare D1.
//
// Counts are shared by every Cloudflare server (unlike in-memory counters).
// IPs are never stored: the key is SHA-256(secret salt + scope + IP), the salt
// is random and lives only in the database, and rows are deleted once their
// window (one minute or one day) has passed.

import { allow as memoryAllow } from './portai-core.mjs';

const MINUTE = 60_000;
const DAY = 86_400_000;
let saltPromise;

async function getSalt(db) {
  saltPromise ||= (async () => {
    const fresh = [...crypto.getRandomValues(new Uint8Array(32))].map((b) => b.toString(16).padStart(2, '0')).join('');
    await db.prepare('INSERT OR IGNORE INTO settings (name, value) VALUES (?, ?)').bind('ratelimit_salt', fresh).run();
    const row = await db.prepare('SELECT value FROM settings WHERE name = ?').bind('ratelimit_salt').first();
    return row.value;
  })().catch((e) => { saltPromise = undefined; throw e; });
  return saltPromise;
}

async function sha256hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Count one request and check it against the limits.
 * @returns {Promise<{ok: true} | {ok: false, retryAfter: number, scope: 'minute'|'day'}>}
 */
export async function rateLimit(env, scope, ip, { perMinute, perDay } = {}) {
  const db = env.DB;
  if (!db) return (await memoryAllow(`${scope}:${ip}`, perMinute || 30)) ? { ok: true } : { ok: false, retryAfter: 60, scope: 'minute' };
  try {
    const now = Date.now();
    const id = await sha256hex(`${await getSalt(db)}:${scope}:${ip}`);
    const windows = [];
    if (perMinute) windows.push({ kind: 'minute', limit: perMinute, size: MINUTE });
    if (perDay) windows.push({ kind: 'day', limit: perDay, size: DAY });
    const upsert = 'INSERT INTO rate_limits (key, window, count, expires) VALUES (?, ?, 1, ?) ON CONFLICT (key, window) DO UPDATE SET count = count + 1 RETURNING count';
    const results = await db.batch(windows.map((w) => {
      const window = Math.floor(now / w.size);
      return db.prepare(upsert).bind(`${w.kind[0]}:${id}`, window, (window + 1) * w.size);
    }));
    if (Math.random() < 0.02) await db.prepare('DELETE FROM rate_limits WHERE expires < ?').bind(now).run();
    for (let i = windows.length - 1; i >= 0; i--) { // check the day limit first: its wait is longer
      const count = results[i]?.results?.[0]?.count ?? 0;
      const w = windows[i];
      if (count > w.limit) {
        const windowEnd = (Math.floor(now / w.size) + 1) * w.size;
        return { ok: false, retryAfter: Math.max(1, Math.ceil((windowEnd - now) / 1000)), scope: w.kind };
      }
    }
    return { ok: true };
  } catch {
    // If the database is unavailable, fall back to per-server memory limits instead of failing.
    return (await memoryAllow(`${scope}:${ip}`, perMinute || 30)) ? { ok: true } : { ok: false, retryAfter: 60, scope: 'minute' };
  }
}

export function rateLimitResponse(result) {
  const error = result.scope === 'day'
    ? 'Daily message limit reached. It resets at midnight UTC.'
    : 'Rate limit hit. Please wait a moment and try again.';
  return new Response(JSON.stringify({ error, limit: result.scope }), {
    status: 429,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Retry-After': String(result.retryAfter) },
  });
}
