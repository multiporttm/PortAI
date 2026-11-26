-- PortAI accounts & end-to-end encrypted chat sync.
-- The server never sees passphrases or encryption keys:
--   accounts.id        = key derived from the passphrase in the browser (HKDF "id")
--   accounts.auth_hash = SHA-256 of a second derived key (HKDF "auth")
--   chats.data         = AES-256-GCM ciphertext (base64), key never leaves the browser
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  auth_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS chats (
  account_id TEXT NOT NULL,
  id TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (account_id, id)
);
