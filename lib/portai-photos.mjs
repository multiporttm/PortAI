/* This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// "Show me pictures of ..." -> real photos from the web (not AI images).
// Sources: Openverse (openly licensed images, by WordPress) and Wikimedia Commons, both free
// with no key. PortAI's server downloads the thumbnails and sends them inline, so image hosts
// never see the user's IP address and the strict CSP (img-src 'self' data:) stays as it is.

const UA = 'PortAI/0.1 (privacy-first AI chatbot)';
const MAX_PHOTOS = 4;
const MAX_IMAGE_BYTES = 600 * 1024;
const TIMEOUT_MS = 5000;

const clean = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

// "show me pictures of X", "find photos of X", "pictures of X", "what does X look like"
const LEAD = /^(?:(?:can|could|would|will) you\s+|please\s+|pls\s+|i want to see\s+|i'd like to see\s+)*/i;
const PHOTO_RE = /^(?:(?:show|find|get|give|send|search(?: for)?|look up|pull up|display)(?:\s+(?:me|us))?\s+)?(?:some\s+|a few\s+|a couple of\s+|an?\s+|the\s+)?(?:real\s+|actual\s+)?(?:pictures?|photos?|images?|pics|photographs?)\s+(?:of|showing|from)\s+(.+)$/i;
const LOOK_RE = /^what (?:does|do|did)\s+(.+?)\s+look(?:s)? like$/i;

/** The search words if the user wants real photos of something, else null. */
export function photoQuery(text) {
  const t = String(text).trim().replace(/[?.!]+$/, '').replace(LEAD, '');
  if (t.length > 200 || /```|https?:\/\//.test(t)) return null;
  const m = t.match(PHOTO_RE) || t.match(LOOK_RE);
  if (!m) return null;
  const q = m[1].replace(/^(?:the|a|an)\s+(?=\S+\s)/i, (x) => x).trim();
  return q.length >= 2 && !/^(?:it|that|this|them|those|these|me|you)$/i.test(q) ? q : null;
}

function withTimeout(promise, ms = TIMEOUT_MS) {
  return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);
}

async function getJson(url, fetchImpl) {
  const res = await withTimeout(fetchImpl(url, { headers: { 'User-Agent': UA, 'Api-User-Agent': UA, Accept: 'application/json' } }));
  if (!res.ok) throw new Error(`http_${res.status}`);
  return JSON.parse(await res.text());
}

/** Openverse: openly licensed images from Flickr, Wikimedia and more. */
export async function openverseImages(query, fetchImpl = fetch) {
  const j = await getJson(`https://api.openverse.org/v1/images/?${new URLSearchParams({ q: query, page_size: '20', mature: 'false' })}`, fetchImpl);
  return (j.results || []).filter((r) => r.thumbnail || r.url).map((r) => ({
    thumb: r.thumbnail || r.url,
    title: clean(r.title) || query,
    page: r.foreign_landing_url || r.url,
    credit: [clean(r.creator), r.license ? `${String(r.license).toUpperCase()}${r.license_version ? ` ${r.license_version}` : ''}` : ''].filter(Boolean).join(' · '),
  }));
}

/** Wikimedia Commons file search (photos of places, things, animals, people, art). */
export async function commonsImages(query, fetchImpl = fetch) {
  const params = new URLSearchParams({
    action: 'query', format: 'json', formatversion: '2', origin: '*', generator: 'search', gsrnamespace: '6',
    gsrsearch: `${query} filetype:bitmap`, gsrlimit: '20', prop: 'imageinfo', iiprop: 'url|mime|extmetadata', iiurlwidth: '640',
    iiextmetadatafilter: 'Artist|LicenseShortName|ObjectName',
  });
  const j = await getJson(`https://commons.wikimedia.org/w/api.php?${params}`, fetchImpl);
  return (j.query?.pages || []).sort((a, b) => (a.index || 0) - (b.index || 0)).map((p) => {
    const info = p.imageinfo?.[0];
    if (!info || !/^image\/(jpeg|png|webp)$/.test(info.mime || '')) return null;
    const meta = info.extmetadata || {};
    return {
      thumb: info.thumburl || info.url,
      title: clean(meta.ObjectName?.value) || clean(p.title).replace(/^File:/, '').replace(/\.\w+$/, ''),
      page: info.descriptionurl,
      credit: [clean(meta.Artist?.value), clean(meta.LicenseShortName?.value)].filter(Boolean).join(' · '),
    };
  }).filter(Boolean);
}

/** Download a thumbnail and return it as a data URI (skips anything too big or not an image). */
async function inlineImage(url, fetchImpl) {
  const u = new URL(url);
  if (u.protocol !== 'https:') throw new Error('insecure');
  const res = await withTimeout(fetchImpl(u.href, { headers: { 'User-Agent': UA, Accept: 'image/jpeg,image/png,image/webp,image/*;q=0.8' }, redirect: 'follow' }));
  if (!res.ok) throw new Error(`http_${res.status}`);
  const type = (res.headers.get('content-type') || '').split(';')[0].trim();
  if (!/^image\/(jpeg|png|webp|gif)$/.test(type)) throw new Error('not_image');
  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.length > MAX_IMAGE_BYTES || buf.length < 500) throw new Error('size');
  let bin = '';
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return `data:${type};base64,${btoa(bin)}`;
}

const STOP = new Set('a an the of in on at and or for with to from some pictures picture photos photo images image'.split(' '));
const NOT_PHOTO = /\b(?:skeleton|skull|heart|brain|organs?|anatomy|specimen|bones?|teeth|tooth|dung|feces|faeces|droppings|footprints?|tracks|x-ray|microscop\w*|dissection|taxidermy|stuffed|preserved|fossil|map|diagram|chart|graph|logo|coat of arms|flag|stamp|coin|banknote|drawing|engraving|illustration|sketch|plan|schematic|icon|svg|clipart|poster|cover|scan|document|page|text|signature)\b/i;

/** Best matches first: the subject named early in the title, no diagrams/maps/skeletons. */
export function rankPhotos(query, candidates) {
  const words = String(query).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 1 && !STOP.has(w));
  const score = (c) => {
    const title = c.title.toLowerCase();
    const first = title.split(/[^\p{L}\p{N}]+/u).filter(Boolean).slice(0, Math.max(3, words.length + 1)).join(' ');
    let n = 0;
    for (const w of words) {
      const stem = w.length > 4 ? w.slice(0, -1) : w; // "capybaras" ~ "capybara"
      if (first.includes(stem)) n += 3; else if (title.includes(stem)) n += 1;
    }
    if (NOT_PHOTO.test(title) && !words.some((w) => NOT_PHOTO.test(w))) n -= 4;
    return n;
  };
  return candidates.map((c, i) => ({ c, i, s: score(c) })).sort((a, b) => b.s - a.s || a.i - b.i).map((x) => x.c);
}

/**
 * Find real photos for a query. Tries Openverse, then Wikimedia Commons.
 * @returns {Promise<{provider: string, photos: Array<{src:string,title:string,page:string,credit:string}>}>}
 */
export async function findPhotos(query, fetchImpl = fetch) {
  for (const [provider, search] of [['openverse', openverseImages], ['commons', commonsImages]]) {
    let candidates = [];
    try { candidates = await search(query, fetchImpl); } catch { continue; }
    const seen = new Set();
    candidates = rankPhotos(query, candidates.filter((c) => c.thumb && !seen.has(c.thumb) && seen.add(c.thumb))).slice(0, MAX_PHOTOS + 3);
    const loaded = await Promise.all(candidates.map(async (c) => {
      try { return { ...c, src: await inlineImage(c.thumb, fetchImpl) }; } catch { return null; }
    }));
    const photos = loaded.filter(Boolean).slice(0, MAX_PHOTOS).map(({ thumb, ...rest }) => rest);
    if (photos.length) return { provider, photos };
  }
  return { provider: 'none', photos: [] };
}
