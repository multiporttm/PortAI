/* This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// Extra free knowledge sources for PortAI's web search. All are open APIs that allow
// this kind of use and need no key or signup:
//   - Open-Meteo: weather forecasts, place lookup and time zones (open-meteo.com)
//   - Frankfurter: currency exchange rates from the European Central Bank (frankfurter.dev)
//   - Free Dictionary API: English word definitions (dictionaryapi.dev, Wiktionary data)
//   - Hacker News search by Algolia: tech, startup and product news (hn.algolia.com)
//   - GDELT: recent news articles worldwide (gdeltproject.org)
// Only the search words leave PortAI: no IP address, cookies or chat history.

import { fetchPage } from './portai-fetch.mjs';

const UA = 'PortAI/0.1';
const TOOL_TIMEOUT_MS = 4000;

function withTimeout(promise, ms = TOOL_TIMEOUT_MS) {
  return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);
}

async function getJson(url, fetchImpl) {
  const res = await withTimeout(fetchImpl(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } }));
  if (!res.ok) throw new Error(`http_${res.status}`);
  return JSON.parse(await res.text());
}

const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const stripEnd = (s) => clean(s).replace(/^(the city of|the town of)\s+/i, '').replace(/[?.!,;:]+$/, '').replace(/\s+(today|tomorrow|tonight|now|right now|this week(end)?|next week|currently|please|like)$/i, '').trim();

// ---------- Places (Open-Meteo geocoding) ----------

export async function geocode(name, fetchImpl = fetch) {
  // "Paris, France" -> search "Paris", prefer a result in France.
  const [place, ...rest] = name.split(',').map((x) => x.trim()).filter(Boolean);
  if (!place) return null;
  const url = `https://geocoding-api.open-meteo.com/v1/search?${new URLSearchParams({ name: place, count: '5', language: 'en', format: 'json' })}`;
  const j = await getJson(url, fetchImpl);
  const results = j.results || [];
  const hint = rest.join(' ').toLowerCase();
  const pick = (hint && results.find((r) => [r.country, r.admin1, r.country_code].some((v) => v && (String(v).toLowerCase() === hint || String(v).toLowerCase().startsWith(hint) || hint.includes(String(v).toLowerCase()))))) || results[0];
  if (!pick) return null;
  return { name: [pick.name, pick.admin1, pick.country].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', '), latitude: pick.latitude, longitude: pick.longitude, timezone: pick.timezone, countryCode: pick.country_code };
}

// ---------- Weather (Open-Meteo forecast) ----------

const WMO = {
  0: 'clear sky', 1: 'mainly clear', 2: 'partly cloudy', 3: 'overcast', 45: 'fog', 48: 'freezing fog',
  51: 'light drizzle', 53: 'drizzle', 55: 'heavy drizzle', 56: 'freezing drizzle', 57: 'freezing drizzle',
  61: 'light rain', 63: 'rain', 65: 'heavy rain', 66: 'freezing rain', 67: 'freezing rain',
  71: 'light snow', 73: 'snow', 75: 'heavy snow', 77: 'snow grains', 80: 'light showers', 81: 'showers', 82: 'heavy showers',
  85: 'snow showers', 86: 'heavy snow showers', 95: 'thunderstorm', 96: 'thunderstorm with hail', 99: 'thunderstorm with hail',
};
const WEATHER_RE = /\b(weather|forecast|temperature|temp|how (hot|cold|warm)|rain(ing|y)?|snow(ing|y)?|sunny|humid(ity)?|windy|umbrella|degrees)\b/i;
const PLACE_RE = /\b(?:in|for|at|near|around)\s+([\p{L}][\p{L} .,'’-]{1,60})$/iu;

export function weatherPlace(text) {
  const t = clean(text);
  if (!WEATHER_RE.test(t)) return null;
  const m = stripEnd(t).match(PLACE_RE);
  if (!m) return null;
  const place = stripEnd(m[1]).replace(/\b(today|tomorrow|tonight|this week(end)?|right now|now)\b.*$/i, '').trim();
  return place && !/^(the )?(morning|evening|afternoon|night|weekend|moment|future|summer|winter|spring|fall|autumn)$/i.test(place) ? place : null;
}

const cToF = (c) => Math.round((c * 9) / 5 + 32);
const deg = (c) => `${Math.round(c)}°C (${cToF(c)}°F)`;

export async function weatherTool(text, fetchImpl = fetch) {
  const place = weatherPlace(text);
  if (!place) return null;
  const loc = await geocode(place, fetchImpl);
  if (!loc) return null;
  const url = `https://api.open-meteo.com/v1/forecast?${new URLSearchParams({
    latitude: String(loc.latitude), longitude: String(loc.longitude), timezone: 'auto', forecast_days: '7',
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,precipitation',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
  })}`;
  const w = await getJson(url, fetchImpl);
  const c = w.current || {};
  const d = w.daily || {};
  const days = (d.time || []).map((date, i) => {
    const name = new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
    return `${name}: ${WMO[d.weather_code?.[i]] || 'n/a'}, high ${deg(d.temperature_2m_max[i])}, low ${deg(d.temperature_2m_min[i])}${d.precipitation_probability_max?.[i] != null ? `, ${d.precipitation_probability_max[i]}% chance of rain/snow` : ''}`;
  });
  const description = [
    `Live weather for ${loc.name} (local time ${String(c.time || '').replace('T', ' ')}, ${w.timezone || loc.timezone}).`,
    `Now: ${WMO[c.weather_code] || 'n/a'}, ${deg(c.temperature_2m)}, feels like ${deg(c.apparent_temperature)}, humidity ${c.relative_humidity_2m}%, wind ${Math.round(c.wind_speed_10m)} km/h (${Math.round(c.wind_speed_10m * 0.621)} mph).`,
    `7-day forecast: ${days.join(' · ')}.`,
  ].join(' ');
  return { title: `Weather in ${loc.name}`, url: `https://open-meteo.com/en/docs#latitude=${loc.latitude}&longitude=${loc.longitude}`, description, via: 'tool' };
}

// ---------- Local time (Open-Meteo geocoding + the built-in time zone database) ----------

const TIME_RE = /\b(?:what(?:'s| is)? (?:the )?(?:current |local )?time|what time is it|time (?:is it )?(?:right )?now|current time|local time|time zone|timezone)\b/i;

export function timePlace(text) {
  const t = stripEnd(text);
  if (!TIME_RE.test(t)) return null;
  const m = t.match(PLACE_RE);
  return m ? stripEnd(m[1]) : null;
}

export async function timeTool(text, fetchImpl = fetch, now = new Date()) {
  const place = timePlace(text);
  if (!place) return null;
  const loc = await geocode(place, fetchImpl);
  if (!loc?.timezone) return null;
  const local = new Intl.DateTimeFormat('en-US', { timeZone: loc.timezone, dateStyle: 'full', timeStyle: 'short' }).format(now);
  const offset = new Intl.DateTimeFormat('en-US', { timeZone: loc.timezone, timeZoneName: 'longOffset' }).formatToParts(now).find((p) => p.type === 'timeZoneName')?.value || '';
  return { title: `Local time in ${loc.name}`, url: 'https://www.iana.org/time-zones', description: `The current local time in ${loc.name} is ${local} (time zone ${loc.timezone}, ${offset.replace('GMT', 'UTC')}).`, via: 'tool' };
}

// ---------- Currency (Frankfurter / European Central Bank) ----------

const CURRENCY_NAMES = {
  dollar: 'USD', dollars: 'USD', usd: 'USD', buck: 'USD', bucks: 'USD', euro: 'EUR', euros: 'EUR', pound: 'GBP', pounds: 'GBP', sterling: 'GBP', quid: 'GBP',
  yen: 'JPY', yuan: 'CNY', renminbi: 'CNY', rmb: 'CNY', rupee: 'INR', rupees: 'INR', franc: 'CHF', francs: 'CHF', peso: 'MXN', pesos: 'MXN',
  won: 'KRW', real: 'BRL', reais: 'BRL', rand: 'ZAR', lira: 'TRY', krona: 'SEK', kronor: 'SEK', krone: 'NOK', zloty: 'PLN', forint: 'HUF', baht: 'THB', ringgit: 'MYR', shekel: 'ILS', shekels: 'ILS',
  'canadian dollar': 'CAD', 'canadian dollars': 'CAD', 'australian dollar': 'AUD', 'australian dollars': 'AUD', 'new zealand dollar': 'NZD', 'hong kong dollar': 'HKD', 'singapore dollar': 'SGD', 'swiss franc': 'CHF', 'swiss francs': 'CHF', 'indian rupee': 'INR', 'indian rupees': 'INR', 'mexican peso': 'MXN', 'mexican pesos': 'MXN', 'japanese yen': 'JPY', 'british pound': 'GBP', 'british pounds': 'GBP',
};
const SUPPORTED = new Set('AUD BGN BRL CAD CHF CNY CZK DKK EUR GBP HKD HUF IDR ILS INR ISK JPY KRW MXN MYR NOK NZD PHP PLN RON SEK SGD THB TRY USD ZAR'.split(' '));
const SYMBOLS = { $: 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY', '₹': 'INR' };

function currencyCode(word) {
  const w = clean(word).toLowerCase().replace(/^(us|american)\s+/, '');
  const code = CURRENCY_NAMES[w] || (w.length === 3 ? w.toUpperCase() : null);
  return code && SUPPORTED.has(code) ? code : null;
}

export function parseCurrency(text) {
  const t = clean(text).replace(/(\d),(\d{3})/g, '$1$2');
  const cur = '((?:canadian |australian |new zealand |hong kong |singapore |swiss |indian |mexican |japanese |british |us |american )?[a-z]+)\\b';
  let m = t.match(new RegExp(`([$€£¥₹])\\s?(\\d+(?:\\.\\d+)?)\\s*(?:[a-z]{3}\\s*)?(?:to|in|into|=)\\s+${cur}`, 'i'));
  if (m) { const to = currencyCode(m[3]); return to ? { amount: Number(m[2]), from: SYMBOLS[m[1]], to } : null; }
  m = t.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${cur}\\s+(?:to|in|into|=)\\s+${cur}`, 'i'));
  if (m) { const from = currencyCode(m[2]); const to = currencyCode(m[3]); return from && to && from !== to ? { amount: Number(m[1]), from, to } : null; }
  m = t.match(new RegExp(`(?:exchange rate|rate|convert|conversion)\\b.*?\\b${cur}\\s+(?:to|and|vs\\.?|into|in)\\s+${cur}`, 'i'));
  if (m) { const from = currencyCode(m[1]); const to = currencyCode(m[2]); return from && to && from !== to ? { amount: 1, from, to } : null; }
  return null;
}

export async function currencyTool(text, fetchImpl = fetch) {
  const q = parseCurrency(text);
  if (!q) return null;
  const j = await getJson(`https://api.frankfurter.dev/v1/latest?${new URLSearchParams({ base: q.from, symbols: q.to })}`, fetchImpl);
  const rate = j.rates?.[q.to];
  if (!rate) return null;
  const fmt = (n) => n.toLocaleString('en-US', { maximumFractionDigits: n < 1 ? 6 : 2 });
  return { title: `Exchange rate ${q.from} to ${q.to}`, url: 'https://frankfurter.dev/', description: `${fmt(q.amount)} ${q.from} = ${fmt(q.amount * rate)} ${q.to} (rate 1 ${q.from} = ${fmt(rate)} ${q.to}, European Central Bank reference rate for ${j.date}). Banks and card providers usually add a fee or margin.`, via: 'tool' };
}

// ---------- Dictionary (Free Dictionary API, Wiktionary data) ----------

export function dictionaryWord(text) {
  const t = clean(text).replace(/[?.!]+$/, '');
  const m = t.match(/^(?:please\s+)?(?:define|definition of|meaning of|what(?:'s| is) the (?:meaning|definition) of|what does)\s+["“']?([a-z][a-z'-]{1,30})["”']?(?:\s+mean)?$/i);
  return m ? m[1].toLowerCase() : null;
}

export async function dictionaryTool(text, fetchImpl = fetch) {
  const word = dictionaryWord(text);
  if (!word) return null;
  const j = await getJson(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, fetchImpl);
  const entry = Array.isArray(j) ? j[0] : null;
  if (!entry) return null;
  const senses = (entry.meanings || []).slice(0, 3).map((m) => `${m.partOfSpeech}: ${(m.definitions || []).slice(0, 2).map((d) => clean(d.definition) + (d.example ? ` (e.g. "${clean(d.example)}")` : '')).join('; ')}`);
  return { title: `Definition of "${entry.word}"`, url: `https://en.wiktionary.org/wiki/${encodeURIComponent(entry.word)}`, description: `${entry.word}${entry.phonetic ? ` ${entry.phonetic}` : ''}. ${senses.join(' | ')}`, via: 'tool' };
}

/** Instant answers from the tools above, for the user's own message. */
export async function toolResults(text, fetchImpl = fetch) {
  const tools = [weatherTool, timeTool, currencyTool, dictionaryTool];
  const out = await Promise.all(tools.map((tool) => withTimeout(tool(text, fetchImpl)).catch(() => null)));
  return out.filter(Boolean);
}

// ---------- News and tech/product coverage ----------

export const NEWS_RE = /\b(news|latest|today|yesterday|this (week|month|year)|recent(ly)?|just (announced|released|launched)|announce[ds]?|launch(ed|es)?|update[ds]?|breaking|current(ly)?|happening|election|price of|stock|earnings|raised|funding|acquire[ds]?|lawsuit|died|dead|killed|winner|won|score|results?)\b/i;

/** Hacker News stories (via Algolia): good coverage of startups, apps, tech products and companies. */
export async function hackerNews(query, fetchImpl = fetch) {
  const j = await getJson(`https://hn.algolia.com/api/v1/search?${new URLSearchParams({ query, tags: 'story', hitsPerPage: '5' })}`, fetchImpl);
  return (j.hits || []).filter((h) => h.title && (h.points || 0) >= 3).map((h) => ({
    title: clean(h.title),
    url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
    description: '',
    date: h.created_at?.slice(0, 10),
    via: 'news',
  }));
}

/** GDELT recent news articles (best effort: GDELT asks for at most one request every few seconds). */
export async function gdeltNews(query, fetchImpl = fetch) {
  const j = await getJson(`https://api.gdeltproject.org/api/v2/doc/doc?${new URLSearchParams({ query: `${query} sourcelang:english`, mode: 'artlist', format: 'json', maxrecords: '6', sort: 'hybridrel', timespan: '3months' })}`, fetchImpl);
  return (j.articles || []).map((a) => ({
    title: clean(a.title),
    url: a.url,
    description: '',
    date: a.seendate ? `${a.seendate.slice(0, 4)}-${a.seendate.slice(4, 6)}-${a.seendate.slice(6, 8)}` : undefined,
    via: 'news',
  }));
}

/**
 * Read the pages behind results that only have a title (news links), and keep the passages
 * that match the query. Runs in parallel with a short timeout so search stays fast.
 */
export async function enrichPages(items, pickPassages, fetchImpl = fetch, { max = 3, timeoutMs = 3500 } = {}) {
  const targets = items.filter((it) => !it.description || it.description.length < 120).slice(0, max);
  await Promise.all(targets.map(async (it) => {
    try {
      const page = await withTimeout(fetchPage(it.url, fetchImpl, timeoutMs), timeoutMs + 200);
      const text = pickPassages(page.text);
      if (text) it.description = text;
      if (page.title && page.title.length < 160 && !it.title) it.title = page.title;
    } catch { /* keep the title only */ }
  }));
  return items.filter((it) => it.description);
}
