# PortAI

**An AI chatbot powered by the open Swiss [Apertus](https://huggingface.co/swiss-ai) models. Privacy first: no ads, no tracking, no logs.**

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

## Choosing an Apertus provider

PortAI works with any **OpenAI-compatible** `/chat/completions` endpoint. Set `PORTAI_MODELS` to the exact model ids your provider exposes. Check them with `curl $PORTAI_API_BASE/models`.

| Provider | `PORTAI_API_BASE` | Example model id |
|---|---|---|
| Public AI Inference Utility | `https://api.publicai.co/v1` | `swiss-ai/apertus-70b-instruct` |
| CSCS LLM Inference API | `https://api.inference.cscs.ch/v1` | `swiss-ai/Apertus-70B-Instruct-2509` |
| Self-hosted (vLLM, llama.cpp, Ollama…) | `http://localhost:8000/v1` | `swiss-ai/Apertus-8B-Instruct-2509` |

For maximum privacy, **self-host Apertus**: the 8B model runs on a single consumer GPU. No API key is needed for `localhost` endpoints.

## Configuration

| Variable | Default | Description |
|---|---|---|
| `PORTAI_API_BASE` | `https://api.publicai.co/v1` | OpenAI-compatible base URL |
| `PORTAI_API_KEY` | — | Provider API key (server-side only, never sent to browsers) |
| `PORTAI_MODELS` | `swiss-ai/apertus-70b-instruct,swiss-ai/apertus-8b-instruct` | Allowed models; the first is the default |
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

## Development

```bash
npm test
```

## Threat model, honestly

- Messages **are** sent in plaintext (over TLS) to the model provider so it can generate a reply. Pick a provider you trust, or self-host.
- The device-key mode protects against casual inspection of browser storage. It does not protect against someone who can use your unlocked browser profile. Use a passphrase for that.
- If you forget your passphrase, your history cannot be recovered. That is by design.

## License

Apache-2.0. Apertus models are released by the Swiss AI Initiative under their own license; see the model cards.
