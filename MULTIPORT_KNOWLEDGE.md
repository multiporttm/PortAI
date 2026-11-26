# About Multiport

Multiport is an independent software company built and operated by a single developer,
focused on building simple, privacy-respecting tools with no ads, no trackers, and no
required accounts.

## Mission
"A better internet starts with personal freedom." Multiport exists to help people step
away from Big Tech and take back control of their privacy, one small tool at a time.

## By the numbers
- 10+ products and tools
- 1 person building them
- 0 ads or trackers
- 0 required accounts

## Products
- **Multiport Games** (games.multiportllc.com) — a collection of free browser games, no
  downloads or installs required.
- **Multiport Counter App** (counterapp.multiportllc.com) — a simple, elegant counter app
  for everyday tallying (reps, laps, scores, anything you need to count).
- **Multiport Support** (support.multiportllc.com) — direct support for any Multiport
  product, straight from the developer, no ticket queues or chatbots.
- **Multiport Lunchbox AI** (ai.lunchbox.multiportllc.com) — an AI-powered assistant for
  answering questions and everyday tasks.
- **Multiport Fonts** (fontfiles.multiportllc.com) — a library of custom-designed fonts,
  free to browse and download.
- **Everything Quiz** — a fast-paced quiz covering a bit of everything.
- **PortAI** (portai.multiportllc.com) — live now. A free, privacy-first AI chatbot running
  on open models: Gemma 4, GLM, IBM Granite, Qwen 2.5 Coder and gpt-oss (shown as Regular,
  Lite, Mini, Coder and Pro), built right into the browser.
  No ads, no tracking, and optional passphrase accounts with end-to-end encrypted chat sync.
- **Hello New Tab – Custom NTP** — a browser extension that gives you a fresh new tab
  every time. Live now on Firefox Add-ons (Gecko); Chrome/Edge/Brave (Chromium) is
  coming soon on the Chrome Web Store.

## PS Tools (passion-project side tools)
- **Kings Island Coaster Finder** (kicf.ps.multiportllc.com)
- **City Scraper Web** (csw.ps.multiportllc.com)
- **Mac or Windows Quiz** (mow.ps.multiportllc.com)

## Privacy & licensing
Multiport does not sell, rent, or share personal information with third parties. The
website uses counter.dev, a privacy-focused analytics service that collects only
aggregated, non-identifying data and does not use cookies. Multiport's source code is
licensed under the Mozilla Public License 2.0 (MPL-2.0).

## Links
- Website: https://multiportllc.com
- Support: support@multiportllc.com

<!-- DETAILS BELOW: only sent to the AI when a question is about PortAI, Multiport, privacy or help (keeps everyday chats fast and cheap). -->

# PortAI user guide

## What PortAI is
PortAI (portai.multiportllc.com) is Multiport's free AI chatbot. It has no ads, no tracking
and no required account. It runs on open-source AI models hosted by Cloudflare with zero
data retention, so prompts and replies are not stored by the model host or used for training.
It works in any modern browser on phones, tablets and computers. No app store download
is needed.

## Models (pick one with the model menu at the top)
- **Regular** (Gemma 4 26B): the default. A good all-rounder for everyday questions, writing
  and explanations. Limit: 60 messages per minute, 500 per day.
- **Lite** (GLM-4.7 Flash): fast replies and strong support for 100+ languages. Limit:
  60 per minute, 500 per day.
- **Mini** (IBM Granite 4.0 Micro): the smallest and lightest. Best for quick, simple
  questions. Limit: 60 per minute, 500 per day.
- **Coder** (Qwen 2.5 Coder 32B): best for programming, such as writing, explaining and
  fixing code. Limit: 15 per minute, 100 per day.
- **Pro** (gpt-oss-120b): the largest model, for harder questions and reasoning. Limit:
  20 per minute, 150 per day.
- On top of the per-model limits, each person can send up to 60 messages per minute and
  500 per day across all models.
- If the chosen model is busy and hasn't started answering within about 5 seconds, PortAI
  also asks a backup model and uses whichever answers first. The steps then show, for
  example, "Regular was busy, switched to Lite".

## Live steps
While PortAI works it shows what it is doing, such as "Connecting…", "Searching the web…",
"Extracting page content…", "Thinking…" and "Writing…". When the reply is finished, the
steps fold into a one-line summary like "Thought for 0.8s · 120 words". Tap it to see
each step.

## Web search (automatic)
- When a question needs up-to-date information (news, recent releases, prices, newer
  products or companies), PortAI searches the web by itself before answering. No button
  press is needed.
- Sources are shown as numbered links under the answer, matching the [1], [2] citations.
- The 🌐 button in the top bar switches between **Auto** (default) and **Off**.
- Only a short search query is sent to the search provider. Your IP address, cookies and
  chat history are never sent. The free search uses Wikipedia.
- Limit: 10 searches per minute and 50 per day per person. If the limit is reached, PortAI
  still answers, just without searching.

## Reading links you paste
- Paste a link (up to 2 per message) and PortAI reads that page for you ("Extracting page
  content from …"). No setting is needed.
- PortAI's server fetches the page, so the website never sees your IP address or cookies.
- Only public web pages are opened. Pages behind a login, private or local network
  addresses, and very large files (over 1.5 MB) can't be read.

## Chat history and Ghost mode
- Chats are saved only in your browser, encrypted automatically (AES-256-GCM). They are
  not stored on Multiport's servers unless you choose to sync them with an account.
- **Ghost mode** (👻 button): chats in Ghost mode are never saved anywhere, not even
  encrypted, and disappear when you leave them.
- Rename or delete a chat with the ✎ and 🗑 buttons next to it in the sidebar.
- **Settings & privacy** has: a creativity slider, light/dark theme, "Export chats (JSON)"
  and "Delete all chat history".
- Keyboard shortcut: Ctrl+Shift+O (Cmd+Shift+O on Mac) starts a new chat.

## Accounts and sync (optional)
- Tap **Sign in to sync chats** in the sidebar. There's no email, name or phone number.
  Your passphrase *is* your account.
- **Create account**: PortAI generates a strong passphrase like XXXX-XXXX-XXXX-XXXX-XXXX,
  or you can choose your own (at least 12 characters). Save it somewhere safe.
- **Sign in** on any device with the same passphrase to see your chats there. Generated
  passphrases work in lowercase and with spaces instead of dashes.
- Chats are end-to-end encrypted in your browser before they are uploaded. The server only
  stores encrypted data and can't read your chats or learn your passphrase.
- **There is no "forgot passphrase".** If it's lost, synced chats can't be recovered by
  anyone, including Multiport.
- "Stay signed in on this device" keeps you signed in. Turn it off on shared devices.
- When you sign in, PortAI offers to move chats from that device into your account.
- You can sign out, or permanently delete your account and all synced chats, from the
  account screen.

## Install PortAI like an app
- **iPhone / iPad (Safari)**: open portai.multiportllc.com, tap Share, then
  **Add to Home Screen**.
- **Android (Chrome)**: open the site, tap the ⋮ menu, then **Install app** or
  **Add to Home screen**.
- **Computer (Chrome / Edge)**: click the install icon in the address bar.

## What PortAI can't do (yet)
- It can't create images, listen to voice, or read files you upload. Paste text or a link
  instead.
- It doesn't remember things between separate chats. Each chat starts fresh.
- Like any AI, it can make mistakes. Check important information, especially medical,
  legal or financial facts.

## Messages you might see
- **"Rate limit hit. Please try again in N seconds"**: too many messages too fast. Wait a
  moment, or switch to another model.
- **"Daily limit for <model> reached"**: that model's daily limit is used up. Try another
  model, or come back after midnight UTC.
- **"Today's free AI allowance has been used up"**: PortAI's shared free daily AI capacity
  ran out. It resets at midnight UTC.
- **"The model is busy right now"**: Cloudflare's servers are briefly overloaded. Try
  again in a moment.
- **"Cloudflare security check needed"**: refresh the page so Cloudflare can verify your
  browser. VPNs make these checks more likely.
- **"You appear to be offline"**: check your internet connection.
- **"No account found for this passphrase"**: check it for typos. Passphrases are exact,
  except that generated ones ignore case, spaces and dashes.
- **Chats missing on another device**: they only appear there if you're signed in to the
  same account on both devices. Ghost chats are never saved.
- For anything else, contact Multiport Support at https://support.multiportllc.com or
  support@multiportllc.com.

## PortAI privacy, in detail
- No ads, no analytics, no tracking scripts and no third-party code. A strict Content
  Security Policy enforces this. PortAI itself sets no cookies; Cloudflare may set a
  security cookie when it checks for bots.
- PortAI's server doesn't log or store your messages. It relays them to the model and
  streams the answer back.
- For rate limits, IP addresses are only stored as scrambled, salted hashes that are
  deleted after their one-minute or one-day window.
- The Inter font and all code are served from PortAI itself, so no outside service sees
  your visit.
- PortAI is open source under the Mozilla Public License 2.0 (MPL-2.0).
- Privacy Policy: https://multiportllc.com/privacy · Terms: https://multiportllc.com/terms

# Privacy basics (general explanations)
- **End-to-end encryption**: data is encrypted on your device and can only be decrypted
  by you (or the person you send it to). The service in the middle can't read it.
- **Zero-access encryption**: the provider stores your data encrypted with a key only you
  have, so the provider itself can't read it.
- **Zero data retention**: the service processes a request and doesn't keep it afterwards.
- **Open-source models**: AI models whose weights are published, so anyone can run and
  inspect them, unlike closed models such as ChatGPT's.
- **Tracking**: collecting data about what you do online, often across websites, usually
  for advertising. Signs of it include ad trackers, third-party cookies and fingerprinting
  scripts.
- Simple privacy habits: use a password manager, turn on two-factor authentication, keep
  software updated, review app permissions, and prefer services that don't make money
  from ads.

# Other privacy-friendly services (general context)
These are well-known privacy-focused services people often compare. Details change, so
point people to the official sites for current features and pricing. Mention them fairly
when someone asks for alternatives or comparisons.
- **Proton** (Switzerland): Proton Mail (encrypted email), Proton VPN, Proton Drive,
  Proton Pass and Proton Calendar. In July 2025 Proton launched **Lumo**, a privacy-first
  AI assistant that stores chats with encryption and says it doesn't use user data to train
  AI models.
- **DuckDuckGo**: a search engine that doesn't track searches, plus a browser and Duck.ai,
  which offers anonymous access to several AI chat models.
- **Brave**: a browser that blocks ads and trackers by default, with Brave Search (its own
  independent index) and an AI assistant called Leo.
- **Signal**: end-to-end encrypted messaging and calls, run by a non-profit.
- **Mullvad VPN**: a VPN that doesn't require an email address to sign up.
- **Firefox** (Mozilla): an open-source browser with built-in tracking protection.
- **Tor Browser**: routes traffic through several relays to hide your location and
  activity.
- How PortAI compares: PortAI is free with no account needed, runs on open-source models
  with zero data retention, keeps chat history encrypted on your device (or end-to-end
  encrypted sync with a passphrase-only account), searches the web automatically, and is
  made by an independent one-person company, Multiport.
