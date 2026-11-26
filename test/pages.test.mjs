import { test } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { onRequestPost } from '../functions/api/chat.js';
import { onRequestGet } from '../functions/api/config.js';

const ctx = (request, env) => ({ request, env, waitUntil: () => {} });

test('pages config lists models', async () => {
  const res = await onRequestGet({ env: { PORTAI_MODEL_LABELS: 'Apertus 70B,Apertus 8B' } });
  const body = await res.json();
  assert.equal(body.models[0].id, 'swiss-ai/apertus-v1.5-70b');
  assert.equal(body.models[1].label, 'Apertus 8B');
});

test('pages chat rejects unknown model', async () => {
  const req = new Request('https://x/api/chat', { method: 'POST', body: JSON.stringify({ model: 'evil', messages: [{ role: 'user', content: 'hi' }] }) });
  const res = await onRequestPost(ctx(req, {}));
  assert.equal(res.status, 400);
});

test('pages chat explains missing secret', async () => {
  const req = new Request('https://x/api/chat', { method: 'POST', body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }) });
  const text = await (await onRequestPost(ctx(req, {}))).text();
  assert.match(text, /PORTAI_API_KEY/);
});

test('pages chat proxies upstream stream without client headers', async () => {
  let seen;
  const upstream = http.createServer((req, res) => {
    let b = ''; req.on('data', (c) => { b += c; });
    req.on('end', () => {
      seen = { headers: req.headers, body: JSON.parse(b) };
      res.writeHead(200, { 'Content-Type': 'text/event-stream' });
      res.write('data: {"choices":[{"delta":{"content":"Grüezi"}}]}\n\n');
      res.end('data: [DONE]\n\n');
    });
  });
  await new Promise((r) => upstream.listen(0, '127.0.0.1', r));
  try {
    const req = new Request('https://x/api/chat', {
      method: 'POST',
      headers: { Cookie: 'a=b', 'CF-Connecting-IP': '1.2.3.4' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }),
    });
    const env = { PORTAI_API_BASE: `http://127.0.0.1:${upstream.address().port}/v1`, PORTAI_API_KEY: 'sk-test' };
    const text = await (await onRequestPost(ctx(req, env))).text();
    assert.match(text, /"delta":"Grüezi"/);
    assert.match(text, /\[DONE\]/);
    assert.equal(seen.headers.authorization, 'Bearer sk-test');
    assert.equal(seen.headers.cookie, undefined);
    assert.equal(seen.headers['cf-connecting-ip'], undefined);
    assert.equal(seen.headers['user-agent'], 'PortAI/0.1');
    assert.equal(seen.body.messages[0].role, 'system');
  } finally { upstream.close(); }
});
