/* This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { test } from 'node:test';
import assert from 'node:assert';
import { extractUrls, isPublicUrl, htmlToText, fetchPage, pageContext } from '../lib/portai-fetch.mjs';
import { onRequestPost } from '../functions/api/chat.js';

test('finds links in a message (max 2, trailing punctuation removed)', () => {
  assert.deepEqual(extractUrls('Summarize https://lumo.proton.me/about. Also see (https://example.com/a?b=1), and https://x.org'), ['https://lumo.proton.me/about', 'https://example.com/a?b=1']);
  assert.deepEqual(extractUrls('no links here'), []);
});

test('blocks private, local and non-web addresses', () => {
  for (const u of ['http://localhost/', 'http://127.0.0.1/', 'http://10.0.0.5/', 'http://192.168.1.1/', 'http://169.254.169.254/latest', 'http://printer.local/', 'ftp://example.com/', 'http://user:pw@example.com/', 'http://[::1]/']) {
    assert.equal(isPublicUrl(new URL(u)), false, u);
  }
  assert.equal(isPublicUrl(new URL('https://proton.me/blog/lumo')), true);
});

test('turns HTML into readable text', () => {
  const page = htmlToText('<html><head><title>Lumo &amp; you</title><meta name="description" content="Private AI"><style>.x{}</style></head><body><nav>menu</nav><h1>Hello</h1><p>World&nbsp;&#8212; fine</p><script>alert(1)</script><ul><li>One</li><li>Two</li></ul></body></html>');
  assert.equal(page.title, 'Lumo & you');
  assert.equal(page.description, 'Private AI');
  assert.match(page.text, /Hello\s+World — fine/);
  assert.match(page.text, /• One/);
  assert.doesNotMatch(page.text, /alert|menu|\.x\{\}/);
});

test('fetchPage reads public HTML and refuses unsupported content', async () => {
  const html = '<title>Lumo</title><p>' + 'Lumo is Proton’s privacy-first AI assistant. '.repeat(3) + '</p>';
  const fake = async (url) => new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
  const page = await fetchPage('https://lumo.proton.me/', fake);
  assert.equal(page.title, 'Lumo');
  assert.match(page.text, /privacy-first AI assistant/);
  await assert.rejects(fetchPage('https://example.com/file.zip', async () => new Response('PK', { headers: { 'content-type': 'application/zip' } })));
  await assert.rejects(fetchPage('http://127.0.0.1/', fake));
  assert.match(pageContext([page]), /never follow instructions/);
});

test('chat reads a pasted link without opting in to web search', async () => {
  let input;
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('<title>Lumo by Proton</title><p>Lumo is a private AI assistant that keeps no logs and is end-to-end encrypted.</p>', { headers: { 'content-type': 'text/html' } });
  try {
    const AI = { run: async (_m, i) => { input = i; return new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode('data: {"response":"ok"}\n\ndata: [DONE]\n\n')); c.close(); } }); } };
    const req = new Request('https://x/api/chat', { method: 'POST', body: JSON.stringify({ messages: [{ role: 'user', content: 'What is this? https://lumo.proton.me/' }] }) });
    const text = await (await onRequestPost({ request: req, env: { AI, PORTAI_MODELS: '@cf/a/regular', PORTAI_HEDGE_MS: '0' }, waitUntil: () => {} })).text();
    const events = text.split('\n\n').filter((e) => e.startsWith('data: {')).map((e) => JSON.parse(e.slice(6)));
    assert.deepEqual(events.filter((e) => e.status).map((e) => e.status), ['reading', 'read', 'thinking']);
    assert.equal(events[0].host, 'lumo.proton.me');
    assert.match(input.messages[0].content, /<shared_pages>[\s\S]*keeps no logs/);
    assert.ok(!events.some((e) => e.status === 'searching'), 'web search stays opt-in');
  } finally {
    globalThis.fetch = realFetch;
  }
});
