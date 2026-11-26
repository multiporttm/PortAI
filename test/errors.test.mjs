import { test } from 'node:test';
import assert from 'node:assert';
import { friendlyError, RATE_LIMIT_MESSAGE } from '../public/errors.js';

test('rate limits always read "Rate limit hit"', () => {
  assert.equal(friendlyError({ status: 429 }), RATE_LIMIT_MESSAGE);
  assert.equal(friendlyError({ status: 429, retryAfter: '60' }), 'Rate limit hit. Please try again in 60 seconds.');
  assert.equal(friendlyError({ status: 429, retryAfter: '600' }), 'Rate limit hit. Please try again in about 10 minutes.');
  // Cloudflare WAF block page / provider codes / raw JSON
  assert.equal(friendlyError({ status: 429, message: '<html>Error 1015 You are being rate limited</html>' }), RATE_LIMIT_MESSAGE);
  assert.equal(friendlyError({ message: '{"errors":[{"code":3040}],"err":"rate_limit_exceeded"}' }), RATE_LIMIT_MESSAGE);
  assert.equal(friendlyError({ message: 'Too many requests' }), RATE_LIMIT_MESSAGE);
});

test('never shows raw JSON or error codes', () => {
  for (const message of ['{"error":"x"}', 'AiError: 5007: internal_err345', 'ERR_SOMETHING_FAILED', '<!DOCTYPE html><title>502</title>']) {
    const out = friendlyError({ status: 500, message });
    assert.doesNotMatch(out, /[{}<>]|\d{3,}|ERR_/, `leaked: ${out}`);
  }
  assert.equal(friendlyError({ message: 'err_345' }), 'Something went wrong. Please try again.');
});

test('keeps clean human messages and maps common cases', () => {
  assert.equal(friendlyError({ status: 404, message: 'No account found for this passphrase.' }), 'No account found for this passphrase.');
  assert.match(friendlyError({ status: 0 }), /offline/);
  assert.match(friendlyError({ status: 413 }), /too long/);
  assert.match(friendlyError({ message: '3036: You have used up your daily free allocation' }), /free AI allowance/);
});
