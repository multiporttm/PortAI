// Cloudflare Pages Function: POST /api/chat
import { handleChat } from '../../lib/portai-core.mjs';

export async function onRequestPost({ request, env, waitUntil }) {
  const result = await handleChat(request, env);
  if (result instanceof Response) return result;
  waitUntil(result.done);
  return result.response;
}
