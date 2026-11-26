// PortAI accounts: zero-knowledge, end-to-end encrypted sync.
//
// passphrase ──PBKDF2-SHA256 (600k)──▶ master ──HKDF──┬─ "id"   → account id (sent to server)
//                                                     ├─ "auth" → login secret (server stores SHA-256 of it)
//                                                     └─ "enc"  → AES-256-GCM key (never leaves this browser)
//
// The server only ever sees the id, the auth secret and ciphertext. It cannot
// read chats, and it cannot recover the passphrase or the encryption key.

const enc = new TextEncoder();
const dec = new TextDecoder();
const PBKDF2_ITERATIONS = 600_000;
const APP_SALT = 'portai/account/v1';
// Crockford-style alphabet without look-alike characters (no I, L, O, U, 0, 1).
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';

export const MIN_CUSTOM_LENGTH = 12;

/** A random passphrase like "K7QM-2XHD-9PRA-V4TS-6WNE" (~98 bits of entropy). */
export function generatePassphrase() {
  const out = [];
  const limit = 256 - (256 % ALPHABET.length); // avoid modulo bias
  while (out.length < 20) {
    for (const b of crypto.getRandomValues(new Uint8Array(32))) {
      if (b < limit && out.length < 20) out.push(ALPHABET[b % ALPHABET.length]);
    }
  }
  return out.join('').match(/.{4}/g).join('-');
}

/** Generated-style passphrases are case/space/dash-insensitive; custom ones are exact (trimmed). */
export function normalizePassphrase(p) {
  const trimmed = String(p || '').trim().replace(/\s+/g, ' ');
  const compact = trimmed.toUpperCase().replace(/[\s-]/g, '');
  if (compact.length === 20 && [...compact].every((c) => ALPHABET.includes(c))) return compact.match(/.{4}/g).join('-');
  return trimmed;
}

export function isGeneratedFormat(p) {
  return /^([2-9A-HJKMNP-TV-Z]{4}-){4}[2-9A-HJKMNP-TV-Z]{4}$/.test(normalizePassphrase(p));
}

const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const toB64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const toB64 = (bytes) => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(s); };
const fromB64 = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

/** Derive the account id, login secret and encryption key from a passphrase. */
export async function deriveAccount(passphrase) {
  const norm = normalizePassphrase(passphrase);
  const base = await crypto.subtle.importKey('raw', enc.encode(norm), 'PBKDF2', false, ['deriveBits']);
  const master = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(APP_SALT), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' }, base, 256);
  const hkdf = await crypto.subtle.importKey('raw', master, 'HKDF', false, ['deriveBits', 'deriveKey']);
  const params = (info) => ({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info: enc.encode(`${APP_SALT}/${info}`) });
  const id = toHex(await crypto.subtle.deriveBits(params('id'), hkdf, 256));
  const auth = toB64url(await crypto.subtle.deriveBits(params('auth'), hkdf, 256));
  const key = await crypto.subtle.deriveKey(params('enc'), hkdf, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  return { id, auth, key };
}

export class AccountError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

async function api(session, method, path, body) {
  let res;
  try {
    res = await fetch(path, {
      method,
      credentials: 'omit',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
      headers: { Authorization: `Bearer ${session.id}.${session.auth}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new AccountError('You appear to be offline.', 0);
  }
  let data = {};
  try { data = await res.json(); } catch { /* empty */ }
  if (!res.ok) throw new AccountError(data.error || `Request failed (${res.status}).`, res.status);
  return data;
}

export const createAccount = (session) => api(session, 'POST', '/api/account');
export const login = (session) => api(session, 'POST', '/api/account/login');
export const deleteAccount = (session) => api(session, 'DELETE', '/api/account');

/** Chat store backed by the server. Same interface as the local Vault. */
export class AccountStore {
  constructor(session) { this.session = session; this.kind = 'account'; }

  async #encrypt(chat) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, this.session.key, enc.encode(JSON.stringify(chat))));
    const packed = new Uint8Array(12 + ct.length);
    packed.set(iv);
    packed.set(ct, 12);
    return toB64(packed);
  }

  async #decrypt(b64) {
    const bytes = fromB64(b64);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.subarray(0, 12) }, this.session.key, bytes.subarray(12));
    return JSON.parse(dec.decode(pt));
  }

  async loadChats() {
    const { chats } = await api(this.session, 'GET', '/api/chats');
    const out = [];
    for (const c of chats) {
      if (c.deleted || !c.data) continue;
      try { out.push(await this.#decrypt(c.data)); } catch { /* not decryptable: skip */ }
    }
    return out.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async saveChat(chat) {
    await api(this.session, 'PUT', `/api/chats/${chat.id}`, { data: await this.#encrypt(chat), updatedAt: chat.updatedAt });
  }

  async deleteChat(id) {
    await api(this.session, 'DELETE', `/api/chats/${id}`);
  }
}
