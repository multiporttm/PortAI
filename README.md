# PortAI

**A free, privacy-first AI chatbot powered by open-source models. No ads, no tracking, no logs.**

On Cloudflare Pages it runs for free on open models (Google Gemma 4, GLM-4.7 Flash) hosted by Cloudflare Workers AI with zero data retention. It also supports the Swiss [Apertus](https://huggingface.co/swiss-ai) models through any OpenAI-compatible provider, or Workers AI once Cloudflare grants access.

Open it and start chatting, with no account and no setup.

PortAI is a lightweight, self-hostable chat assistant in the spirit of privacy-first assistants like Proton's Lumo. It runs on **Apertus**, the fully open multilingual LLM family from the Swiss AI Initiative (EPFL, ETH Zürich, CSCS): its weights, training data and recipes are all public.

## Privacy by design

| | |
|---|---|
| 🚫 **No ads, no tracking** | No analytics, cookies, fingerprinting or third-party scripts. A strict Content-Security-Policy (`default-src 'self'`) enforces this in the browser. |
| 🔐 **Encrypted history** | Chats are encrypted in the browser with **AES-256-GCM** before they are stored in IndexedDB. By default this uses an automatic **non-extractable device key**, so there's nothing to set up. You can optionally add a **passphrase** in Settings (PBKDF2-SHA-256, 600k iterations). Chats never leave your device unencrypted, and the server never stores them. |
| 🙈 **No server logs** | The server relays the conversation to the model and streams the answer back. It never logs or stores message content or IP addresses. Rate limiting uses an in-memory HMAC of the IP with a random salt that changes on every restart. |
| ✂️ **Minimal forwarding** | Only the message text, model id and temperature are sent upstream. Your IP, cookies, user agent and referrer are not. |
| 👻 **Ghost mode** | Chats that are never written to storage at all. |
| ⏲ **Auto-lock** | Passphrase vaults lock after 15 minutes of inactivity. "Erase all data" wipes everything locally. |
| 📦 **Zero dependencies** | Plain Node.js plus vanilla JS, so there is no supply chain to audit beyond this repo. |

## Quick start

```bash
# Try the UI with no model (echo replies)
npm run dev                # → http://127.0.0.1:8080

# Use a real Apertus endpoint
cp .env.example .env       # then edit PORTAI_API_KEY / PORTAI_API_BASE / PORTAI_MODELS
npm start
```

Requires Node.js 18.17 or newer. Nothing to `npm install`.

### Docker

```bash
docker build -t portai .
docker run -p 8080:8080 --env-file .env portai
```

### Cloudflare Pages (free)

PortAI runs on Cloudflare Pages for free. `public/` is the static site, and `functions/api/*` are Pages Functions that replace `server.js` (same validation, header stripping and streaming). All settings live in `wrangler.toml`.

By default it uses **Gemma 4** and **GLM-4.7 Flash** on Cloudflare Workers AI:
- Both are available on the free Workers plan.
- Cloudflare lists both as *zero data retention*.
- They need **no API key**.
- Usage is covered by Cloudflare's daily allowance of 10,000 Neurons, which resets at 00:00 UTC.

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**, and pick this repo.
2. Build settings: Framework preset **None**, build command **empty**, build output directory **`public`**.
3. **Save and Deploy**. Then send a test message.

When the allowance runs out, users see "Today's free AI allowance has been used up" until 00:00 UTC. Nothing is charged on the free plan.

**Switching models:** edit `PORTAI_MODELS` in `wrangler.toml`. Ids starting with `@cf/` use Workers AI, and any other id goes to `PORTAI_API_BASE`, which needs the `PORTAI_API_KEY` secret. Apertus on Workers AI (`@cf/swiss-ai/apertus-v1.5-8b`) is currently restricted (error `5018`). The commented lines in `wrangler.toml` switch to it once your account has access.

> When `wrangler.toml` exists, Cloudflare uses it for bindings and plain variables. Secrets are still set in the dashboard.

**Models:** `PORTAI_MODELS` lists the models. `PORTAI_MODEL_LABELS` sets the aliases shown in the menu, and `PORTAI_MODEL_BASES` sets the real model name shown under each alias. `PORTAI_MODEL_LIMITS` gives each model its own per-person limit as `perMinute/perDay`, so expensive models can get lower limits.

**Rate limits:** each person also gets 60 messages per minute and 500 per day across all models by default (`PORTAI_RATE_LIMIT` and `PORTAI_DAILY_LIMIT` in `wrangler.toml`). These limits are counted in D1, so every Cloudflare server shares them. The table is in `migrations/0002_rate_limits.sql`. IPs are stored only as salted SHA-256 hashes and deleted after their window. An extra WAF rule is optional.

**Speed:** thinking mode is turned off (`chat_template_kwargs.enable_thinking = false`), so replies start in about a second instead of 5–7 seconds. Set `PORTAI_THINKING = "1"` to turn it back on.

**Keep it private:** leave **Web Analytics** off and don't `console.log` request bodies. Security headers come from `public/_headers`.

## Accounts & sync (zero-knowledge)

On Cloudflare Pages, people can create an **account protected only by a passphrase**, with no email or name. Their chats then sync, end-to-end encrypted, to every device where they enter it. This uses Cloudflare **D1** (binding `DB`, schema in `migrations/0001_accounts.sql`).

```
passphrase ─PBKDF2-SHA256 (600k)─▶ master ─HKDF─┬─ "id"   → account id         (sent to server)
                                                ├─ "auth" → login secret       (server stores only its SHA-256)
                                                └─ "enc"  → AES-256-GCM key    (never leaves the browser)
```

- The server stores only an account id, a hash of the login secret, and **ciphertext**. It can't read chats or recover passphrases.
- New accounts get a generated passphrase like `K7QM-2XHD-9PRA-V4TS-6WNE` (about 98 bits of entropy). Generated passphrases ignore case, spaces and dashes when typed. Custom passphrases need at least 12 characters.
- **There is no recovery.** If a passphrase is lost, its chats are gone.
- "Stay signed in" keeps the keys in the browser's IndexedDB. The AES key is stored non-extractable. Leaving it unticked keeps the keys in memory only.
- When someone signs in, PortAI offers to move chats that are only on that device into the account. Ghost-mode chats are never saved anywhere.
- Deleting an account removes the account and all its synced chats from D1.

**Setting up D1 for your own deployment:** create a database with `npx wrangler d1 create portai-db`, put its id in `wrangler.toml`, then run `npx wrangler d1 execute portai-db --remote --file migrations/0001_accounts.sql`. The Node server (`server.js`) does not support accounts. It reports `accounts: false`, and the UI hides the feature.

## Reading shared links

When a message contains a link, PortAI reads that page automatically, like Lumo does ("Extracting page content"). It needs no opt-in, because sharing a link is the request. It reads at most 2 links per message, up to 1.5 MB and 8 s per page. Only public http(s) pages are fetched; private and local addresses are blocked. The page's main content goes to the model as untrusted text, and the page is listed under Sources. Set `PORTAI_READ_LINKS = "0"` to turn this off.

## Web search (opt-in)

Web search is **automatic** by default, like Lumo. Before answering, a small, cheap model (Mini, IBM Granite) decides whether the question needs the web, for example news, prices, recent events or newer products like Lumo. If it does, PortAI searches with that model's query; if not, it answers right away. The **🌐 Auto / Off** button turns searching off. Set `PORTAI_SEARCH_ROUTER` to pick a different decision model.

- **Providers**, tried in order (`PORTAI_SEARCH_PROVIDERS`):
  1. **Brave Search API**: full web from an independent index, with a free $5 monthly credit (about 1,000 searches). Sign up at brave.com/search/api, then add the key as the Pages secret `BRAVE_SEARCH_API_KEY`.
  2. **Cloudflare Web Search API** (Ceramic.ai): zero data retention, $0.25 per 1,000 searches, paid from AI Gateway credits.
  3. **Wikipedia**: free, no signup. It runs a full-text search inside articles and returns the matching paragraphs. For example, it finds Lumo inside the "Proton AG" article.
- Only the search query is sent. No IP address, cookies or chat history go with it.
- Settings in `wrangler.toml`: `PORTAI_SEARCH` turns it on or off, `PORTAI_SEARCH_PROVIDER` picks `ceramic`, `linkup` or `wikipedia`, `PORTAI_SEARCH_LIMITS` sets searches per person per minute and per day, and `PORTAI_SEARCH_CONTACT` is the contact info Wikipedia asks API clients to send.

## Multiport knowledge (grounding)

`MULTIPORT_KNOWLEDGE.md` holds facts about Multiport and its products. PortAI adds it to every conversation's system prompt with rules: use it as the source of truth, don't invent products or URLs, and point to support when unsure. That's how PortAI can answer questions about Multiport accurately.

The file has two parts. Everything above the `<!-- DETAILS BELOW … -->` line (about Multiport and its products) is always sent. Everything below it (the PortAI user guide, troubleshooting, privacy basics and other privacy services) is only sent when a question is about PortAI, Multiport, privacy or help. This keeps everyday chats fast and the free allowance from being used up.

After editing the file, run **`npm run knowledge`**. Cloudflare Pages can't import `.md`, so this regenerates `lib/multiport-knowledge.mjs`, and `npm test` fails if you forget. The Node server reads the Markdown file directly.

## Choosing an Apertus provider

PortAI works with any **OpenAI-compatible** `/chat/completions` endpoint. Set `PORTAI_MODELS` to the exact model ids your provider exposes. Check them with `curl $PORTAI_API_BASE/models`.

| Provider | `PORTAI_API_BASE` | Example model id |
|---|---|---|
| Cloudflare Workers AI (restricted access) | (uses the `AI` binding, Pages only) | `@cf/swiss-ai/apertus-v1.5-8b` |
| Public AI Inference Utility | `https://api.publicai.co/v1` | `swiss-ai/apertus-v1.5-70b` |
| CSCS LLM Inference API | `https://api.inference.cscs.ch/v1` | `swiss-ai/Apertus-70B-Instruct-2509` |
| Self-hosted (vLLM, llama.cpp, Ollama…) | `http://localhost:8000/v1` | `swiss-ai/Apertus-8B-Instruct-2509` |

For maximum privacy, **self-host Apertus**: the 8B model runs on a single consumer GPU. No API key is needed for `localhost` endpoints.

## Configuration

| Variable | Default | Description |
|---|---|---|
| `PORTAI_API_BASE` | `https://api.publicai.co/v1` | OpenAI-compatible base URL |
| `PORTAI_API_KEY` | — | Provider API key (server-side only, never sent to browsers) |
| `PORTAI_MODELS` | `swiss-ai/apertus-v1.5-70b,swiss-ai/apertus-v1.5-8b` | Allowed models; the first is the default |
| `PORTAI_MODEL_LABELS` | derived | Display names, in the same order |
| `PORTAI_SYSTEM_PROMPT` | built-in | Override the assistant persona |
| `PORT` / `HOST` | `8080` / `127.0.0.1` | Listen address |
| `PORTAI_RATE_LIMIT` | `30` | Requests per minute per client |
| `PORTAI_TRUST_PROXY` | `0` | Use `X-Forwarded-For` behind a trusted reverse proxy |
| `PORTAI_HSTS` | `0` | Send HSTS (enable when served over HTTPS) |
| `PORTAI_MOCK` | `0` | Echo mode for development |

In production, put PortAI behind HTTPS (Caddy, nginx, Traefik) and turn off access logging in the proxy too. Otherwise the proxy can log IPs even though PortAI does not.

## Architecture

```
Browser (vanilla JS)                    PortAI server (Node, no deps)        Apertus provider
┌──────────────────────────┐  /api/chat ┌──────────────────────────┐ HTTPS ┌──────────────┐
│ UI + Markdown (escaped)  │──────────▶ │ validate · strip headers │─────▶ │ /chat/       │
│ Vault: AES-GCM IndexedDB │ ◀── SSE ── │ add system prompt        │ ◀──── │ completions  │
└──────────────────────────┘            │ no logs · no storage     │       └──────────────┘
                                        └──────────────────────────┘
```

- `server.js`: static file server, chat proxy, security headers, rate limiter
- `public/vault.js`: client-side encrypted storage (WebCrypto)
- `public/markdown.js`: XSS-safe Markdown renderer (escapes everything first)
- `public/app.js`: UI logic, streaming, ghost mode, settings
- `functions/api/*` + `lib/portai-core.mjs`: the Cloudflare Pages Functions version of the server
- `public/_headers`: security headers on Cloudflare Pages
- `public/account.js` + `lib/portai-sync.mjs` + `functions/api/account*`, `functions/api/chats*`: zero-knowledge accounts and encrypted sync (D1)

## Development

```bash
npm test
```

## Threat model, honestly

- Messages **are** sent in plaintext (over TLS) to the model provider so it can generate a reply. Pick a provider you trust, or self-host.
- The device-key mode protects against casual inspection of browser storage. It does not protect against someone who can use your unlocked browser profile. Use a passphrase for that.
- If you forget your passphrase, your history cannot be recovered. That is by design.

## License

PortAI is licensed under the **Mozilla Public License 2.0 (MPL-2.0)**. See [`LICENSE`](LICENSE).

> This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.

Third-party parts keep their own licenses:
- **Inter** font: SIL Open Font License 1.1 (`public/fonts/Inter-LICENSE.txt`)
- **AI models** (Gemma 4, GLM-4.7 Flash, Apertus) are not part of this repository. Each is used under its provider's own model license and terms.
