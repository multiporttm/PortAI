// Turns any failure (HTTP status, Cloudflare block pages, provider error codes,
// raw JSON) into a short, human-readable message. Never shows raw JSON or codes.

export const RATE_LIMIT_MESSAGE = 'Rate limit hit. Please wait a moment and try again.';
const GENERIC = 'Something went wrong. Please try again.';

function rateLimitMessage(retryAfter) {
  const s = Number(retryAfter);
  if (!Number.isFinite(s) || s <= 0) return RATE_LIMIT_MESSAGE;
  if (s < 90) return `Rate limit hit. Please try again in ${Math.ceil(s)} seconds.`;
  if (s < 5400) return `Rate limit hit. Please try again in about ${Math.ceil(s / 60)} minutes.`;
  return `Daily message limit reached. Please try again in about ${Math.round(s / 3600)} hours.`;
}

/** True if the text is safe and readable to show as-is (no JSON, markup or bare error codes). */
function looksFriendly(text) {
  return typeof text === 'string'
    && text.length > 0 && text.length <= 240
    && !/[{}<>[\]]|(err|error)[_-]?\d+|\bat [\w.]+ \(|^\w*(error|exception)\b|^\d{3,5}:/i.test(text) // JSON, markup, codes, stack traces
    && !/\b[A-Z][A-Z0-9]*_[A-Z0-9_]+\b/.test(text); // SNAKE_CASE error constants
}

/**
 * @param {object} p
 * @param {number} [p.status]      HTTP status (0 = network failure)
 * @param {string} [p.message]     message from the server / stream / exception
 * @param {string} [p.retryAfter]  Retry-After header value (seconds)
 */
export function friendlyError({ status, message, retryAfter } = {}) {
  const text = String(message || '');
  if (status === 429 || /rate.?limit|too many requests|\b1015\b/i.test(text)) return rateLimitMessage(retryAfter);
  if (/free AI allowance|daily free allocation|\b3036\b/i.test(text)) return "Today's free AI allowance has been used up. It resets at midnight UTC.";
  if (status === 0 || /failed to fetch|networkerror|load failed|offline/i.test(text)) return 'You appear to be offline. Check your connection and try again.';
  if (status === 413) return 'That message is too long. Try shortening it.';
  if (status === 401 || status === 403) return looksFriendly(text) ? text : 'Cloudflare security check needed. Please refresh the page and try again.';
  if (status >= 500 && !looksFriendly(text)) return 'PortAI is having trouble right now. Please try again in a moment.';
  return looksFriendly(text) ? text : GENERIC;
}
