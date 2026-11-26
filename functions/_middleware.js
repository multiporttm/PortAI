/* This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// Cache busting for every deploy. Browsers (and zone settings such as Cloudflare's
// "Browser Cache TTL") can keep old JavaScript/CSS for hours, so a freshly loaded
// page could run yesterday's code. Every script, stylesheet and module import gets
// the deploy's version in its URL (?v=abc123), so a new deploy always loads new files.

import { versionImports } from '../lib/portai-version.mjs';

export async function onRequest({ request, next, env }) {
  const res = await next();
  const v = String(env.CF_PAGES_COMMIT_SHA || '').slice(0, 12);
  if (!v || res.status !== 200 || request.method !== 'GET') return res;
  const type = res.headers.get('content-type') || '';
  const path = new URL(request.url).pathname;

  if (type.includes('text/html') && typeof HTMLRewriter !== 'undefined') {
    const add = (attr) => ({ element(el) { const u = el.getAttribute(attr); if (u && u.startsWith('/') && !u.startsWith('//')) el.setAttribute(attr, `${u}${u.includes('?') ? '&' : '?'}v=${v}`); } });
    const out = new HTMLRewriter()
      .on('script[src]', add('src'))
      .on('link[rel="stylesheet"][href]', add('href'))
      .on('link[rel="modulepreload"][href]', add('href'))
      .transform(res);
    const headers = new Headers(out.headers);
    headers.set('Cache-Control', 'no-cache');
    headers.delete('ETag');
    return new Response(out.body, { status: out.status, headers });
  }

  if (path.endsWith('.js') && /javascript/.test(type)) {
    const headers = new Headers(res.headers);
    headers.delete('ETag');
    headers.delete('Content-Length');
    return new Response(versionImports(await res.text(), v), { status: res.status, headers });
  }

  return res;
}
