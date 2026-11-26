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
  and explanations. Limits per person: 60 messages per minute, daily limit 500 messages.
- **Lite** (GLM-4.7 Flash): fast replies and strong support for 100+ languages. Limits per person: 60 messages per minute, daily limit 500 messages.
- **Mini** (IBM Granite 4.0 Micro): the smallest and lightest. Best for quick, simple
  questions. Limits per person: 60 messages per minute, daily limit 500 messages.
- **Coder** (Qwen 2.5 Coder 32B): best for programming, such as writing, explaining and
  fixing code. Limits per person: 15 messages per minute, daily limit 100 messages.
- **Pro** (gpt-oss-120b): the largest model, for harder questions and reasoning. Limits per person: 20 messages per minute, daily limit 150 messages.
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

<!-- LIBRARY BELOW: each "##" section has a topics line. Only the 1-3 sections that match a question are sent to the AI. Add as many sections as you like. -->

## Passwords and password managers
<!-- topics: password, passwords, password manager, passphrase, bitwarden, 1password, keepass, proton pass, reuse, hacked, breach, leaked -->
- Use a different password for every account. Reused passwords let one data breach unlock many accounts.
- Long passphrases (4–6 random words) are easier to remember and harder to crack than short complex passwords.
- A password manager creates, stores and fills strong unique passwords. Well-known options: Bitwarden (open source, free plan), Proton Pass, 1Password, KeePassXC (offline, open source), and the built-in managers in Apple devices, Google Chrome and Firefox.
- Protect the password manager itself with a strong master passphrase and two-factor authentication.
- Check whether your email appeared in a known breach at haveibeenpwned.com, and change passwords for any affected accounts.

## Two-factor authentication (2FA)
<!-- topics: 2fa, two-factor, two factor, mfa, multi-factor, authenticator, verification code, security key, yubikey, sms code, otp -->
- 2FA adds a second step after your password, so a stolen password alone isn't enough.
- From strongest to weakest: hardware security keys (e.g. YubiKey) and passkeys → authenticator apps (time-based codes, e.g. Aegis, Ente Auth, Google Authenticator, Microsoft Authenticator, 2FAS) → SMS codes (better than nothing, but vulnerable to SIM-swap attacks).
- Save the backup/recovery codes each service gives you somewhere safe (for example in your password manager).
- Turn on 2FA first for email, password manager, banking and cloud storage. Email matters most, because it can reset everything else.

## Passkeys
<!-- topics: passkey, passkeys, passwordless, face id login, fingerprint login, webauthn, fido -->
- A passkey replaces a password with a cryptographic key stored on your device or in your password manager, unlocked with Face ID, a fingerprint or your device PIN.
- Passkeys can't be phished or reused, because each one only works on the website it was created for.
- They sync through iCloud Keychain, Google Password Manager or password managers like Bitwarden, Proton Pass and 1Password.
- Many big services (Google, Apple, Microsoft, Amazon, PayPal, GitHub and others) support them. Look for "passkeys" in the account's security settings.

## Phishing and online scams
<!-- topics: phishing, scam, scams, scammer, fraud, suspicious email, suspicious text, fake website, smishing, gift card, tech support scam, impersonation, link safe -->
- Warning signs: urgency or threats ("your account will be closed"), requests for passwords, codes or payment, unexpected attachments, gift-card payment requests, slightly wrong sender addresses or website names, and offers that are too good to be true.
- Never share 2FA codes. Real companies don't ask for them.
- Don't click links in unexpected messages. Open the app or type the website address yourself instead.
- If someone calls claiming to be your bank, hang up and call the number on your card.
- If you clicked or shared something: change the affected password immediately, turn on 2FA, contact your bank if money is involved, and report it (for example to the company being impersonated, or the authorities' fraud reporting site in your country).

## Private browsing and browser privacy
<!-- topics: private browsing, incognito, browser privacy, cookies, tracking cookies, ublock, ad blocker, tracker blocker, fingerprinting, safari privacy, chrome privacy, firefox privacy -->
- Private/incognito mode only stops your device from saving history, cookies and form data after you close the window. Websites, your internet provider, your employer or school can still see what you do.
- Better privacy: use a browser with tracking protection (Firefox, Brave, Safari, DuckDuckGo browser), block third-party cookies, and add a content blocker such as uBlock Origin (where supported).
- Review site permissions (location, camera, microphone, notifications) in your browser's settings.
- Use a privacy-respecting search engine such as DuckDuckGo, Brave Search, Startpage or Mojeek.

## VPNs explained
<!-- topics: vpn, vpns, virtual private network, mullvad, proton vpn, ip address, hide ip, public wifi, geo-block -->
- A VPN encrypts your connection to the VPN server and hides your IP address from the sites you visit. Your internet provider can see that you use a VPN, but not which sites you visit.
- A VPN does **not** make you anonymous: websites can still identify you through logins, cookies and browser fingerprinting, and the VPN provider can see your traffic metadata.
- Choose a provider with an independently audited no-logs policy and a clear business model. Avoid free VPNs that make money from your data. Well-regarded options include Mullvad, Proton VPN (has a free plan) and IVPN.
- VPNs are most useful on public Wi-Fi, for hiding your browsing from your internet provider, and for avoiding IP-based tracking.

## iPhone and iPad privacy settings
<!-- topics: iphone, ipad, ios, ipados, apple privacy, app tracking, location services, safari, icloud, siri, lockdown mode, mail privacy protection -->
- **Settings → Privacy & Security → Tracking**: turn off "Allow Apps to Request to Track" so every app is told not to track you.
- **Location Services**: give each app "While Using" or "Never", and turn off "Precise Location" where it isn't needed.
- **Safety Check** (Privacy & Security) reviews who and what has access to your data and lets you reset it quickly.
- **Mail → Privacy Protection**: "Protect Mail Activity" hides your IP and blocks tracking pixels in emails.
- **Safari**: "Prevent Cross-Site Tracking" and "Hide IP Address" (Settings → Safari).
- **Lockdown Mode** is an extreme protection for people who may be personally targeted by sophisticated attacks.
- Keep iOS updated: updates fix security holes.

## Android privacy settings
<!-- topics: android, samsung, pixel, google account, permission manager, privacy dashboard, advertising id, ad id, google activity, location history -->
- **Settings → Security & privacy → Privacy** (names vary by phone): the **Privacy dashboard** shows which apps used location, camera and microphone recently, and the **Permission manager** lets you revoke access.
- **Delete the advertising ID** (Settings → Privacy → Ads, Android 12+) so apps can't use it to track you.
- Give location "Only while using the app" and turn off "Use precise location" where it isn't needed.
- In your Google Account (myaccount.google.com → Data & privacy) you can pause or auto-delete Web & App Activity, Location/Timeline and YouTube history.
- Install apps only from trusted stores and keep the phone updated.

## Encrypted messaging apps
<!-- topics: signal, whatsapp, telegram, imessage, messenger, encrypted messaging, end-to-end, chat app, private messaging, secure messaging -->
- **Signal**: end-to-end encrypted by default for messages, calls and groups, collects almost no metadata, run by a non-profit. Widely considered the most private mainstream option.
- **WhatsApp**: messages and calls are end-to-end encrypted by default (using the Signal Protocol), but it's owned by Meta and collects metadata (who you talk to, when, how often).
- **iMessage / FaceTime**: end-to-end encrypted between Apple devices. Messages to Android phones use SMS/RCS, which may not be.
- **Telegram**: regular chats and groups are *not* end-to-end encrypted. Only optional one-to-one "Secret Chats" are.
- **Facebook Messenger**: has rolled out end-to-end encryption for personal chats.

## Email privacy
<!-- topics: email privacy, private email, email alias, hide my email, simplelogin, addy, tracking pixel, newsletter tracking, spam, proton mail, tuta, gmail privacy -->
- Encrypted email providers: Proton Mail (Switzerland) and Tuta (Germany) encrypt stored mail so the provider can't read it.
- **Email aliases** hide your real address when signing up for sites: Apple's Hide My Email, Proton Pass/SimpleLogin, addy.io, Firefox Relay. If an alias starts getting spam, delete it.
- Many marketing emails contain tracking pixels that report when and where you opened them. Block remote images, or use Apple Mail Privacy Protection.
- Never trust the sender's name alone. Check the actual address before clicking anything.

## Data brokers and removing your information
<!-- topics: data broker, data brokers, people search, remove my info, opt out, personal information online, delete my data, gdpr, ccpa, right to be forgotten -->
- Data brokers collect and sell personal information (addresses, phone numbers, relatives, purchase habits).
- You can request removal from each broker's opt-out page, or use paid removal services that do it repeatedly.
- In the EU/UK, GDPR gives you the right to access and delete your data. In California, the CCPA/CPRA gives similar rights. Many companies honor such requests everywhere.
- Google offers "Results about you" to request removal of search results showing your contact details.

## Public Wi-Fi safety
<!-- topics: public wifi, public wi-fi, hotel wifi, airport wifi, cafe wifi, hotspot, free wifi -->
- Most websites use HTTPS, which encrypts what you send, so public Wi-Fi is much safer than it used to be.
- Still: avoid unknown networks with generic names (they may be fake hotspots), turn off auto-join, and don't install anything a captive portal asks for.
- For sensitive tasks, use your phone's mobile data/hotspot or a trusted VPN.

## Backups
<!-- topics: backup, backups, back up, 3-2-1, lost files, ransomware, icloud backup, google drive backup, external drive, restore -->
- The 3-2-1 rule: keep 3 copies of important data, on 2 different types of storage, with 1 copy off-site (for example in the cloud).
- Automatic backups are the ones that actually happen: iCloud/Google backups for phones, Time Machine (Mac), File History (Windows).
- Test restoring a file occasionally. A backup you can't restore isn't a backup.
- Offline or versioned backups protect against ransomware.

## Using AI assistants safely
<!-- topics: ai safety, using ai, chatbot safety, ai privacy, share with ai, hallucination, hallucinate, ai mistakes, ai accurate, can i trust ai, ai training data -->
- Don't share secrets with any AI service: passwords, full card numbers, government ID numbers or private details about other people.
- AI can be confidently wrong ("hallucinations"). Double-check facts, quotes, numbers, legal, medical and financial information with reliable sources.
- Check whether a service uses your chats for training. PortAI doesn't: its models run with zero data retention, and chat history stays encrypted on your device.
- AI is great for drafts, explanations, brainstorming, summaries and code, but you stay responsible for what you use.

## Getting better answers from PortAI
<!-- topics: prompt, prompting, better answers, how to ask, tips for portai, how to use portai, write a prompt, get better results -->
- Give context: who it's for, what you already know, and what you want ("Explain to a 12-year-old…", "I'm a beginner in Python…").
- Say the format: "in 5 bullet points", "as a table", "under 100 words", "as an email".
- Paste the text or a link you want summarized, translated or checked. PortAI reads links automatically.
- Ask follow-ups to refine: "shorter", "more formal", "give an example".
- Pick the right model: Coder for programming, Pro for hard reasoning, Lite for other languages, Regular for most things.

## Kids and family online safety
<!-- topics: kids, children, parental controls, family, screen time, child safety, teen, teenager, family link -->
- Built-in parental controls: Apple Screen Time and Family Sharing, Google Family Link, and console and streaming-service controls.
- Talk openly about not sharing personal details, about scams and strangers online, and that they can always come to you if something feels wrong.
- Keep devices in shared spaces for younger kids, and review app permissions and age ratings together.
