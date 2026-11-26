// PortAI Vault — client-side encrypted storage for conversations.
//
// Everything (titles, messages, timestamps) is encrypted with AES-256-GCM
// before it touches IndexedDB. Two key modes:
//   - "passphrase": key derived with PBKDF2-SHA-256 (600k iterations) from a
//     passphrase the user types on every unlock. Nothing secret is stored.
//   - "device": a random, NON-EXTRACTABLE CryptoKey generated and kept by the
//     browser. Protects against casual disk inspection, not a compromised browser.

const DB_NAME = 'portai';
const DB_VERSION = 1;
const PBKDF2_ITERATIONS = 600_000;
const VERIFIER_TEXT = 'portai-vault-v1';

const enc = new TextEncoder();
const dec = new TextDecoder();

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
      if (!db.objectStoreNames.contains('chats')) db.createObjectStore('chats');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(store, mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    const result = fn(s);
    t.oncomplete = () => { db.close(); resolve(result && 'result' in result ? result.result : result); };
    t.onerror = () => { db.close(); reject(t.error); };
    t.onabort = () => { db.close(); reject(t.error); };
  });
}

const metaGet = (k) => tx('meta', 'readonly', (s) => s.get(k));
const metaSet = (k, v) => tx('meta', 'readwrite', (s) => s.put(v, k));

async function deriveKey(passphrase, salt) {
  const base = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function encryptWith(key, plaintext) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext));
  return { iv, ct: new Uint8Array(ct) };
}

async function decryptWith(key, { iv, ct }) {
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return dec.decode(pt);
}

export class Vault {
  #key = null;
  mode = null;
  kind = 'device';

  /** @returns {'new'|'passphrase'|'device'} */
  async status() {
    const mode = await metaGet('mode');
    return mode || 'new';
  }

  get unlocked() { return this.#key !== null; }

  async setupPassphrase(passphrase) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await deriveKey(passphrase, salt);
    const verifier = await encryptWith(key, VERIFIER_TEXT);
    await metaSet('salt', salt);
    await metaSet('verifier', verifier);
    await metaSet('mode', 'passphrase');
    this.#key = key;
    this.mode = 'passphrase';
  }

  async setupDevice() {
    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    await metaSet('deviceKey', key);
    await metaSet('mode', 'device');
    this.#key = key;
    this.mode = 'device';
  }

  /** Unlock. For device mode no passphrase is needed. Returns false on a wrong passphrase. */
  async unlock(passphrase) {
    const mode = await this.status();
    if (mode === 'device') {
      this.#key = await metaGet('deviceKey');
      this.mode = 'device';
      return !!this.#key;
    }
    if (mode !== 'passphrase') return false;
    const salt = await metaGet('salt');
    const verifier = await metaGet('verifier');
    const key = await deriveKey(passphrase, salt);
    try {
      if ((await decryptWith(key, verifier)) !== VERIFIER_TEXT) return false;
    } catch {
      return false;
    }
    this.#key = key;
    this.mode = 'passphrase';
    return true;
  }

  lock() { this.#key = null; }

  /** Re-encrypt existing history under a passphrase-derived key. */
  async switchToPassphrase(passphrase, chats) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await deriveKey(passphrase, salt);
    const verifier = await encryptWith(key, VERIFIER_TEXT);
    const records = [];
    for (const chat of chats) records.push([chat.id, await encryptWith(key, JSON.stringify(chat))]);
    await tx('chats', 'readwrite', (s) => { for (const [id, r] of records) s.put(r, id); });
    await metaSet('salt', salt);
    await metaSet('verifier', verifier);
    await metaSet('mode', 'passphrase');
    await tx('meta', 'readwrite', (s) => s.delete('deviceKey'));
    this.#key = key;
    this.mode = 'passphrase';
  }

  async saveChat(chat) {
    if (!this.#key) throw new Error('Vault locked');
    const record = await encryptWith(this.#key, JSON.stringify(chat));
    await tx('chats', 'readwrite', (s) => s.put(record, chat.id));
  }

  async deleteChat(id) {
    await tx('chats', 'readwrite', (s) => s.delete(id));
  }

  async loadChats() {
    if (!this.#key) throw new Error('Vault locked');
    const records = await tx('chats', 'readonly', (s) => s.getAll());
    const chats = [];
    for (const r of records || []) {
      try { chats.push(JSON.parse(await decryptWith(this.#key, r))); } catch { /* skip corrupt */ }
    }
    return chats.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /** Remember a signed-in account on this device (the AES key is stored non-extractable). */
  async saveSession(session) {
    await metaSet('account', { id: session.id, auth: session.auth, key: session.key });
  }

  async getSession() {
    try { return (await metaGet('account')) || null; } catch { return null; }
  }

  async clearSession() {
    await tx('meta', 'readwrite', (s) => s.delete('account'));
  }

  /** Permanently erases every trace of PortAI from this browser. */
  async eraseAll() {
    this.#key = null;
    await new Promise((resolve) => {
      const req = indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = req.onerror = req.onblocked = () => resolve();
    });
    try { localStorage.clear(); sessionStorage.clear(); } catch { /* ignore */ }
  }
}
