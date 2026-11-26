/* This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// GENERATED from MULTIPORT_KNOWLEDGE.md by scripts/build-knowledge.mjs. Do not edit by hand.
// Run `npm run knowledge` after changing the Markdown file.

// Always sent: about Multiport and its products.
export const MULTIPORT_KNOWLEDGE = "# About Multiport\n\nMultiport is an independent software company built and operated by a single developer,\nfocused on building simple, privacy-respecting tools with no ads, no trackers, and no\nrequired accounts.\n\n## Mission\n\"A better internet starts with personal freedom.\" Multiport exists to help people step\naway from Big Tech and take back control of their privacy, one small tool at a time.\n\n## By the numbers\n- 10+ products and tools\n- 1 person building them\n- 0 ads or trackers\n- 0 required accounts\n\n## Products\n- **Multiport Games** (games.multiportllc.com) — a collection of free browser games, no\n  downloads or installs required.\n- **Multiport Counter App** (counterapp.multiportllc.com) — a simple, elegant counter app\n  for everyday tallying (reps, laps, scores, anything you need to count).\n- **Multiport Support** (support.multiportllc.com) — direct support for any Multiport\n  product, straight from the developer, no ticket queues or chatbots.\n- **Multiport Lunchbox AI** (ai.lunchbox.multiportllc.com) — an AI-powered assistant for\n  answering questions and everyday tasks.\n- **Multiport Fonts** (fontfiles.multiportllc.com) — a library of custom-designed fonts,\n  free to browse and download.\n- **Everything Quiz** — a fast-paced quiz covering a bit of everything.\n- **PortAI** (portai.multiportllc.com) — live now. A free, privacy-first AI chatbot running\n  on open models: Gemma 4, GLM, IBM Granite, Qwen 2.5 Coder and gpt-oss (shown as Regular,\n  Lite, Mini, Coder and Pro), built right into the browser.\n  No ads, no tracking, and optional passphrase accounts with end-to-end encrypted chat sync.\n- **Hello New Tab – Custom NTP** — a browser extension that gives you a fresh new tab\n  every time. Live now on Firefox Add-ons (Gecko); Chrome/Edge/Brave (Chromium) is\n  coming soon on the Chrome Web Store.\n\n## PS Tools (passion-project side tools)\n- **Kings Island Coaster Finder** (kicf.ps.multiportllc.com)\n- **City Scraper Web** (csw.ps.multiportllc.com)\n- **Mac or Windows Quiz** (mow.ps.multiportllc.com)\n\n## Privacy & licensing\nMultiport does not sell, rent, or share personal information with third parties. The\nwebsite uses counter.dev, a privacy-focused analytics service that collects only\naggregated, non-identifying data and does not use cookies. Multiport's source code is\nlicensed under the Mozilla Public License 2.0 (MPL-2.0).\n\n## Links\n- Website: https://multiportllc.com\n- Support: support@multiportllc.com";

// Only sent when a question is about PortAI, Multiport, privacy or help.
export const MULTIPORT_KNOWLEDGE_DETAILS = "# PortAI user guide\n\n## What PortAI is\nPortAI (portai.multiportllc.com) is Multiport's free AI chatbot. It has no ads, no tracking\nand no required account. It runs on open-source AI models hosted by Cloudflare with zero\ndata retention, so prompts and replies are not stored by the model host or used for training.\nIt works in any modern browser on phones, tablets and computers. No app store download\nis needed.\n\n## Models (pick one with the model menu at the top)\n- **Regular** (Gemma 4 26B): the default. A good all-rounder for everyday questions, writing\n  and explanations. Limits per person: 60 messages per minute, daily limit 500 messages.\n- **Lite** (GLM-4.7 Flash): fast replies and strong support for 100+ languages. Limits per person: 60 messages per minute, daily limit 500 messages.\n- **Mini** (IBM Granite 4.0 Micro): the smallest and lightest. Best for quick, simple\n  questions. Limits per person: 60 messages per minute, daily limit 500 messages.\n- **Coder** (Qwen 2.5 Coder 32B): best for programming, such as writing, explaining and\n  fixing code. Limits per person: 15 messages per minute, daily limit 100 messages.\n- **Pro** (gpt-oss-120b): the largest model, for harder questions and reasoning. Limits per person: 20 messages per minute, daily limit 150 messages.\n- On top of the per-model limits, each person can send up to 60 messages per minute and\n  500 per day across all models.\n- If the chosen model is busy and hasn't started answering within about 5 seconds, PortAI\n  also asks a backup model and uses whichever answers first. The steps then show, for\n  example, \"Regular was busy, switched to Lite\".\n\n## Live steps\nWhile PortAI works it shows what it is doing, such as \"Connecting…\", \"Searching the web…\",\n\"Extracting page content…\", \"Thinking…\" and \"Writing…\". When the reply is finished, the\nsteps fold into a one-line summary like \"Thought for 0.8s · 120 words\". Tap it to see\neach step.\n\n## Web search (automatic)\n- When a question needs up-to-date information (news, recent releases, prices, newer\n  products or companies), PortAI searches the web by itself before answering. No button\n  press is needed.\n- Sources are shown as numbered links under the answer, matching the [1], [2] citations.\n- The 🌐 button in the top bar switches between **Auto** (default) and **Off**.\n- Only a short search query is sent to the search provider. Your IP address, cookies and\n  chat history are never sent. The free search uses Wikipedia.\n- Limit: 10 searches per minute and 50 per day per person. If the limit is reached, PortAI\n  still answers, just without searching.\n\n## Reading links you paste\n- Paste a link (up to 2 per message) and PortAI reads that page for you (\"Extracting page\n  content from …\"). No setting is needed.\n- PortAI's server fetches the page, so the website never sees your IP address or cookies.\n- Only public web pages are opened. Pages behind a login, private or local network\n  addresses, and very large files (over 1.5 MB) can't be read.\n\n## Chat history and Ghost mode\n- Chats are saved only in your browser, encrypted automatically (AES-256-GCM). They are\n  not stored on Multiport's servers unless you choose to sync them with an account.\n- **Ghost mode** (👻 button): chats in Ghost mode are never saved anywhere, not even\n  encrypted, and disappear when you leave them.\n- Rename or delete a chat with the ✎ and 🗑 buttons next to it in the sidebar.\n- **Settings & privacy** has: a creativity slider, light/dark theme, \"Export chats (JSON)\"\n  and \"Delete all chat history\".\n- Keyboard shortcut: Ctrl+Shift+O (Cmd+Shift+O on Mac) starts a new chat.\n\n## Accounts and sync (optional)\n- Tap **Sign in to sync chats** in the sidebar. There's no email, name or phone number.\n  Your passphrase *is* your account.\n- **Create account**: PortAI generates a strong passphrase like XXXX-XXXX-XXXX-XXXX-XXXX,\n  or you can choose your own (at least 12 characters). Save it somewhere safe.\n- **Sign in** on any device with the same passphrase to see your chats there. Generated\n  passphrases work in lowercase and with spaces instead of dashes.\n- Chats are end-to-end encrypted in your browser before they are uploaded. The server only\n  stores encrypted data and can't read your chats or learn your passphrase.\n- **There is no \"forgot passphrase\".** If it's lost, synced chats can't be recovered by\n  anyone, including Multiport.\n- \"Stay signed in on this device\" keeps you signed in. Turn it off on shared devices.\n- When you sign in, PortAI offers to move chats from that device into your account.\n- You can sign out, or permanently delete your account and all synced chats, from the\n  account screen.\n\n## Install PortAI like an app\n- **iPhone / iPad (Safari)**: open portai.multiportllc.com, tap Share, then\n  **Add to Home Screen**.\n- **Android (Chrome)**: open the site, tap the ⋮ menu, then **Install app** or\n  **Add to Home screen**.\n- **Computer (Chrome / Edge)**: click the install icon in the address bar.\n\n## What PortAI can't do (yet)\n- It can't create images, listen to voice, or read files you upload. Paste text or a link\n  instead.\n- It doesn't remember things between separate chats. Each chat starts fresh.\n- Like any AI, it can make mistakes. Check important information, especially medical,\n  legal or financial facts.\n\n## Messages you might see\n- **\"Rate limit hit. Please try again in N seconds\"**: too many messages too fast. Wait a\n  moment, or switch to another model.\n- **\"Daily limit for <model> reached\"**: that model's daily limit is used up. Try another\n  model, or come back after midnight UTC.\n- **\"Today's free AI allowance has been used up\"**: PortAI's shared free daily AI capacity\n  ran out. It resets at midnight UTC.\n- **\"The model is busy right now\"**: Cloudflare's servers are briefly overloaded. Try\n  again in a moment.\n- **\"Cloudflare security check needed\"**: refresh the page so Cloudflare can verify your\n  browser. VPNs make these checks more likely.\n- **\"You appear to be offline\"**: check your internet connection.\n- **\"No account found for this passphrase\"**: check it for typos. Passphrases are exact,\n  except that generated ones ignore case, spaces and dashes.\n- **Chats missing on another device**: they only appear there if you're signed in to the\n  same account on both devices. Ghost chats are never saved.\n- For anything else, contact Multiport Support at https://support.multiportllc.com or\n  support@multiportllc.com.\n\n## PortAI privacy, in detail\n- No ads, no analytics, no tracking scripts and no third-party code. A strict Content\n  Security Policy enforces this. PortAI itself sets no cookies; Cloudflare may set a\n  security cookie when it checks for bots.\n- PortAI's server doesn't log or store your messages. It relays them to the model and\n  streams the answer back.\n- For rate limits, IP addresses are only stored as scrambled, salted hashes that are\n  deleted after their one-minute or one-day window.\n- The Inter font and all code are served from PortAI itself, so no outside service sees\n  your visit.\n- PortAI is open source under the Mozilla Public License 2.0 (MPL-2.0).\n- Privacy Policy: https://multiportllc.com/privacy · Terms: https://multiportllc.com/terms\n\n# Privacy basics (general explanations)\n- **End-to-end encryption**: data is encrypted on your device and can only be decrypted\n  by you (or the person you send it to). The service in the middle can't read it.\n- **Zero-access encryption**: the provider stores your data encrypted with a key only you\n  have, so the provider itself can't read it.\n- **Zero data retention**: the service processes a request and doesn't keep it afterwards.\n- **Open-source models**: AI models whose weights are published, so anyone can run and\n  inspect them, unlike closed models such as ChatGPT's.\n- **Tracking**: collecting data about what you do online, often across websites, usually\n  for advertising. Signs of it include ad trackers, third-party cookies and fingerprinting\n  scripts.\n- Simple privacy habits: use a password manager, turn on two-factor authentication, keep\n  software updated, review app permissions, and prefer services that don't make money\n  from ads.\n\n# Other privacy-friendly services (general context)\nThese are well-known privacy-focused services people often compare. Details change, so\npoint people to the official sites for current features and pricing. Mention them fairly\nwhen someone asks for alternatives or comparisons.\n- **Proton** (Switzerland): Proton Mail (encrypted email), Proton VPN, Proton Drive,\n  Proton Pass and Proton Calendar. In July 2025 Proton launched **Lumo**, a privacy-first\n  AI assistant that stores chats with encryption and says it doesn't use user data to train\n  AI models.\n- **DuckDuckGo**: a search engine that doesn't track searches, plus a browser and Duck.ai,\n  which offers anonymous access to several AI chat models.\n- **Brave**: a browser that blocks ads and trackers by default, with Brave Search (its own\n  independent index) and an AI assistant called Leo.\n- **Signal**: end-to-end encrypted messaging and calls, run by a non-profit.\n- **Mullvad VPN**: a VPN that doesn't require an email address to sign up.\n- **Firefox** (Mozilla): an open-source browser with built-in tracking protection.\n- **Tor Browser**: routes traffic through several relays to hide your location and\n  activity.\n- How PortAI compares: PortAI is free with no account needed, runs on open-source models\n  with zero data retention, keeps chat history encrypted on your device (or end-to-end\n  encrypted sync with a passphrase-only account), searches the web automatically, and is\n  made by an independent one-person company, Multiport.";

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
 }
];
