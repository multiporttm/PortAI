/* This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// Minimal Cloudflare D1 API shim on top of node:sqlite, for tests.
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';

export function createD1() {
  const db = new DatabaseSync(':memory:');
  for (const f of ["0001_accounts.sql", "0002_rate_limits.sql"]) db.exec(fs.readFileSync(new URL(`../migrations/${f}`, import.meta.url), "utf8"));
  const stmt = (sql, args = []) => ({
    bind: (...a) => stmt(sql, a),
    first: async () => db.prepare(sql).get(...args) ?? null,
    all: async () => ({ results: db.prepare(sql).all(...args) }),
    run: async () => { const st = db.prepare(sql); if (/returning/i.test(sql)) return { success: true, results: st.all(...args) }; st.run(...args); return { success: true, results: [] }; },
  });
  return {
    prepare: (sql) => stmt(sql),
    batch: async (stmts) => Promise.all(stmts.map((s) => s.run())),
    raw: db,
  };
}
