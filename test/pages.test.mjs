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

test('pages chat streams from Workers AI binding without an API key', async () => {
  let called;
  const AI = {
    async run(model, input) {
      called = { model, input };
      const enc = new TextEncoder();
      return new ReadableStream({
        start(c) {
          c.enqueue(enc.encode('data: {"response":"Hoi "}\n\ndata: {"respo'));
          c.enqueue(enc.encode('nse":"zäme"}\n\ndata: [DONE]\n\n'));
          c.close();
        },
      });
    },
  };
  const req = new Request('https://x/api/chat', { method: 'POST', body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }) });
  const env = { AI, PORTAI_MODELS: '@cf/swiss-ai/apertus-v1.5-8b' };
  const text = await (await onRequestPost(ctx(req, env))).text();
  const out = text.split('\n\n').filter((e) => e.startsWith('data: {')).map((e) => JSON.parse(e.slice(6)).delta).join('');
  assert.equal(out, 'Hoi zäme');
  assert.equal(called.model, '@cf/swiss-ai/apertus-v1.5-8b');
  assert.equal(called.input.stream, true);
  assert.equal(called.input.messages[0].role, 'system');
});

test('pages chat explains exhausted free allowance', async () => {
  const AI = { run: async () => { throw new Error('3036: You have used up your daily free allocation of 10,000 neurons'); } };
  const req = new Request('https://x/api/chat', { method: 'POST', body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }) });
  const text = await (await onRequestPost(ctx(req, { AI, PORTAI_MODELS: '@cf/swiss-ai/apertus-v1.5-8b' }))).text();
  assert.match(text, /free AI allowance/);
});

test('pages chat handles OpenAI-style Workers AI chunks and hides reasoning', async () => {
  const AI = {
    async run() {
      const enc = new TextEncoder();
      return new ReadableStream({
        start(c) {
          c.enqueue(enc.encode('data: {"choices":[{"delta":{"reasoning_content":"secret thoughts"}}]}\n\n'));
          c.enqueue(enc.encode('data: {"choices":[{"delta":{"content":"Hello!"}}]}\n\ndata: [DONE]\n\n'));
          c.close();
        },
      });
    },
  };
  const req = new Request('https://x/api/chat', { method: 'POST', body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }) });
  const text = await (await onRequestPost(ctx(req, { AI, PORTAI_MODELS: '@cf/google/gemma-4-26b-a4b-it' }))).text();
  assert.match(text, /"delta":"Hello!"/);
  assert.doesNotMatch(text, /secret thoughts/);
});

test('system prompt includes Multiport knowledge, rules and Port model name', async () => {
  const fs = await import('node:fs');
  const { renderKnowledgeModule } = await import('../scripts/build-knowledge.mjs');
  const md = fs.readFileSync(new URL('../MULTIPORT_KNOWLEDGE.md', import.meta.url), 'utf8');
  const generated = fs.readFileSync(new URL('../lib/multiport-knowledge.mjs', import.meta.url), 'utf8');
  assert.equal(generated, renderKnowledgeModule(md), 'lib/multiport-knowledge.mjs is stale: run `npm run knowledge`');

  let sent;
  const AI = { async run(_m, input) { sent = input; return new ReadableStream({ start(c) { c.close(); } }); } };
  const req = new Request('https://x/api/chat', { method: 'POST', body: JSON.stringify({ model: '@cf/zai-org/glm-4.7-flash', messages: [{ role: 'user', content: 'What is Multiport?' }] }) });
  await (await onRequestPost(ctx(req, { AI, PORTAI_MODELS: '@cf/google/gemma-4-26b-a4b-it,@cf/zai-org/glm-4.7-flash', PORTAI_MODEL_LABELS: 'Port 1.1,Port 1.0' }))).text();
  const sys = sent.messages[0].content;
  assert.match(sys, /PortAI Port 1\.0/);
  assert.match(sys, /<multiport_knowledge>[\s\S]*Multiport Counter App[\s\S]*<\/multiport_knowledge>/);
  assert.match(sys, /portai\.multiportllc\.com/);
  assert.match(sys, /PortAI itself has no analytics/);
});
