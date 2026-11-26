// Cloudflare Pages Function: GET /api/health
export const onRequestGet = () => Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
