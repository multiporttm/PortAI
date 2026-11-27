/* This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { test } from 'node:test';
import assert from 'node:assert';
import { onRequestPost } from '../functions/api/chat.js';
import { imagePrompt, validateChatRequest, buildConfig } from '../lib/portai-core.mjs';

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

function fakeAI() {
  const calls = [];
  return {
    calls,
    async run(model, input) {
      calls.push({ model, input });
      if (/flux/.test(model)) return { image: 'AAAA' };
      if (!input.stream) return { response: 'NO' };
      return new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode('data: {"response":"I see a cat."}\n\ndata: [DONE]\n\n')); c.close(); } });
    },
  };
}
const chat = async (AI, messages, model) => {
  const env = { AI, PORTAI_MODELS: '@cf/zai-org/glm-4.7-flash,@cf/google/gemma-4-26b-a4b-it', PORTAI_HEDGE_MS: '0' };
  const req = new Request('https://x/api/chat', { method: 'POST', body: JSON.stringify({ model, search: 'auto', messages }) });
  const text = await (await onRequestPost({ request: req, env, waitUntil: () => {} })).text();
  return text.split('\n\n').filter((e) => e.startsWith('data: {')).map((e) => JSON.parse(e.slice(6)));
};

test('detects requests to create images', () => {
  assert.equal(imagePrompt('Draw a cat in space'), 'a cat in space');
  assert.equal(imagePrompt('draw me a dragon'), 'a dragon');
  assert.equal(imagePrompt('Can you generate an image of a castle at sunset?'), 'a castle at sunset');
  assert.equal(imagePrompt('Make a logo for my bakery'), 'a logo for my bakery');
  assert.equal(imagePrompt('make a cartoon image of a dog'), 'a dog, cartoon style');
  assert.equal(imagePrompt('Draw conclusions from this data'), null);
  assert.equal(imagePrompt('How do I draw a horse?'), null);
  assert.equal(imagePrompt('Generate a python script'), null);
});

test('validates attached images', () => {
  const cfg = buildConfig({});
  assert.ok(validateChatRequest({ messages: [{ role: 'user', content: 'hi', images: [PNG] }] }, cfg).value.images.length === 1);
  assert.match(validateChatRequest({ messages: [{ role: 'user', content: 'hi', images: ['data:text/html;base64,AAAA'] }] }, cfg).error, /JPEG, PNG/);
  assert.match(validateChatRequest({ messages: [{ role: 'user', content: 'hi', images: [PNG, PNG, PNG, PNG, PNG] }] }, cfg).error, /Up to 4/);
  assert.match(validateChatRequest({ messages: [{ role: 'assistant', content: 'hi', images: [PNG] }] }, cfg).error, /Up to 4/);
  const v = validateChatRequest({ messages: [{ role: 'user', content: '', images: [PNG] }] }, cfg).value;
  assert.equal(v.messages.at(-1).content, 'What is in this image?');
});

test('attached images go to a vision model as image parts', async () => {
  const AI = fakeAI();
  const events = await chat(AI, [{ role: 'user', content: "What's wrong here?", images: [PNG] }], '@cf/zai-org/glm-4.7-flash');
  const vision = events.find((e) => e.status === 'vision');
  assert.ok(vision, 'shows the vision step');
  const call = AI.calls.find((c) => c.input.stream);
  assert.equal(call.model, '@cf/google/gemma-4-26b-a4b-it', 'switched to the model that can see');
  const last = call.input.messages.at(-1);
  assert.deepEqual(last.content[1], { type: 'image_url', image_url: { url: PNG } });
  assert.equal(last.content[0].text, "What's wrong here?");
  assert.ok(!events.some((e) => e.status === 'searching'), 'no web search for image questions');
  assert.ok(events.some((e) => e.delta === 'I see a cat.'));
});

test('"draw ..." creates an image instead of text', async () => {
  const AI = fakeAI();
  const events = await chat(AI, [{ role: 'user', content: 'Draw a cat in space' }]);
  assert.ok(events.some((e) => e.status === 'drawing'));
  const img = events.find((e) => e.image);
  assert.equal(img.image, 'data:image/jpeg;base64,AAAA');
  const flux = AI.calls.find((c) => /flux/.test(c.model));
  assert.equal(flux.input.prompt, 'a cat in space', 'falls back to the original prompt when the rewrite is unusable');
  assert.ok(!AI.calls.some((c) => c.input.stream), 'no chat model call');
});

test('notes that real brand logos are only lookalikes', async () => {
  const { brandLogoNote } = await import('../lib/portai-core.mjs');
  assert.match(brandLogoNote('a Google analytics logo'), /lookalike/);
  assert.match(brandLogoNote('the Nike logo'), /lookalike/);
  assert.equal(brandLogoNote('a logo for my bakery'), '');
  assert.equal(brandLogoNote('a logo for Multiport'), '');
  assert.equal(brandLogoNote('a cat in space'), '');
});

test('ordinary requests are not mistaken for drawing', async () => {
  const { imageFollowUp } = await import('../lib/portai-core.mjs');
  for (const t of ['make an art project plan', 'Create an image description for alt text', 'Draw the line between work and life', 'Show me a picture of how to tie a tie', 'paint me a picture with words about autumn']) assert.equal(imagePrompt(t), null, t);
  const after = (t) => imageFollowUp([{ role: 'user', content: 'Draw a cat' }, { role: 'assistant', content: "Here's your image of **a cat**, created with 🍎 Neon Apple." }, { role: 'user', content: t }]);
  assert.equal(after('Try again'), 'a cat');
  assert.equal(after('make it blue'), 'a cat, make it blue');
  assert.equal(after('In what year was the Eiffel Tower built?'), null);
  assert.equal(after('More details please'), null);
  assert.equal(after('But why is it blurry?'), null);
});

test('"show me pictures of ..." finds real photos instead of drawing', async () => {
  const { photoQuery, findPhotos } = await import('../lib/portai-photos.mjs');
  assert.equal(photoQuery('Show me pictures of the Eiffel Tower'), 'the Eiffel Tower');
  assert.equal(photoQuery('What does a capybara look like?'), 'a capybara');
  assert.equal(photoQuery('find photos of Tokyo at night'), 'Tokyo at night');
  assert.equal(photoQuery('Draw a cat'), null);
  assert.equal(photoQuery('What does it look like?'), null);
  assert.equal(imagePrompt('Show me pictures of the Eiffel Tower'), null, 'Neon Apple stays for drawing');
  const jpeg = new Uint8Array(2000).fill(7);
  const fakeFetch = async (url) => {
    const u = new URL(String(url));
    if (u.hostname === 'api.openverse.org') {
      assert.equal(u.searchParams.get('q'), 'Eiffel Tower');
      return { ok: true, text: async () => JSON.stringify({ results: [{ title: 'Eiffel', thumbnail: 'https://img.example/1.jpg', foreign_landing_url: 'https://flickr.example/1', creator: 'Ann', license: 'by', license_version: '2.0' }] }) };
    }
    if (u.hostname === 'img.example') return { ok: true, headers: new Headers({ 'content-type': 'image/jpeg' }), arrayBuffer: async () => jpeg.buffer };
    throw new Error(`unexpected ${u.hostname}`);
  };
  const { provider, photos } = await findPhotos('Eiffel Tower', fakeFetch);
  assert.equal(provider, 'openverse');
  assert.equal(photos.length, 1);
  assert.match(photos[0].src, /^data:image\/jpeg;base64,/);
  assert.equal(photos[0].credit, 'Ann · BY 2.0');
  assert.equal(photos[0].page, 'https://flickr.example/1');
});
