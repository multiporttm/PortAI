/* This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { test } from 'node:test';
import assert from 'node:assert';
import { createD1 } from './d1-shim.mjs';
import * as account from '../functions/api/account/index.js';
import * as loginFn from '../functions/api/account/login.js';
import * as chats from '../functions/api/chats/index.js';
import * as chat from '../functions/api/chats/[id].js';

const ID = 'a'.repeat(64);
const AUTH = 'b'.repeat(43);
const auth = (id = ID, a = AUTH) => ({ Authorization: `Bearer ${id}.${a}` });
const req = (method, headers = {}, body) => new Request('https://x/api', { method, headers, body: body && JSON.stringify(body) });
const CHAT = '0123456789abcdef01234567';

test('account lifecycle with encrypted chat sync', async () => {
  const env = { DB: createD1() };

  // login before creation -> 404
  assert.equal((await loginFn.onRequestPost({ request: req('POST', auth()), env })).status, 404);
  // create
  assert.equal((await account.onRequestPost({ request: req('POST', auth()), env })).status, 201);
  // server stores only a hash of the auth secret
  const row = env.DB.raw.prepare('SELECT * FROM accounts').get();
  assert.notEqual(row.auth_hash, AUTH);
  assert.equal(row.auth_hash.length, 64);
  // creating again with same passphrase is idempotent
  assert.equal((await account.onRequestPost({ request: req('POST', auth()), env })).status, 200);
  // wrong auth for existing id
  assert.equal((await loginFn.onRequestPost({ request: req('POST', auth(ID, 'c'.repeat(43))), env })).status, 401);
  assert.equal((await loginFn.onRequestPost({ request: req('POST', auth()), env })).status, 200);

  // upload, last-write-wins
  const put = (data, updatedAt) => chat.onRequestPut({ request: req('PUT', { ...auth(), 'Content-Type': 'application/json' }, { data, updatedAt }), env, params: { id: CHAT } });
  assert.equal((await put('AAAA', 2000)).status, 200);
  assert.equal((await put('BBBB', 1000)).status, 200); // older -> ignored
  let list = await (await chats.onRequestGet({ request: req('GET', auth()), env })).json();
  assert.deepEqual(list.chats, [{ id: CHAT, data: 'AAAA', updatedAt: 2000, deleted: false }]);

  // other accounts can't see it
  const OTHER = 'd'.repeat(64);
  await account.onRequestPost({ request: req('POST', auth(OTHER)), env });
  list = await (await chats.onRequestGet({ request: req('GET', auth(OTHER)), env })).json();
  assert.equal(list.chats.length, 0);

  // rejects non-ciphertext and bad ids
  assert.equal((await put('<script>', 3000)).status, 400);
  assert.equal((await chat.onRequestPut({ request: req('PUT', auth(), { data: 'AAAA', updatedAt: 1 }), env, params: { id: '../x' } })).status, 400);

  // delete -> tombstone
  assert.equal((await chat.onRequestDelete({ request: req('DELETE', auth()), env, params: { id: CHAT } })).status, 200);
  list = await (await chats.onRequestGet({ request: req('GET', auth()), env })).json();
  assert.equal(list.chats[0].deleted, true);
  assert.equal(list.chats[0].data, '');

  // delete account removes everything
  assert.equal((await account.onRequestDelete({ request: req('DELETE', auth()), env })).status, 200);
  assert.equal(env.DB.raw.prepare('SELECT COUNT(*) AS n FROM chats WHERE account_id = ?').get(ID).n, 0);
  assert.equal((await loginFn.onRequestPost({ request: req('POST', auth()), env })).status, 404);
});

test('requests without credentials or DB are rejected', async () => {
  assert.equal((await loginFn.onRequestPost({ request: req('POST'), env: { DB: createD1() } })).status, 401);
  assert.equal((await loginFn.onRequestPost({ request: req('POST', auth()), env: {} })).status, 501);
});

test('durable rate limit: per-minute and per-day, IPs stored only as hashes', async () => {
  const { rateLimit } = await import('../lib/portai-ratelimit.mjs');
  const env = { DB: createD1() };
  for (let i = 0; i < 3; i++) assert.equal((await rateLimit(env, 'chat', '1.2.3.4', { perMinute: 3, perDay: 5 })).ok, true);
  const blocked = await rateLimit(env, 'chat', '1.2.3.4', { perMinute: 3, perDay: 5 });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.scope, 'minute');
  assert.ok(blocked.retryAfter >= 1 && blocked.retryAfter <= 60);
  assert.equal((await rateLimit(env, 'chat', '5.6.7.8', { perMinute: 3, perDay: 5 })).ok, true, 'other people unaffected');
  const rows = env.DB.raw.prepare('SELECT key FROM rate_limits').all();
  assert.ok(rows.every((r) => !r.key.includes('1.2.3.4') && /^[md]:[a-f0-9]{64}$/.test(r.key)));

  // daily limit across minutes
  const env2 = { DB: createD1() };
  for (let i = 0; i < 5; i++) await rateLimit(env2, 'chat', '9.9.9.9', { perMinute: 100, perDay: 5 });
  const day = await rateLimit(env2, 'chat', '9.9.9.9', { perMinute: 100, perDay: 5 });
  assert.equal(day.scope, 'day');
  assert.ok(day.retryAfter > 60);
});
