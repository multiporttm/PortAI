/* This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. */

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
  await (await onRequestPost(ctx(req, { AI, PORTAI_MODELS: '@cf/google/gemma-4-26b-a4b-it,@cf/zai-org/glm-4.7-flash', PORTAI_MODEL_LABELS: 'Regular,Lite' }))).text();
  const sys = sent.messages[0].content;
  assert.match(sys, /just say you are PortAI\./);
  assert.doesNotMatch(sys, /PortAI Lite/);
  assert.match(sys, /<multiport_knowledge>[\s\S]*Multiport Counter App[\s\S]*<\/multiport_knowledge>/);
  assert.match(sys, /portai\.multiportllc\.com/);
  assert.match(sys, /PortAI itself has no analytics/);
  assert.match(sys, /never as Gemma, GLM/);
  assert.match(sys, /recommend it by name with its link/);
});

test('Workers AI calls disable thinking and allow long replies', async () => {
  let input;
  const AI = { async run(_m, i) { input = i; return new ReadableStream({ start(c) { c.close(); } }); } };
  const req = new Request('https://x/api/chat', { method: 'POST', body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }) });
  await (await onRequestPost(ctx(req, { AI, PORTAI_MODELS: '@cf/google/gemma-4-26b-a4b-it' }))).text();
  assert.deepEqual(input.chat_template_kwargs, { enable_thinking: false });
  assert.equal(input.max_tokens, 2048);
});

test('Workers AI numeric tokens (older models send digits as numbers) are kept', async () => {
  const AI = {
    async run() {
      const enc = new TextEncoder();
      return new ReadableStream({ start(c) {
        c.enqueue(enc.encode('data: {"response":"UseX "}\n\ndata: {"response":1}\n\ndata: {"response":"."}\n\ndata: {"response":0}\n\ndata: {"response":" s[::-"}\n\ndata: {"response":1}\n\ndata: {"response":"]"}\n\ndata: [DONE]\n\n'));
        c.close();
      } });
    },
  };
  const req = new Request('https://x/api/chat', { method: 'POST', body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }) });
  const text = await (await onRequestPost(ctx(req, { AI, PORTAI_MODELS: '@cf/qwen/qwen2.5-coder-32b-instruct' }))).text();
  const out = text.split('\n\n').filter((e) => e.startsWith('data: {"delta"')).map((e) => JSON.parse(e.slice(6)).delta).join('');
  assert.equal(out, 'UseX 1.0 s[::-1]');
});

test('gpt-oss uses low reasoning effort instead of chat_template_kwargs', async () => {
  const { thinkingOff } = await import('../lib/portai-core.mjs');
  assert.deepEqual(thinkingOff('@cf/openai/gpt-oss-120b'), { reasoning_effort: 'low' });
  assert.deepEqual(thinkingOff('@cf/google/gemma-4-26b-a4b-it'), { chat_template_kwargs: { enable_thinking: false } });
});

function fakeAI(behaviour) {
  const calls = [];
  return {
    calls,
    async run(model) {
      calls.push(model);
      const b = behaviour[model];
      if (b.fail) { await new Promise((r) => setTimeout(r, b.delay || 0)); throw new Error(b.fail); }
      const enc = new TextEncoder();
      return new ReadableStream({
        async start(c) {
          await new Promise((r) => setTimeout(r, b.delay || 0));
          try { c.enqueue(enc.encode(`data: {"response":"${b.text}"}\n\ndata: [DONE]\n\n`)); c.close(); } catch { /* cancelled */ }
        },
      });
    },
  };
}
const hedgeEnv = (AI) => ({ AI, PORTAI_MODELS: '@cf/a/regular,@cf/b/lite', PORTAI_MODEL_LABELS: 'Regular,Lite', PORTAI_HEDGE_MS: '50' });
const runChat = async (env) => {
  const req = new Request('https://x/api/chat', { method: 'POST', body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }) });
  const text = await (await onRequestPost(ctx(req, env))).text();
  const events = text.split('\n\n').filter((e) => e.startsWith('data: {')).map((e) => JSON.parse(e.slice(6)));
  return { events, out: events.filter((e) => e.delta).map((e) => e.delta).join('') };
};

test('busy model: backup starts after the hedge delay and the faster one wins', async () => {
  const AI = fakeAI({ '@cf/a/regular': { delay: 400, text: 'slow' }, '@cf/b/lite': { delay: 10, text: 'fast' } });
  const { events, out } = await runChat(hedgeEnv(AI));
  assert.equal(out, 'fast');
  assert.deepEqual(AI.calls, ['@cf/a/regular', '@cf/b/lite']);
  assert.ok(events.some((e) => e.status === 'switched' && e.from === 'Regular' && e.to === 'Lite' && e.reason === 'busy'));
});

test('fast model: no backup is started', async () => {
  const AI = fakeAI({ '@cf/a/regular': { delay: 0, text: 'quick' }, '@cf/b/lite': { delay: 0, text: 'unused' } });
  const { events, out } = await runChat(hedgeEnv(AI));
  assert.equal(out, 'quick');
  assert.deepEqual(AI.calls, ['@cf/a/regular']);
  assert.ok(!events.some((e) => e.status === 'switched'));
});

test('failing model falls back immediately; both failing shows a friendly error', async () => {
  let AI = fakeAI({ '@cf/a/regular': { fail: '3040: Capacity temporarily exceeded' }, '@cf/b/lite': { delay: 0, text: 'backup' } });
  let r = await runChat(hedgeEnv(AI));
  assert.equal(r.out, 'backup');
  assert.ok(r.events.some((e) => e.status === 'switched' && e.reason === 'error'));
  AI = fakeAI({ '@cf/a/regular': { fail: '3040: Capacity temporarily exceeded' }, '@cf/b/lite': { fail: '3040: Capacity temporarily exceeded' } });
  r = await runChat(hedgeEnv(AI));
  assert.ok(r.events.some((e) => e.error === 'The model is busy right now. Please try again in a moment.'));
});

test('knowledge rules tell the model to answer non-Multiport questions normally', async () => {
  const { KNOWLEDGE_RULES } = await import('../lib/portai-core.mjs');
  assert.match(KNOWLEDGE_RULES, /answer normally from your own general knowledge/);
});

test('detailed PortAI/help knowledge is only sent when the question needs it', async () => {
  const { composeSystemPrompt, buildConfig, needsDetails } = await import('../lib/portai-core.mjs');
  const cfg = buildConfig({});
  const general = composeSystemPrompt(cfg, cfg.models[0].id, undefined, [{ role: 'user', content: 'Explain photosynthesis' }]);
  const help = composeSystemPrompt(cfg, cfg.models[0].id, undefined, [{ role: 'user', content: 'How do I sync my chats to my phone?' }]);
  assert.match(general, /Multiport Counter App/, 'product list is always there (for recommendations)');
  assert.doesNotMatch(general, /PortAI user guide/);
  assert.match(help, /PortAI user guide[\s\S]*Accounts and sync/);
  assert.ok(help.length > general.length + 5000);
  assert.equal(needsDetails([{ role: 'user', content: 'Can you write me a poem?' }]), false);
  assert.equal(needsDetails([{ role: 'user', content: 'Is Lumo better than PortAI?' }]), true);
});
