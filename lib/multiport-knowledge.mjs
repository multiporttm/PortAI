/* This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// GENERATED from MULTIPORT_KNOWLEDGE.md by scripts/build-knowledge.mjs. Do not edit by hand.
// Run `npm run knowledge` after changing the Markdown file.

// Always sent: about Multiport and its products.
export const MULTIPORT_KNOWLEDGE = "# About Multiport\n\nMultiport is an independent software company built and operated by a single developer,\nfocused on building simple, privacy-respecting tools with no ads, no trackers, and no\nrequired accounts.\n\n## Mission\n\"A better internet starts with personal freedom.\" Multiport exists to help people step\naway from Big Tech and take back control of their privacy, one small tool at a time.\n\n## By the numbers\n- 10+ products and tools\n- 1 person building them\n- 0 ads or trackers\n- 0 required accounts\n\n## Products\n- **Multiport Games** (games.multiportllc.com) — a collection of free browser games, no\n  downloads or installs required.\n- **Multiport Counter App** (counterapp.multiportllc.com) — a simple, elegant counter app\n  for everyday tallying (reps, laps, scores, anything you need to count).\n- **Multiport Support** (support.multiportllc.com) — direct support for any Multiport\n  product, straight from the developer, no ticket queues or chatbots.\n- **Multiport Lunchbox AI** (ai.lunchbox.multiportllc.com) — an AI-powered assistant for\n  answering questions and everyday tasks.\n- **Multiport Fonts** (fontfiles.multiportllc.com) — a library of custom-designed fonts,\n  free to browse and download.\n- **Everything Quiz** — a fast-paced quiz covering a bit of everything.\n- **PortAI** (portai.multiportllc.com) — live now. A free, privacy-first AI chatbot running\n  on open models: Gemma 4, GLM, IBM Granite, Qwen 2.5 Coder and gpt-oss (shown as Regular,\n  Lite, Mini, Coder and Pro), built right into the browser.\n  No ads, no tracking, and optional passphrase accounts with end-to-end encrypted chat sync.\n- **Hello New Tab – Custom NTP** — a browser extension that gives you a fresh new tab\n  every time. Live now on Firefox Add-ons (Gecko); Chrome/Edge/Brave (Chromium) is\n  coming soon on the Chrome Web Store.\n\n## PS Tools (passion-project side tools)\n- **Kings Island Coaster Finder** (kicf.ps.multiportllc.com)\n- **City Scraper Web** (csw.ps.multiportllc.com)\n- **Mac or Windows Quiz** (mow.ps.multiportllc.com)\n\n## Privacy & licensing\nMultiport does not sell, rent, or share personal information with third parties. The\nwebsite uses counter.dev, a privacy-focused analytics service that collects only\naggregated, non-identifying data and does not use cookies. Multiport's source code is\nlicensed under the Mozilla Public License 2.0 (MPL-2.0).\n\n## Links\n- Website: https://multiportllc.com\n- Support: support@multiportllc.com";

// Only sent when a question is about PortAI, Multiport, privacy or help.
export const MULTIPORT_KNOWLEDGE_DETAILS = "# PortAI user guide\n\n## What PortAI is\nPortAI (portai.multiportllc.com) is Multiport's free AI chatbot. It has no ads, no tracking\nand no required account. It runs on open-source AI models hosted by Cloudflare with zero\ndata retention, so prompts and replies are not stored by the model host or used for training.\nIt works in any modern browser on phones, tablets and computers. No app store download\nis needed.\n\n## Models (pick one with the model menu at the top)\n- **Regular** (Gemma 4 26B): the default. A good all-rounder for everyday questions, writing\n  and explanations. Limits per person: 60 messages per minute, daily limit 500 messages.\n- **Lite** (GLM-4.7 Flash): fast replies and strong support for 100+ languages. Limits per person: 60 messages per minute, daily limit 500 messages.\n- **Mini** (IBM Granite 4.0 Micro): the smallest and lightest. Best for quick, simple\n  questions. Limits per person: 60 messages per minute, daily limit 500 messages.\n- **Coder** (Qwen 2.5 Coder 32B): best for programming, such as writing, explaining and\n  fixing code. Limits per person: 15 messages per minute, daily limit 100 messages.\n- **Pro** (gpt-oss-120b): the largest model, for harder questions and reasoning. Limits per person: 20 messages per minute, daily limit 150 messages.\n- On top of the per-model limits, each person can send up to 60 messages per minute and\n  500 per day across all models.\n- If the chosen model is busy and hasn't started answering within about 5 seconds, PortAI\n  also asks a backup model and uses whichever answers first. The steps then show, for\n  example, \"Regular was busy, switched to Lite\".\n\n## Live steps\nWhile PortAI works it shows what it is doing, such as \"Connecting…\", \"Searching the web…\",\n\"Extracting page content…\", \"Thinking…\" and \"Writing…\". When the reply is finished, the\nsteps fold into a one-line summary like \"Thought for 0.8s · 120 words\". Tap it to see\neach step.\n\n## Web search (automatic)\n- When a question needs up-to-date information (news, recent releases, prices, newer\n  products or companies), PortAI searches the web by itself before answering. No button\n  press is needed.\n- Sources are shown as numbered links under the answer, matching the [1], [2] citations.\n- The 🌐 button in the top bar switches between **Auto** (default) and **Off**.\n- Only a short search query is sent to the search provider. Your IP address, cookies and\n  chat history are never sent. The free search uses Wikipedia.\n- Limit: 10 searches per minute and 50 per day per person. If the limit is reached, PortAI\n  still answers, just without searching.\n\n## Reading links you paste\n- Paste a link (up to 2 per message) and PortAI reads that page for you (\"Extracting page\n  content from …\"). No setting is needed.\n- PortAI's server fetches the page, so the website never sees your IP address or cookies.\n- Only public web pages are opened. Pages behind a login, private or local network\n  addresses, and very large files (over 1.5 MB) can't be read.\n\n## Chat history and Ghost mode\n- Chats are saved only in your browser, encrypted automatically (AES-256-GCM). They are\n  not stored on Multiport's servers unless you choose to sync them with an account.\n- **Ghost mode** (👻 button): chats in Ghost mode are never saved anywhere, not even\n  encrypted, and disappear when you leave them.\n- Rename or delete a chat with the ✎ and 🗑 buttons next to it in the sidebar.\n- **Settings & privacy** has: a creativity slider, light/dark theme, \"Export chats (JSON)\"\n  and \"Delete all chat history\".\n- Keyboard shortcut: Ctrl+Shift+O (Cmd+Shift+O on Mac) starts a new chat.\n\n## Accounts and sync (optional)\n- Tap **Sign in to sync chats** in the sidebar. There's no email, name or phone number.\n  Your passphrase *is* your account.\n- **Create account**: PortAI generates a strong passphrase like XXXX-XXXX-XXXX-XXXX-XXXX,\n  or you can choose your own (at least 12 characters). Save it somewhere safe.\n- **Sign in** on any device with the same passphrase to see your chats there. Generated\n  passphrases work in lowercase and with spaces instead of dashes.\n- Chats are end-to-end encrypted in your browser before they are uploaded. The server only\n  stores encrypted data and can't read your chats or learn your passphrase.\n- **There is no \"forgot passphrase\".** If it's lost, synced chats can't be recovered by\n  anyone, including Multiport.\n- \"Stay signed in on this device\" keeps you signed in. Turn it off on shared devices.\n- When you sign in, PortAI offers to move chats from that device into your account.\n- You can sign out, or permanently delete your account and all synced chats, from the\n  account screen.\n\n## Install PortAI like an app\n- **iPhone / iPad (Safari)**: open portai.multiportllc.com, tap Share, then\n  **Add to Home Screen**.\n- **Android (Chrome)**: open the site, tap the ⋮ menu, then **Install app** or\n  **Add to Home screen**.\n- **Computer (Chrome / Edge)**: click the install icon in the address bar.\n\n## What PortAI can't do (yet)\n- It can't create images, listen to voice, or read files you upload. Paste text or a link\n  instead.\n- It doesn't remember things between separate chats. Each chat starts fresh.\n- Like any AI, it can make mistakes. Check important information, especially medical,\n  legal or financial facts.\n\n## Messages you might see\n- **\"Rate limit hit. Please try again in N seconds\"**: too many messages too fast. Wait a\n  moment, or switch to another model.\n- **\"Daily limit for <model> reached\"**: that model's daily limit is used up. Try another\n  model, or come back after midnight UTC.\n- **\"Today's free AI allowance has been used up\"**: PortAI's shared free daily AI capacity\n  ran out. It resets at midnight UTC.\n- **\"The model is busy right now\"**: Cloudflare's servers are briefly overloaded. Try\n  again in a moment.\n- **\"Cloudflare security check needed\"**: refresh the page so Cloudflare can verify your\n  browser. VPNs make these checks more likely.\n- **\"You appear to be offline\"**: check your internet connection.\n- **\"No account found for this passphrase\"**: check it for typos. Passphrases are exact,\n  except that generated ones ignore case, spaces and dashes.\n- **Chats missing on another device**: they only appear there if you're signed in to the\n  same account on both devices. Ghost chats are never saved.\n- For anything else, contact Multiport Support at https://support.multiportllc.com or\n  support@multiportllc.com.\n\n## PortAI privacy, in detail\n- No ads, no analytics, no tracking scripts and no third-party code. A strict Content\n  Security Policy enforces this. PortAI itself sets no cookies; Cloudflare may set a\n  security cookie when it checks for bots.\n- PortAI's server doesn't log or store your messages. It relays them to the model and\n  streams the answer back.\n- For rate limits, IP addresses are only stored as scrambled, salted hashes that are\n  deleted after their one-minute or one-day window.\n- The Inter font and all code are served from PortAI itself, so no outside service sees\n  your visit.\n- PortAI is open source under the Mozilla Public License 2.0 (MPL-2.0).\n- Privacy Policy: https://multiportllc.com/privacy · Terms: https://multiportllc.com/terms\n\n# Privacy basics (general explanations)\n- **End-to-end encryption**: data is encrypted on your device and can only be decrypted\n  by you (or the person you send it to). The service in the middle can't read it.\n- **Zero-access encryption**: the provider stores your data encrypted with a key only you\n  have, so the provider itself can't read it.\n- **Zero data retention**: the service processes a request and doesn't keep it afterwards.\n- **Open-source models**: AI models whose weights are published, so anyone can run and\n  inspect them, unlike closed models such as ChatGPT's.\n- **Tracking**: collecting data about what you do online, often across websites, usually\n  for advertising. Signs of it include ad trackers, third-party cookies and fingerprinting\n  scripts.\n- Simple privacy habits: use a password manager, turn on two-factor authentication, keep\n  software updated, review app permissions, and prefer services that don't make money\n  from ads.\n\n# Other privacy-friendly services (general context)\nThese are well-known privacy-focused services people often compare. Details change, so\npoint people to the official sites for current features and pricing. Mention them fairly\nwhen someone asks for alternatives or comparisons.\n- **Proton** (Switzerland): Proton Mail (encrypted email), Proton VPN, Proton Drive,\n  Proton Pass and Proton Calendar.\n- **Lumo** (by Proton, released July 23, 2025): a privacy-first AI assistant.\n  - **No account is required.** You can chat as a guest with limits, or sign in with a free\n    Proton account for more.\n  - It has **web search** (off by default, using privacy-friendly search engines), can analyse\n    files you upload (or files from Proton Drive), and runs on **open-source** language models.\n  - Chats are stored with zero-access encryption, it keeps no logs of conversations, and it\n    says it doesn't use user data to train AI.\n  - It runs from European data centres (Germany and Norway).\n  - Apps: web, iOS and Android. A paid plan (Lumo Plus) adds higher limits.\n- **DuckDuckGo**: a search engine that doesn't track searches, plus a browser and Duck.ai,\n  which offers anonymous access to several AI chat models.\n- **Brave**: a browser that blocks ads and trackers by default, with Brave Search (its own\n  independent index) and an AI assistant called Leo.\n- **Signal**: end-to-end encrypted messaging and calls, run by a non-profit.\n- **Mullvad VPN**: a VPN that doesn't require an email address to sign up.\n- **Firefox** (Mozilla): an open-source browser with built-in tracking protection.\n- **Tor Browser**: routes traffic through several relays to hide your location and\n  activity.\n- **PortAI vs Lumo, fairly:** both are privacy-first, need no account, run on open-source\n  models and can search the web. Lumo is made by Proton (a large privacy company), works\n  with Proton Drive files and has a paid plan. PortAI is made by Multiport (an independent\n  one-person company). It is completely free, lets you pick between five models, searches\n  automatically when needed, reads links you paste, and offers end-to-end encrypted sync\n  with a passphrase-only account (no email at all).\n- When comparing products, only state features listed here or in search results. If a\n  detail isn't known, say so instead of guessing (never claim a feature is missing just\n  because it isn't listed).";

// Topic library: only the sections matching a question are sent.
export const MULTIPORT_LIBRARY = [
 {
  "title": "Passwords and password managers",
  "topics": [
   "password",
   "passwords",
   "password manager",
   "passphrase",
   "bitwarden",
   "1password",
   "keepass",
   "proton pass",
   "reuse",
   "hacked",
   "breach",
   "leaked"
  ],
  "text": "## Passwords and password managers\n- Use a different password for every account. Reused passwords let one data breach unlock many accounts.\n- Long passphrases (4–6 random words) are easier to remember and harder to crack than short complex passwords.\n- A password manager creates, stores and fills strong unique passwords. Well-known options: Bitwarden (open source, free plan), Proton Pass, 1Password, KeePassXC (offline, open source), and the built-in managers in Apple devices, Google Chrome and Firefox.\n- Protect the password manager itself with a strong master passphrase and two-factor authentication.\n- Check whether your email appeared in a known breach at haveibeenpwned.com, and change passwords for any affected accounts."
 },
 {
  "title": "Two-factor authentication (2FA)",
  "topics": [
   "2fa",
   "two-factor",
   "two factor",
   "mfa",
   "multi-factor",
   "authenticator",
   "verification code",
   "security key",
   "yubikey",
   "sms code",
   "otp"
  ],
  "text": "## Two-factor authentication (2FA)\n- 2FA adds a second step after your password, so a stolen password alone isn't enough.\n- From strongest to weakest: hardware security keys (e.g. YubiKey) and passkeys → authenticator apps (time-based codes, e.g. Aegis, Ente Auth, Google Authenticator, Microsoft Authenticator, 2FAS) → SMS codes (better than nothing, but vulnerable to SIM-swap attacks).\n- Save the backup/recovery codes each service gives you somewhere safe (for example in your password manager).\n- Turn on 2FA first for email, password manager, banking and cloud storage. Email matters most, because it can reset everything else."
 },
 {
  "title": "Passkeys",
  "topics": [
   "passkey",
   "passkeys",
   "passwordless",
   "face id login",
   "fingerprint login",
   "webauthn",
   "fido"
  ],
  "text": "## Passkeys\n- A passkey replaces a password with a cryptographic key stored on your device or in your password manager, unlocked with Face ID, a fingerprint or your device PIN.\n- Passkeys can't be phished or reused, because each one only works on the website it was created for.\n- They sync through iCloud Keychain, Google Password Manager or password managers like Bitwarden, Proton Pass and 1Password.\n- Many big services (Google, Apple, Microsoft, Amazon, PayPal, GitHub and others) support them. Look for \"passkeys\" in the account's security settings."
 },
 {
  "title": "Phishing and online scams",
  "topics": [
   "phishing",
   "scam",
   "scams",
   "scammer",
   "fraud",
   "suspicious email",
   "suspicious text",
   "fake website",
   "smishing",
   "gift card",
   "tech support scam",
   "impersonation",
   "link safe"
  ],
  "text": "## Phishing and online scams\n- Warning signs: urgency or threats (\"your account will be closed\"), requests for passwords, codes or payment, unexpected attachments, gift-card payment requests, slightly wrong sender addresses or website names, and offers that are too good to be true.\n- Never share 2FA codes. Real companies don't ask for them.\n- Don't click links in unexpected messages. Open the app or type the website address yourself instead.\n- If someone calls claiming to be your bank, hang up and call the number on your card.\n- If you clicked or shared something: change the affected password immediately, turn on 2FA, contact your bank if money is involved, and report it (for example to the company being impersonated, or the authorities' fraud reporting site in your country)."
 },
 {
  "title": "Private browsing and browser privacy",
  "topics": [
   "private browsing",
   "incognito",
   "browser privacy",
   "cookies",
   "tracking cookies",
   "ublock",
   "ad blocker",
   "tracker blocker",
   "fingerprinting",
   "safari privacy",
   "chrome privacy",
   "firefox privacy"
  ],
  "text": "## Private browsing and browser privacy\n- Private/incognito mode only stops your device from saving history, cookies and form data after you close the window. Websites, your internet provider, your employer or school can still see what you do.\n- Better privacy: use a browser with tracking protection (Firefox, Brave, Safari, DuckDuckGo browser), block third-party cookies, and add a content blocker such as uBlock Origin (where supported).\n- Review site permissions (location, camera, microphone, notifications) in your browser's settings.\n- Use a privacy-respecting search engine such as DuckDuckGo, Brave Search, Startpage or Mojeek."
 },
 {
  "title": "VPNs explained",
  "topics": [
   "vpn",
   "vpns",
   "virtual private network",
   "mullvad",
   "proton vpn",
   "ip address",
   "hide ip",
   "public wifi",
   "geo-block"
  ],
  "text": "## VPNs explained\n- A VPN encrypts your connection to the VPN server and hides your IP address from the sites you visit. Your internet provider can see that you use a VPN, but not which sites you visit.\n- A VPN does **not** make you anonymous: websites can still identify you through logins, cookies and browser fingerprinting, and the VPN provider can see your traffic metadata.\n- Choose a provider with an independently audited no-logs policy and a clear business model. Avoid free VPNs that make money from your data. Well-regarded options include Mullvad, Proton VPN (has a free plan) and IVPN.\n- VPNs are most useful on public Wi-Fi, for hiding your browsing from your internet provider, and for avoiding IP-based tracking."
 },
 {
  "title": "iPhone and iPad privacy settings",
  "topics": [
   "iphone",
   "ipad",
   "ios",
   "ipados",
   "apple privacy",
   "app tracking",
   "location services",
   "safari",
   "icloud",
   "siri",
   "lockdown mode",
   "mail privacy protection"
  ],
  "text": "## iPhone and iPad privacy settings\n- **Settings → Privacy & Security → Tracking**: turn off \"Allow Apps to Request to Track\" so every app is told not to track you.\n- **Location Services**: give each app \"While Using\" or \"Never\", and turn off \"Precise Location\" where it isn't needed.\n- **Safety Check** (Privacy & Security) reviews who and what has access to your data and lets you reset it quickly.\n- **Mail → Privacy Protection**: \"Protect Mail Activity\" hides your IP and blocks tracking pixels in emails.\n- **Safari**: \"Prevent Cross-Site Tracking\" and \"Hide IP Address\" (Settings → Safari).\n- **Lockdown Mode** is an extreme protection for people who may be personally targeted by sophisticated attacks.\n- Keep iOS updated: updates fix security holes."
 },
 {
  "title": "Android privacy settings",
  "topics": [
   "android",
   "samsung",
   "pixel",
   "google account",
   "permission manager",
   "privacy dashboard",
   "advertising id",
   "ad id",
   "google activity",
   "location history"
  ],
  "text": "## Android privacy settings\n- **Settings → Security & privacy → Privacy** (names vary by phone): the **Privacy dashboard** shows which apps used location, camera and microphone recently, and the **Permission manager** lets you revoke access.\n- **Delete the advertising ID** (Settings → Privacy → Ads, Android 12+) so apps can't use it to track you.\n- Give location \"Only while using the app\" and turn off \"Use precise location\" where it isn't needed.\n- In your Google Account (myaccount.google.com → Data & privacy) you can pause or auto-delete Web & App Activity, Location/Timeline and YouTube history.\n- Install apps only from trusted stores and keep the phone updated."
 },
 {
  "title": "Encrypted messaging apps",
  "topics": [
   "signal",
   "whatsapp",
   "telegram",
   "imessage",
   "messenger",
   "encrypted messaging",
   "end-to-end",
   "chat app",
   "private messaging",
   "secure messaging"
  ],
  "text": "## Encrypted messaging apps\n- **Signal**: end-to-end encrypted by default for messages, calls and groups, collects almost no metadata, run by a non-profit. Widely considered the most private mainstream option.\n- **WhatsApp**: messages and calls are end-to-end encrypted by default (using the Signal Protocol), but it's owned by Meta and collects metadata (who you talk to, when, how often).\n- **iMessage / FaceTime**: end-to-end encrypted between Apple devices. Messages to Android phones use SMS/RCS, which may not be.\n- **Telegram**: regular chats and groups are *not* end-to-end encrypted. Only optional one-to-one \"Secret Chats\" are.\n- **Facebook Messenger**: has rolled out end-to-end encryption for personal chats."
 },
 {
  "title": "Email privacy",
  "topics": [
   "email privacy",
   "private email",
   "email alias",
   "hide my email",
   "simplelogin",
   "addy",
   "tracking pixel",
   "newsletter tracking",
   "spam",
   "proton mail",
   "tuta",
   "gmail privacy"
  ],
  "text": "## Email privacy\n- Encrypted email providers: Proton Mail (Switzerland) and Tuta (Germany) encrypt stored mail so the provider can't read it.\n- **Email aliases** hide your real address when signing up for sites: Apple's Hide My Email, Proton Pass/SimpleLogin, addy.io, Firefox Relay. If an alias starts getting spam, delete it.\n- Many marketing emails contain tracking pixels that report when and where you opened them. Block remote images, or use Apple Mail Privacy Protection.\n- Never trust the sender's name alone. Check the actual address before clicking anything."
 },
 {
  "title": "Data brokers and removing your information",
  "topics": [
   "data broker",
   "data brokers",
   "people search",
   "remove my info",
   "opt out",
   "personal information online",
   "delete my data",
   "gdpr",
   "ccpa",
   "right to be forgotten"
  ],
  "text": "## Data brokers and removing your information\n- Data brokers collect and sell personal information (addresses, phone numbers, relatives, purchase habits).\n- You can request removal from each broker's opt-out page, or use paid removal services that do it repeatedly.\n- In the EU/UK, GDPR gives you the right to access and delete your data. In California, the CCPA/CPRA gives similar rights. Many companies honor such requests everywhere.\n- Google offers \"Results about you\" to request removal of search results showing your contact details."
 },
 {
  "title": "Public Wi-Fi safety",
  "topics": [
   "public wifi",
   "public wi-fi",
   "hotel wifi",
   "airport wifi",
   "cafe wifi",
   "hotspot",
   "free wifi"
  ],
  "text": "## Public Wi-Fi safety\n- Most websites use HTTPS, which encrypts what you send, so public Wi-Fi is much safer than it used to be.\n- Still: avoid unknown networks with generic names (they may be fake hotspots), turn off auto-join, and don't install anything a captive portal asks for.\n- For sensitive tasks, use your phone's mobile data/hotspot or a trusted VPN."
 },
 {
  "title": "Backups",
  "topics": [
   "backup",
   "backups",
   "back up",
   "3-2-1",
   "lost files",
   "ransomware",
   "icloud backup",
   "google drive backup",
   "external drive",
   "restore"
  ],
  "text": "## Backups\n- The 3-2-1 rule: keep 3 copies of important data, on 2 different types of storage, with 1 copy off-site (for example in the cloud).\n- Automatic backups are the ones that actually happen: iCloud/Google backups for phones, Time Machine (Mac), File History (Windows).\n- Test restoring a file occasionally. A backup you can't restore isn't a backup.\n- Offline or versioned backups protect against ransomware."
 },
 {
  "title": "Using AI assistants safely",
  "topics": [
   "ai safety",
   "using ai",
   "chatbot safety",
   "ai privacy",
   "share with ai",
   "hallucination",
   "hallucinate",
   "ai mistakes",
   "ai accurate",
   "can i trust ai",
   "ai training data"
  ],
  "text": "## Using AI assistants safely\n- Don't share secrets with any AI service: passwords, full card numbers, government ID numbers or private details about other people.\n- AI can be confidently wrong (\"hallucinations\"). Double-check facts, quotes, numbers, legal, medical and financial information with reliable sources.\n- Check whether a service uses your chats for training. PortAI doesn't: its models run with zero data retention, and chat history stays encrypted on your device.\n- AI is great for drafts, explanations, brainstorming, summaries and code, but you stay responsible for what you use."
 },
 {
  "title": "Getting better answers from PortAI",
  "topics": [
   "prompt",
   "prompting",
   "better answers",
   "how to ask",
   "tips for portai",
   "how to use portai",
   "write a prompt",
   "get better results"
  ],
  "text": "## Getting better answers from PortAI\n- Give context: who it's for, what you already know, and what you want (\"Explain to a 12-year-old…\", \"I'm a beginner in Python…\").\n- Say the format: \"in 5 bullet points\", \"as a table\", \"under 100 words\", \"as an email\".\n- Paste the text or a link you want summarized, translated or checked. PortAI reads links automatically.\n- Ask follow-ups to refine: \"shorter\", \"more formal\", \"give an example\".\n- Pick the right model: Coder for programming, Pro for hard reasoning, Lite for other languages, Regular for most things."
 },
 {
  "title": "Kids and family online safety",
  "topics": [
   "kids",
   "children",
   "parental controls",
   "family",
   "screen time",
   "child safety",
   "teen",
   "teenager",
   "family link"
  ],
  "text": "## Kids and family online safety\n- Built-in parental controls: Apple Screen Time and Family Sharing, Google Family Link, and console and streaming-service controls.\n- Talk openly about not sharing personal details, about scams and strangers online, and that they can always come to you if something feels wrong.\n- Keep devices in shared spaces for younger kids, and review app permissions and age ratings together."
 },
 {
  "title": "Countries and capitals: Europe",
  "topics": [
   "capital",
   "capitals",
   "capital city",
   "europe",
   "european",
   "country in europe",
   "eu",
   "european union"
  ],
  "text": "## Countries and capitals: Europe\nAlbania – Tirana · Andorra – Andorra la Vella · Austria – Vienna · Belarus – Minsk · Belgium – Brussels · Bosnia and Herzegovina – Sarajevo · Bulgaria – Sofia · Croatia – Zagreb · Cyprus – Nicosia · Czech Republic (Czechia) – Prague · Denmark – Copenhagen · Estonia – Tallinn · Finland – Helsinki · France – Paris · Germany – Berlin · Greece – Athens · Hungary – Budapest · Iceland – Reykjavík · Ireland – Dublin · Italy – Rome · Kosovo – Pristina · Latvia – Riga · Liechtenstein – Vaduz · Lithuania – Vilnius · Luxembourg – Luxembourg City · Malta – Valletta · Moldova – Chișinău · Monaco – Monaco · Montenegro – Podgorica · Netherlands – Amsterdam (government sits in The Hague) · North Macedonia – Skopje · Norway – Oslo · Poland – Warsaw · Portugal – Lisbon · Romania – Bucharest · Russia – Moscow · San Marino – San Marino · Serbia – Belgrade · Slovakia – Bratislava · Slovenia – Ljubljana · Spain – Madrid · Sweden – Stockholm · Switzerland – Bern (federal city) · Ukraine – Kyiv · United Kingdom – London (England – London, Scotland – Edinburgh, Wales – Cardiff, Northern Ireland – Belfast) · Vatican City – Vatican City."
 },
 {
  "title": "Countries and capitals: Asia and the Middle East",
  "topics": [
   "capital",
   "capitals",
   "capital city",
   "asia",
   "asian",
   "middle east",
   "country in asia"
  ],
  "text": "## Countries and capitals: Asia and the Middle East\nAfghanistan – Kabul · Armenia – Yerevan · Azerbaijan – Baku · Bahrain – Manama · Bangladesh – Dhaka · Bhutan – Thimphu · Brunei – Bandar Seri Begawan · Cambodia – Phnom Penh · China – Beijing · Georgia – Tbilisi · India – New Delhi · Indonesia – Jakarta (a new capital, Nusantara, is being built on Borneo) · Iran – Tehran · Iraq – Baghdad · Israel – Jerusalem (proclaimed by Israel; its status is disputed internationally and most embassies are in Tel Aviv) · Japan – Tokyo · Jordan – Amman · Kazakhstan – Astana · Kuwait – Kuwait City · Kyrgyzstan – Bishkek · Laos – Vientiane · Lebanon – Beirut · Malaysia – Kuala Lumpur (government offices in Putrajaya) · Maldives – Malé · Mongolia – Ulaanbaatar · Myanmar – Naypyidaw · Nepal – Kathmandu · North Korea – Pyongyang · Oman – Muscat · Pakistan – Islamabad · Philippines – Manila · Qatar – Doha · Saudi Arabia – Riyadh · Singapore – Singapore · South Korea – Seoul · Sri Lanka – Sri Jayawardenepura Kotte (Colombo is the largest city) · Syria – Damascus · Taiwan – Taipei · Tajikistan – Dushanbe · Thailand – Bangkok · Timor-Leste – Dili · Turkey (Türkiye) – Ankara · Turkmenistan – Ashgabat · United Arab Emirates – Abu Dhabi · Uzbekistan – Tashkent · Vietnam – Hanoi · Yemen – Sanaa (officially)."
 },
 {
  "title": "Countries and capitals: Africa",
  "topics": [
   "capital",
   "capitals",
   "capital city",
   "africa",
   "african",
   "country in africa"
  ],
  "text": "## Countries and capitals: Africa\nAlgeria – Algiers · Angola – Luanda · Benin – Porto-Novo (government in Cotonou) · Botswana – Gaborone · Burkina Faso – Ouagadougou · Burundi – Gitega · Cabo Verde – Praia · Cameroon – Yaoundé · Central African Republic – Bangui · Chad – N'Djamena · Comoros – Moroni · DR Congo – Kinshasa · Republic of the Congo – Brazzaville · Côte d'Ivoire – Yamoussoukro (Abidjan is the economic capital) · Djibouti – Djibouti · Egypt – Cairo · Equatorial Guinea – Malabo · Eritrea – Asmara · Eswatini – Mbabane (with Lobamba) · Ethiopia – Addis Ababa · Gabon – Libreville · Gambia – Banjul · Ghana – Accra · Guinea – Conakry · Guinea-Bissau – Bissau · Kenya – Nairobi · Lesotho – Maseru · Liberia – Monrovia · Libya – Tripoli · Madagascar – Antananarivo · Malawi – Lilongwe · Mali – Bamako · Mauritania – Nouakchott · Mauritius – Port Louis · Morocco – Rabat · Mozambique – Maputo · Namibia – Windhoek · Niger – Niamey · Nigeria – Abuja · Rwanda – Kigali · São Tomé and Príncipe – São Tomé · Senegal – Dakar · Seychelles – Victoria · Sierra Leone – Freetown · Somalia – Mogadishu · South Africa – Pretoria (executive), Cape Town (legislative), Bloemfontein (judicial) · South Sudan – Juba · Sudan – Khartoum · Tanzania – Dodoma · Togo – Lomé · Tunisia – Tunis · Uganda – Kampala · Zambia – Lusaka · Zimbabwe – Harare."
 },
 {
  "title": "Countries and capitals: the Americas and Oceania",
  "topics": [
   "capital",
   "capitals",
   "capital city",
   "america",
   "americas",
   "north america",
   "south america",
   "latin america",
   "caribbean",
   "central america",
   "oceania",
   "pacific",
   "australia",
   "new zealand"
  ],
  "text": "## Countries and capitals: the Americas and Oceania\n**North & Central America, Caribbean:** Antigua and Barbuda – St. John's · Bahamas – Nassau · Barbados – Bridgetown · Belize – Belmopan · Canada – Ottawa · Costa Rica – San José · Cuba – Havana · Dominica – Roseau · Dominican Republic – Santo Domingo · El Salvador – San Salvador · Grenada – St. George's · Guatemala – Guatemala City · Haiti – Port-au-Prince · Honduras – Tegucigalpa · Jamaica – Kingston · Mexico – Mexico City · Nicaragua – Managua · Panama – Panama City · Saint Kitts and Nevis – Basseterre · Saint Lucia – Castries · Saint Vincent and the Grenadines – Kingstown · Trinidad and Tobago – Port of Spain · United States – Washington, D.C.\n**South America:** Argentina – Buenos Aires · Bolivia – Sucre (constitutional) and La Paz (seat of government) · Brazil – Brasília · Chile – Santiago · Colombia – Bogotá · Ecuador – Quito · Guyana – Georgetown · Paraguay – Asunción · Peru – Lima · Suriname – Paramaribo · Uruguay – Montevideo · Venezuela – Caracas.\n**Oceania:** Australia – Canberra · Fiji – Suva · Kiribati – South Tarawa · Marshall Islands – Majuro · Micronesia – Palikir · Nauru – no official capital (government in Yaren) · New Zealand – Wellington · Palau – Ngerulmud · Papua New Guinea – Port Moresby · Samoa – Apia · Solomon Islands – Honiara · Tonga – Nukuʻalofa · Tuvalu – Funafuti · Vanuatu – Port Vila."
 },
 {
  "title": "US states and capitals",
  "topics": [
   "capital",
   "capitals",
   "state capital",
   "us state",
   "us states",
   "united states",
   "american state",
   "states of america",
   "usa",
   "state of",
   "province",
   "provinces",
   "canadian province"
  ],
  "text": "## US states and capitals\nAlabama – Montgomery · Alaska – Juneau · Arizona – Phoenix · Arkansas – Little Rock · California – Sacramento · Colorado – Denver · Connecticut – Hartford · Delaware – Dover · Florida – Tallahassee · Georgia – Atlanta · Hawaii – Honolulu · Idaho – Boise · Illinois – Springfield · Indiana – Indianapolis · Iowa – Des Moines · Kansas – Topeka · Kentucky – Frankfort · Louisiana – Baton Rouge · Maine – Augusta · Maryland – Annapolis · Massachusetts – Boston · Michigan – Lansing · Minnesota – Saint Paul · Mississippi – Jackson · Missouri – Jefferson City · Montana – Helena · Nebraska – Lincoln · Nevada – Carson City · New Hampshire – Concord · New Jersey – Trenton · New Mexico – Santa Fe · New York – Albany · North Carolina – Raleigh · North Dakota – Bismarck · Ohio – Columbus · Oklahoma – Oklahoma City · Oregon – Salem · Pennsylvania – Harrisburg · Rhode Island – Providence · South Carolina – Columbia · South Dakota – Pierre · Tennessee – Nashville · Texas – Austin · Utah – Salt Lake City · Vermont – Montpelier · Virginia – Richmond · Washington – Olympia · West Virginia – Charleston · Wisconsin – Madison · Wyoming – Cheyenne.\nThe US has 50 states plus Washington, D.C. (the federal capital) and territories such as Puerto Rico (capital San Juan) and Guam (Hagåtña).\n**Canada** (provinces and territories): Alberta – Edmonton · British Columbia – Victoria · Manitoba – Winnipeg · New Brunswick – Fredericton · Newfoundland and Labrador – St. John's · Nova Scotia – Halifax · Ontario – Toronto · Prince Edward Island – Charlottetown · Quebec – Quebec City · Saskatchewan – Regina · Northwest Territories – Yellowknife · Nunavut – Iqaluit · Yukon – Whitehorse.\n**Australia** (states and territories): New South Wales – Sydney · Victoria – Melbourne · Queensland – Brisbane · Western Australia – Perth · South Australia – Adelaide · Tasmania – Hobart · Northern Territory – Darwin · Australian Capital Territory – Canberra."
 },
 {
  "title": "World geography records",
  "topics": [
   "continent",
   "continents",
   "ocean",
   "oceans",
   "largest country",
   "biggest country",
   "smallest country",
   "most populous",
   "population",
   "tallest mountain",
   "highest mountain",
   "everest",
   "longest river",
   "nile",
   "amazon",
   "desert",
   "sahara",
   "lake",
   "deepest",
   "waterfall",
   "largest island",
   "geography"
  ],
  "text": "## World geography records\n- **7 continents** (largest to smallest): Asia, Africa, North America, South America, Antarctica, Europe, Australia/Oceania.\n- **5 oceans** (largest to smallest): Pacific, Atlantic, Indian, Southern, Arctic.\n- **Largest countries by area:** Russia, Canada, China, United States (China and the US are close, and the order depends on how waters are counted), Brazil, Australia. **Smallest:** Vatican City (about 0.44 km²), then Monaco.\n- **Most populous countries:** India (overtook China in 2023), China, United States, Indonesia, Pakistan. World population is a little over 8 billion.\n- **Highest mountain:** Mount Everest, 8,849 m (29,032 ft), on the Nepal–China border. Second: K2 (8,611 m). Highest in each continent: Aconcagua (South America, 6,961 m), Denali (North America, 6,190 m), Kilimanjaro (Africa, 5,895 m), Elbrus (Europe, 5,642 m), Vinson (Antarctica, 4,892 m), Kosciuszko (mainland Australia, 2,228 m).\n- **Longest rivers:** the Nile (about 6,650 km) and the Amazon (about 6,400 km; some measurements make it longer). The Amazon carries by far the most water.\n- **Largest deserts:** Antarctica and the Arctic (cold deserts), then the Sahara (largest hot desert).\n- **Largest lake:** the Caspian Sea. Largest freshwater lake by area: Lake Superior. Deepest: Lake Baikal (about 1,640 m).\n- **Deepest point:** Challenger Deep in the Mariana Trench, about 10,900 m below sea level.\n- **Highest waterfall:** Angel Falls, Venezuela (979 m). **Largest island:** Greenland. **Largest country in Africa:** Algeria. **Largest in South America:** Brazil."
 },
 {
  "title": "Famous landmarks and where they are",
  "topics": [
   "landmark",
   "landmarks",
   "wonder",
   "wonders",
   "monument",
   "tourist",
   "visit",
   "travel",
   "eiffel",
   "statue of liberty",
   "great wall",
   "taj mahal",
   "colosseum",
   "machu picchu",
   "pyramid",
   "pyramids",
   "petra",
   "stonehenge",
   "burj khalifa",
   "big ben",
   "golden gate",
   "opera house",
   "angkor"
  ],
  "text": "## Famous landmarks and where they are\n- **Eiffel Tower**: Paris, France. Built for the 1889 World's Fair, about 330 m tall.\n- **Statue of Liberty**: New York City, USA. A gift from France, dedicated in 1886.\n- **Great Wall of China**: northern China. Built and rebuilt over many centuries, with most surviving parts from the Ming dynasty.\n- **Taj Mahal**: Agra, India. A white marble mausoleum built by Mughal emperor Shah Jahan for his wife Mumtaz Mahal (1600s).\n- **Colosseum**: Rome, Italy. Ancient amphitheatre completed in 80 AD.\n- **Machu Picchu**: Peru. A 15th-century Inca citadel in the Andes.\n- **Pyramids of Giza**: near Cairo, Egypt. The Great Pyramid (about 2560 BC) is the only surviving Ancient Wonder of the World.\n- **Petra**: Jordan. A city carved into rock by the Nabataeans.\n- **Christ the Redeemer**: Rio de Janeiro, Brazil, completed in 1931.\n- **Chichén Itzá**: Yucatán, Mexico. A Maya city.\n- **Stonehenge**: Wiltshire, England. A prehistoric stone circle (about 3000–2000 BC).\n- **Burj Khalifa**: Dubai, UAE. The world's tallest building (828 m, opened 2010).\n- **Big Ben**: London. The bell in the Elizabeth Tower at the Houses of Parliament.\n- **Golden Gate Bridge**: San Francisco, opened in 1937.\n- **Sydney Opera House**: Australia, opened in 1973.\n- **Angkor Wat**: Cambodia. The largest religious monument in the world (12th century).\n- **Acropolis and Parthenon**: Athens, Greece.\n- **Sagrada Família**: Barcelona, Spain. Antoni Gaudí's basilica, under construction since 1882.\n- **Leaning Tower of Pisa**: Italy. **Hagia Sophia**: Istanbul, Türkiye. **Forbidden City**: Beijing. **Alhambra**: Granada, Spain. **Mount Rushmore**: South Dakota, USA.\n- **The New Seven Wonders of the World** (2007 vote): Great Wall, Petra, Christ the Redeemer, Machu Picchu, Chichén Itzá, Colosseum, Taj Mahal."
 },
 {
  "title": "Amusement parks and roller coasters",
  "topics": [
   "roller coaster",
   "roller coasters",
   "coaster",
   "coasters",
   "amusement park",
   "theme park",
   "kings island",
   "cedar point",
   "disney",
   "disneyland",
   "disney world",
   "six flags",
   "universal"
  ],
  "text": "## Amusement parks and roller coasters\n- **Kings Island**: an amusement park in Mason, Ohio, USA (near Cincinnati). Famous coasters include **The Beast** (1979, the world's longest wooden roller coaster), **Diamondback**, **Orion** (a giga coaster over 300 ft tall, opened 2020), **Banshee** (an inverted coaster) and **Mystic Timbers**. Multiport's Kings Island Coaster Finder (kicf.ps.multiportllc.com) helps you find rides there.\n- **Cedar Point**: Sandusky, Ohio. Known as the \"Roller Coaster Capital of the World\".\n- **Walt Disney World**: near Orlando, Florida, with four theme parks (Magic Kingdom, EPCOT, Hollywood Studios, Animal Kingdom). **Disneyland**: Anaheim, California, opened in 1955 (the original Disney park).\n- **Universal Studios**: parks in Orlando, Hollywood, Japan, Singapore and Beijing.\n- Coaster terms: a **giga coaster** is 300–399 ft tall, a **strata coaster** 400+ ft. **Inverted** coasters hang below the track. **Wooden** coasters have wooden tracks."
 },
 {
  "title": "The solar system and space",
  "topics": [
   "planet",
   "planets",
   "solar system",
   "sun",
   "moon",
   "mars",
   "jupiter",
   "saturn",
   "venus",
   "mercury",
   "neptune",
   "uranus",
   "pluto",
   "space",
   "star",
   "stars",
   "galaxy",
   "milky way",
   "astronaut",
   "light year",
   "nasa"
  ],
  "text": "## The solar system and space\n- **The planets in order from the Sun:** Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune. (Pluto was reclassified as a dwarf planet in 2006.) Memory aid: \"My Very Educated Mother Just Served Us Noodles.\"\n- **Jupiter** is the largest planet. **Mercury** is the smallest and closest to the Sun. **Venus** is the hottest (thick CO₂ atmosphere). **Saturn** has the most famous rings. **Mars** is the \"Red Planet\".\n- The Sun is about 150 million km from Earth (1 astronomical unit). Sunlight takes about 8 minutes 20 seconds to reach us.\n- The Moon is about 384,400 km away. Humans first landed on it on July 20, 1969 (Apollo 11: Neil Armstrong and Buzz Aldrin).\n- A **light-year** is the distance light travels in a year, about 9.46 trillion km. The nearest star after the Sun is Proxima Centauri (about 4.24 light-years away).\n- We live in the **Milky Way** galaxy. The nearest large galaxy is Andromeda. The universe is about 13.8 billion years old, and Earth about 4.5 billion years old."
 },
 {
  "title": "Science basics and useful facts",
  "topics": [
   "science",
   "chemistry",
   "physics",
   "biology",
   "element",
   "elements",
   "periodic table",
   "atom",
   "speed of light",
   "gravity",
   "boiling point",
   "freezing point",
   "water",
   "dna",
   "cell",
   "photosynthesis",
   "human body",
   "bones",
   "blood"
  ],
  "text": "## Science basics and useful facts\n- **Water** (H₂O) boils at 100 °C (212 °F) and freezes at 0 °C (32 °F) at sea level.\n- **Speed of light:** about 299,792 km per second. **Sound** in air: about 343 m/s.\n- **Gravity** on Earth: about 9.81 m/s². On the Moon it's about one-sixth as strong.\n- **Common elements:** H hydrogen, He helium, C carbon, N nitrogen, O oxygen, Na sodium, Fe iron, Cu copper, Ag silver, Au gold, Pb lead, Hg mercury, U uranium. The periodic table has 118 known elements.\n- **Air** is about 78% nitrogen, 21% oxygen and 1% argon and other gases.\n- **Human body:** adults have 206 bones, normal temperature is about 37 °C (98.6 °F), the heart has 4 chambers, and the main blood types are A, B, AB and O (each + or −). DNA carries genetic information. The largest organ is the skin.\n- **Photosynthesis:** plants use sunlight, water and carbon dioxide to make sugar and release oxygen."
 },
 {
  "title": "Units and conversions",
  "topics": [
   "convert",
   "conversion",
   "conversions",
   "inches",
   "inch",
   "cm",
   "centimeters",
   "feet",
   "foot",
   "meters",
   "miles",
   "mile",
   "km",
   "kilometers",
   "pounds",
   "lbs",
   "kg",
   "kilograms",
   "ounces",
   "grams",
   "fahrenheit",
   "celsius",
   "gallons",
   "liters",
   "litres",
   "cups",
   "tablespoon",
   "teaspoon"
  ],
  "text": "## Units and conversions\n- **Length:** 1 inch = 2.54 cm · 1 foot = 30.48 cm · 1 yard = 0.9144 m · 1 mile = 1.609 km · 1 km = 0.621 miles · 1 m = 3.281 ft.\n- **Weight:** 1 kg = 2.205 lb · 1 lb = 453.6 g · 1 oz = 28.35 g · 1 stone = 14 lb.\n- **Volume:** 1 US gallon = 3.785 L · 1 L = 0.264 US gal · 1 US cup = about 237 ml · 1 tablespoon = about 15 ml · 1 teaspoon = about 5 ml.\n- **Temperature:** °F = °C × 9/5 + 32 and °C = (°F − 32) × 5/9. For example, 20 °C = 68 °F, 30 °C = 86 °F and 0 °F = −17.8 °C.\n- **Speed:** 100 km/h = about 62 mph · 60 mph = about 97 km/h.\n- **Data:** 1 KB = 1,000 bytes · 1 MB = 1,000 KB · 1 GB = 1,000 MB · 1 TB = 1,000 GB (operating systems sometimes use 1,024)."
 },
 {
  "title": "Time zones",
  "topics": [
   "time zone",
   "time zones",
   "timezone",
   "utc",
   "gmt",
   "what time is it in",
   "time difference",
   "daylight saving",
   "dst"
  ],
  "text": "## Time zones\nStandard-time offsets from UTC (many places add +1 hour for daylight saving time in summer):\n- Los Angeles/San Francisco UTC−8 (summer −7) · Denver UTC−7 · Chicago UTC−6 · New York/Toronto UTC−5 (summer −4) · São Paulo UTC−3\n- London/Lisbon UTC±0 (summer +1) · Paris/Berlin/Rome/Madrid UTC+1 (summer +2) · Athens/Cairo/Johannesburg UTC+2 · Moscow/Istanbul UTC+3 · Dubai UTC+4\n- India UTC+5:30 · Bangkok/Jakarta UTC+7 · Beijing/Singapore/Perth UTC+8 · Tokyo/Seoul UTC+9 · Sydney UTC+10 (southern summer +11) · Auckland UTC+12 (summer +13)\n- PortAI doesn't know the current time where you are. Check your device clock."
 },
 {
  "title": "Languages of the world",
  "topics": [
   "language",
   "languages",
   "most spoken",
   "speak",
   "spoken",
   "official language",
   "mandarin",
   "spanish",
   "hindi",
   "arabic",
   "french",
   "translate"
  ],
  "text": "## Languages of the world\n- **Most spoken languages** (native plus second-language speakers): English, Mandarin Chinese, Hindi, Spanish, then French, Arabic, Bengali, Portuguese, Russian and Urdu.\n- **Most native speakers:** Mandarin Chinese, then Spanish and English.\n- **The UN's six official languages:** Arabic, Chinese, English, French, Russian, Spanish.\n- PortAI can translate between many languages. The Lite model is especially strong across languages."
 },
 {
  "title": "Key dates in world history",
  "topics": [
   "history",
   "historical",
   "timeline",
   "war",
   "world war",
   "ancient",
   "medieval",
   "revolution",
   "independence",
   "empire",
   "when did",
   "what year",
   "century"
  ],
  "text": "## Key dates in world history\n- About 3100 BC: Egypt unified and writing appears in Mesopotamia and Egypt · 776 BC: first recorded Olympic Games (Greece) · 44 BC: Julius Caesar assassinated · 476 AD: fall of the Western Roman Empire\n- 1066: Norman conquest of England (Battle of Hastings) · 1215: Magna Carta · 1440s: Gutenberg's printing press · 1492: Columbus reaches the Americas · 1517: the Protestant Reformation begins\n- 1776: US Declaration of Independence · 1789: the French Revolution begins · 1914–1918: World War I · 1939–1945: World War II · 1945: United Nations founded\n- 1947: India and Pakistan become independent · 1969: first Moon landing · 1989: the Berlin Wall falls · 1991: the Soviet Union dissolves · 1989–1991: the World Wide Web is invented (Tim Berners-Lee)\n- 2001: September 11 attacks · 2007: first iPhone · 2020: COVID-19 declared a pandemic (March 2020)\n- For recent events, PortAI searches the web automatically."
 },
 {
  "title": "Inventions and inventors",
  "topics": [
   "invented",
   "inventor",
   "invention",
   "inventions",
   "who invented",
   "who made the first",
   "discovered",
   "discovery"
  ],
  "text": "## Inventions and inventors\n- Printing press: Johannes Gutenberg (1440s) · Telescope (improved for astronomy): Galileo Galilei (1609) · Steam engine (improved): James Watt (1760s–70s)\n- Telephone: Alexander Graham Bell (1876) · Light bulb (practical): Thomas Edison (1879; others such as Joseph Swan worked on it too) · Radio: Guglielmo Marconi (1890s)\n- Airplane: the Wright brothers (1903) · Penicillin discovered: Alexander Fleming (1928) · Television: John Logie Baird and Philo Farnsworth (1920s)\n- World Wide Web: Tim Berners-Lee (1989–91) · Smartphone era: Apple iPhone (2007) · Theory of relativity: Albert Einstein (1905/1915) · Theory of evolution: Charles Darwin (1859)"
 },
 {
  "title": "Animals: fascinating facts",
  "topics": [
   "animal",
   "animals",
   "largest animal",
   "biggest animal",
   "fastest animal",
   "tallest animal",
   "whale",
   "cheetah",
   "elephant",
   "giraffe",
   "bird",
   "birds",
   "fish",
   "shark",
   "dog",
   "dogs",
   "cat",
   "cats",
   "mammal",
   "insect"
  ],
  "text": "## Animals: fascinating facts\n- **Largest animal ever:** the blue whale (up to about 30 m). **Largest land animal:** the African elephant. **Tallest:** the giraffe (up to about 5.5 m).\n- **Fastest land animal:** the cheetah (about 100–120 km/h in short bursts). **Fastest overall:** the peregrine falcon diving (over 300 km/h).\n- **Largest bird:** the ostrich (it can't fly). **Smallest bird:** the bee hummingbird.\n- **Longest-living vertebrate:** the Greenland shark (estimated 250+ years).\n- Octopuses have three hearts. Dogs have a sense of smell tens of thousands of times stronger than ours. Cats sleep 12–16 hours a day."
 },
 {
  "title": "Food safety and cooking basics",
  "topics": [
   "cook",
   "cooking",
   "cooked",
   "undercooked",
   "recipe",
   "food safety",
   "internal temperature",
   "chicken",
   "turkey",
   "beef",
   "pork",
   "steak",
   "fish",
   "salmon",
   "eggs",
   "egg",
   "boil an egg",
   "leftovers",
   "meat",
   "baking",
   "oven",
   "kitchen"
  ],
  "text": "## Food safety and cooking basics\n- **Safe internal temperatures** (USDA): poultry 74 °C / 165 °F · ground beef and pork 71 °C / 160 °F · whole cuts of beef, pork, lamb and veal 63 °C / 145 °F with a 3-minute rest · fish 63 °C / 145 °F · reheated leftovers 74 °C / 165 °F.\n- Refrigerate leftovers within 2 hours (1 hour if it's over 32 °C / 90 °F). Keep fridges at or below 4 °C / 40 °F.\n- **Eggs:** about 6–7 minutes in boiling water for jammy yolks, 9–12 minutes for hard-boiled.\n- **Oven conversions:** 180 °C = 350 °F · 200 °C = 400 °F · 220 °C = 425 °F."
 },
 {
  "title": "Technology terms explained",
  "topics": [
   "what is a",
   "cpu",
   "gpu",
   "ram",
   "storage",
   "ssd",
   "cloud",
   "wifi",
   "wi-fi",
   "5g",
   "router",
   "browser",
   "operating system",
   "software",
   "hardware",
   "ai model",
   "llm",
   "algorithm",
   "encryption",
   "url",
   "ip address"
  ],
  "text": "## Technology terms explained\n- **CPU**: the processor that runs programs. **GPU**: a processor for graphics and AI work. **RAM**: short-term working memory, cleared on restart. **SSD**: fast long-term storage.\n- **Operating system**: the software that runs a device (Windows, macOS, iOS, Android, Linux).\n- **Cloud**: storing or running things on internet servers instead of your own device.\n- **Wi-Fi** connects devices to a router without cables. **5G** is the latest widely used mobile network generation.\n- **IP address**: your device's network address on the internet. **URL**: a web address.\n- **LLM (large language model)**: an AI trained on lots of text to understand and write language. PortAI's models are LLMs.\n- **Encryption**: scrambling data so only someone with the right key can read it."
 },
 {
  "title": "Sports: major events",
  "topics": [
   "olympics",
   "olympic",
   "world cup",
   "fifa",
   "soccer",
   "football",
   "super bowl",
   "nba",
   "tennis",
   "wimbledon",
   "formula 1",
   "f1",
   "sports",
   "sport"
  ],
  "text": "## Sports: major events\n- **Summer Olympics:** Tokyo 2020 (held in 2021), Paris 2024, Los Angeles 2028, Brisbane 2032. **Winter Olympics:** Beijing 2022, Milan–Cortina 2026, French Alps 2030.\n- **FIFA World Cup:** 2018 Russia (won by France), 2022 Qatar (won by Argentina), 2026 hosted by the United States, Canada and Mexico (the first with 48 teams), 2030 Spain/Portugal/Morocco.\n- **Tennis Grand Slams:** Australian Open (January), French Open/Roland-Garros (May–June), Wimbledon (June–July), US Open (August–September).\n- For the latest scores and results, PortAI searches the web automatically."
 }
];
