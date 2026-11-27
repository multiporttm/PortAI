/* This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { test } from 'node:test';
import assert from 'node:assert';
import { weatherPlace, timePlace, parseCurrency, dictionaryWord, toolResults } from '../lib/portai-sources.mjs';

const json = (body) => ({ ok: true, status: 200, text: async () => JSON.stringify(body) });
const fakeFetch = async (url) => {
  const u = new URL(String(url));
  if (u.hostname === 'geocoding-api.open-meteo.com') return json({ results: [{ name: 'Tokyo', country: 'Japan', latitude: 35.69, longitude: 139.69, timezone: 'Asia/Tokyo' }] });
  if (u.hostname === 'api.open-meteo.com') return json({ timezone: 'Asia/Tokyo', current: { time: '2026-11-27T10:00', temperature_2m: 12, apparent_temperature: 10, relative_humidity_2m: 60, weather_code: 2, wind_speed_10m: 10 }, daily: { time: ['2026-11-27'], weather_code: [61], temperature_2m_max: [14], temperature_2m_min: [7], precipitation_probability_max: [70] } });
  if (u.hostname === 'api.frankfurter.dev') return json({ date: '2026-11-26', rates: { EUR: 0.9 } });
  if (u.hostname === 'api.dictionaryapi.dev') return json([{ word: 'serendipity', meanings: [{ partOfSpeech: 'noun', definitions: [{ definition: 'A happy accident.' }] }] }]);
  throw new Error(`unexpected ${u.hostname}`);
};

test('detects live-data questions', () => {
  assert.equal(weatherPlace("What's the weather in Paris, France today?"), 'Paris, France');
  assert.equal(weatherPlace('Will it rain in London this weekend?'), 'London');
  assert.equal(weatherPlace('what is the weather like'), null);
  assert.equal(timePlace('what time is it in Tokyo'), 'Tokyo');
  assert.deepEqual(parseCurrency('convert 1,000 usd to eur'), { amount: 1000, from: 'USD', to: 'EUR' });
  assert.deepEqual(parseCurrency('$50 to pounds'), { amount: 50, from: 'USD', to: 'GBP' });
  assert.deepEqual(parseCurrency('exchange rate euro to yen'), { amount: 1, from: 'EUR', to: 'JPY' });
  assert.equal(parseCurrency('How do I bake bread'), null);
  assert.equal(dictionaryWord('what does ephemeral mean?'), 'ephemeral');
  assert.equal(dictionaryWord('define serendipity'), 'serendipity');
});

test('weather, time, currency and dictionary tools return live results', async () => {
  const [weather] = await toolResults('weather in Tokyo', fakeFetch);
  assert.match(weather.description, /12°C \(54°F\).*partly cloudy|partly cloudy.*12°C \(54°F\)/);
  assert.match(weather.description, /70% chance/);
  const [time] = await toolResults('what time is it in Tokyo', fakeFetch);
  assert.match(time.description, /Asia\/Tokyo, UTC\+09:00/);
  const [fx] = await toolResults('100 usd to eur', fakeFetch);
  assert.match(fx.description, /100 USD = 90 EUR/);
  const [def] = await toolResults('define serendipity', fakeFetch);
  assert.match(def.description, /noun: A happy accident/);
  assert.deepEqual(await toolResults('write a poem', fakeFetch), []);
});
