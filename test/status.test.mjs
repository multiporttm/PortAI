/* This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { test } from 'node:test';
import assert from 'node:assert';
import { mentionsMultiport, formatSeconds } from '../public/status.js';

test('Multiport detection for the "Checked Multiport knowledge" step', () => {
  assert.ok(mentionsMultiport('What does the Multiport Counter App do?'));
  assert.ok(mentionsMultiport('is there a counter app?'));
  assert.ok(mentionsMultiport('Tell me about PortAI'));
  assert.ok(!mentionsMultiport('What is the capital of Japan?'));
});

test('step timer formatting', () => {
  assert.equal(formatSeconds(900), '0.9s');
  assert.equal(formatSeconds(12_400), '12s');
});

test('chat stream announces when the model starts (drives the Thinking step)', async () => {
  const { onRequestPost } = await import('../functions/api/chat.js');
  const req = new Request('https://x/api/chat', { method: 'POST', body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }) });
  const text = await (await onRequestPost({ request: req, env: { PORTAI_MOCK: '1' }, waitUntil: () => {} })).text();
  assert.ok(text.indexOf('"status":"thinking"') < text.indexOf('"delta"'));
});
