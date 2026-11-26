// Minimal Cloudflare D1 API shim on top of node:sqlite, for tests.
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';

export function createD1() {
  const db = new DatabaseSync(':memory:');
  db.exec(fs.readFileSync(new URL('../migrations/0001_accounts.sql', import.meta.url), 'utf8'));
  const stmt = (sql, args = []) => ({
    bind: (...a) => stmt(sql, a),
    first: async () => db.prepare(sql).get(...args) ?? null,
    all: async () => ({ results: db.prepare(sql).all(...args) }),
    run: async () => { db.prepare(sql).run(...args); return { success: true }; },
  });
  return {
    prepare: (sql) => stmt(sql),
    batch: async (stmts) => Promise.all(stmts.map((s) => s.run())),
    raw: db,
  };
}
