-- Durable per-person rate limiting shared by all Cloudflare servers.
-- key = SHA-256(random secret salt + scope + IP address), so raw IPs are never stored.
-- Rows expire after their window (a minute or a day) and are cleaned up automatically.
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT NOT NULL,
  window INTEGER NOT NULL,
  count INTEGER NOT NULL,
  expires INTEGER NOT NULL,
  PRIMARY KEY (key, window)
);
CREATE INDEX IF NOT EXISTS rate_limits_expires ON rate_limits (expires);

CREATE TABLE IF NOT EXISTS settings (
  name TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
