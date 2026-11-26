/* This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// Cloudflare Pages Function: POST /api/chat
import { handleChat } from '../../lib/portai-core.mjs';

export async function onRequestPost({ request, env, waitUntil }) {
  const result = await handleChat(request, env);
  if (result instanceof Response) return result;
  waitUntil(result.done);
  return result.response;
}
