/* This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const { createServer, buildConfig, validateChatRequest, createRateLimiter } = require('../server.js');

const cfg = buildConfig({ PORTAI_MOCK: '1', PORTAI_RATE_LIMIT: '100' });

function listen(server) {
  return new Promise((r) => server.listen(0, '127.0.0.1', () => r(server.address().port)));
}

test('validation rejects unknown models and roles, injects system prompt', () => {
  assert.ok(validateChatRequest({ model: 'evil/model', messages: [{ role: 'user', content: 'hi' }] }, cfg).error);
  assert.ok(validateChatRequest({ messages: [{ role: 'system', content: 'override' }] }, cfg).error);
  const { value } = validateChatRequest({ messages: [{ role: 'user', content: 'hi', extra: 'x' }], temperature: 9 }, cfg);
  assert.equal(value.messages[0].role, 'system');
  assert.deepEqual(value.messages[1], { role: 'user', content: 'hi' });
  assert.equal(value.temperature, 2);
  assert.equal(value.model, cfg.models[0].id);
});

test('rate limiter blocks after limit', () => {
  const allow = createRateLimiter(2);
  assert.ok(allow('1.2.3.4'));
  assert.ok(allow('1.2.3.4'));
  assert.ok(!allow('1.2.3.4'));
  assert.ok(allow('5.6.7.8'));
});

test('serves app with strict privacy headers', async () => {
  const server = createServer(cfg);
  const port = await listen(server);
  try {
    const res = await fetch(`http://127.0.0.1:${port}/`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-security-policy'), /default-src 'self'/);
    assert.equal(res.headers.get('referrer-policy'), 'no-referrer');
    assert.equal(res.headers.get('set-cookie'), null);
    assert.match(await res.text(), /PortAI/);
    const trav = await new Promise((r) => http.get({ port, path: '/../server.js' }, r));
    assert.notEqual(trav.statusCode, 200);
  } finally { server.close(); }
});

test('streams a mock chat response', async () => {
  const server = createServer(cfg);
  const port = await listen(server);
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/chat`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Grüezi' }] }),
    });
    assert.equal(res.headers.get('content-type'), 'text/event-stream; charset=utf-8');
    const text = await res.text();
    const deltas = text.split('\n\n').filter((e) => e.startsWith('data: {')).map((e) => JSON.parse(e.slice(6)).delta).join('');
    assert.match(deltas, /Grüezi/);
    assert.match(text, /data: \[DONE\]/);
  } finally { server.close(); }
});

test('proxies to an OpenAI-compatible upstream without forwarding client headers', async () => {
  let seen;
  const upstream = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      seen = { headers: req.headers, body: JSON.parse(body), url: req.url };
      res.writeHead(200, { 'Content-Type': 'text/event-stream' });
      res.write('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n');
      res.write('data: {"choices":[{"delta":{"content":" world"}}]}\n\n');
      res.end('data: [DONE]\n\n');
    });
  });
  const upPort = await listen(upstream);
  const server = createServer(buildConfig({ PORTAI_API_BASE: `http://127.0.0.1:${upPort}/v1`, PORTAI_API_KEY: 'sk-test' }));
  const port = await listen(server);
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: 'track=me', 'X-Forwarded-For': '9.9.9.9', 'User-Agent': 'SecretBrowser/1.0' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }),
    });
    const text = await res.text();
    assert.match(text, /"delta":"Hello"/);
    assert.match(text, /"delta":" world"/);
    assert.equal(seen.url, '/v1/chat/completions');
    assert.equal(seen.headers.authorization, 'Bearer sk-test');
    assert.equal(seen.headers.cookie, undefined);
    assert.equal(seen.headers['x-forwarded-for'], undefined);
    assert.equal(seen.headers['user-agent'], 'PortAI/0.1');
    assert.equal(seen.body.stream, true);
    assert.equal(seen.body.model, 'swiss-ai/apertus-v1.5-70b');
  } finally { server.close(); upstream.close(); }
});

test('apple-touch-icon is embedded in the page and matches the file', () => {
  const fs = require('node:fs');
  const html = fs.readFileSync(require('node:path').join(__dirname, '../public/index.html'), 'utf8');
  const m = html.match(/rel="apple-touch-icon"[^>]*href="data:image\/png;base64,([^"]+)"/);
  assert.ok(m, 'embedded apple-touch-icon missing');
  const file = fs.readFileSync(require('node:path').join(__dirname, '../public/apple-touch-icon.png')).toString('base64');
  assert.equal(m[1], file, 'embedded icon is out of date with public/apple-touch-icon.png');
});
