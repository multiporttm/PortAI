/* This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { test } from 'node:test';
import assert from 'node:assert';
import { renderMarkdown } from '../public/markdown.js';

test('escapes HTML and unsafe links', () => {
  const out = renderMarkdown('<script>alert(1)</script> [x](javascript:alert(1)) <img src=x onerror=alert(1)>');
  assert.ok(!out.includes('<script'));
  assert.ok(!out.includes('<img'));
  assert.ok(!out.includes('href="javascript'));
});

test('renders common markdown', () => {
  const out = renderMarkdown('# Title\n\n**bold** and `code`\n\n- a\n- b\n\n```js\nconst x = "<b>";\n```\n\n| a | b |\n|---|---|\n| 1 | 2 |');
  assert.match(out, /<h2>Title<\/h2>/);
  assert.match(out, /<strong>bold<\/strong>/);
  assert.match(out, /<code>code<\/code>/);
  assert.match(out, /<ul><li>a<\/li><li>b<\/li><\/ul>/);
  assert.match(out, /const x = &quot;&lt;b&gt;&quot;;/);
  assert.match(out, /<td>2<\/td>/);
});

test('safe http links get noopener', () => {
  assert.match(renderMarkdown('[Apertus](https://www.swiss-ai.org)'), /rel="noopener noreferrer nofollow"/);
});
