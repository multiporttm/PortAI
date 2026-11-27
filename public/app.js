/* This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Vault } from './vault.js';
import * as Account from './account.js';
import { friendlyError } from './errors.js';
import { LiveSteps, renderTrace, mentionsMultiport } from './status.js';
import { renderMarkdown } from './markdown.js';

const $ = (sel) => document.querySelector(sel);
const vault = new Vault();

const state = {
  models: [],
  chats: [],          // decrypted, in memory only while unlocked
  current: null,      // active chat object
  streaming: null,    // AbortController
  settings: loadSettings(),
  store: vault,       // where chats are saved: the local vault or the signed-in account
  session: null,      // signed-in account keys (memory only unless 'stay signed in')
  accounts: false,    // server supports accounts (D1 configured)
  unsynced: new Set(),
};

// ---------------------------------------------------------------------------
// Settings (non-sensitive UI prefs only)
// ---------------------------------------------------------------------------

// Web search: 'auto' (default: PortAI searches when a question needs it) or 'off'.
function normalizeWebSearch(v) { return v === 'off' ? 'off' : 'auto'; }

function loadSettings() {
  try { return { theme: 'system', temperature: 0.7, model: null, ...JSON.parse(localStorage.getItem('portai.settings') || '{}'), webSearch: normalizeWebSearch(JSON.parse(localStorage.getItem('portai.settings') || '{}').webSearch) }; }
  catch { return { theme: 'system', temperature: 0.7, model: null }; }
}
function saveSettings() {
  try { localStorage.setItem('portai.settings', JSON.stringify(state.settings)); } catch { /* ignore */ }
}
function applyTheme() {
  const t = state.settings.theme;
  if (t === 'system') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
}

// ---------------------------------------------------------------------------
// Vault flow
// ---------------------------------------------------------------------------

async function boot() {
  applyTheme();
  await loadConfig();
  const status = await vault.status();
  // Default: open straight into the chat. History is encrypted with a device key automatically.
  if (status === 'new') await vault.setupDevice();
  if (status !== 'passphrase') {
    await vault.unlock();
    return enterApp();
  }
  // Only users who opted into a passphrase see the unlock screen.
  $('#vault').hidden = false;
  $('#unlock-pass').focus();
}

$('#unlock-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.submitter;
  busy(btn, 'Unlocking…');
  const ok = await vault.unlock($('#unlock-pass').value);
  busy(btn, null);
  if (!ok) { $('#unlock-error').textContent = 'Wrong passphrase.'; $('#unlock-pass').select(); return; }
  $('#unlock-pass').value = '';
  $('#unlock-error').textContent = '';
  enterApp();
});

$('#unlock-reset').addEventListener('click', eraseEverything);

function busy(btn, label) {
  if (!btn) return;
  if (label) { btn.dataset.label = btn.textContent; btn.textContent = label; btn.disabled = true; }
  else { btn.textContent = btn.dataset.label || btn.textContent; btn.disabled = false; }
}

async function enterApp() {
  if (state.accounts) {
    const saved = await vault.getSession();
    if (saved) {
      try {
        await Account.login(saved);
        state.session = saved;
        state.store = new Account.AccountStore(saved);
      } catch (e) {
        if (e.status === 404 || e.status === 401) await vault.clearSession(); // account deleted elsewhere
        else toast(`Couldn't reach your account (${e.message}). Showing chats on this device.`);
      }
    }
  }
  try {
    state.chats = await state.store.loadChats();
  } catch (e) {
    toast(`Couldn't load your chats: ${e.message}`);
    state.chats = [];
  }
  updateAccountUi();
  $('#vault').hidden = true;
  $('#app').hidden = false;
  renderChatList();
  newChat();
}

function lockApp() {
  stopStreaming();
  vault.lock();
  state.chats = [];
  state.current = null;
  $('#messages').querySelectorAll('.msg').forEach((n) => n.remove());
  location.reload();
}

async function eraseEverything() {
  if (!confirm('Delete all PortAI chat history from this device? This cannot be undone.')) return;
  await vault.eraseAll();
  location.reload();
}

// ---------------------------------------------------------------------------
// Models
// ---------------------------------------------------------------------------

async function loadConfig() {
  try {
    const res = await fetch('/api/config', { credentials: 'same-origin' });
    const cfg = await res.json();
    state.models = cfg.models || [];
    state.accounts = !!cfg.accounts;
    state.searchAvailable = !!cfg.search;
    state.version ||= cfg.version;
  } catch {
    state.models = [];
  }
  const sel = $('#model-select');
  sel.replaceChildren(...state.models.map((m) => new Option(m.label, m.id)));
  if (state.settings.model && state.models.some((m) => m.id === state.settings.model)) sel.value = state.settings.model;
  renderModelMenu();
  syncWebToggle();
}

function syncWebToggle() {
  const btn = $('#web-toggle');
  btn.hidden = !state.searchAvailable;
  const on = state.settings.webSearch !== 'off';
  btn.setAttribute('aria-pressed', String(on));
  btn.textContent = '🌐 Web search';
  btn.title = on
    ? 'Web search: Auto. PortAI searches the web when a question needs up-to-date info. Only the search query is sent. Tap to turn off.'
    : 'Web search: Off. PortAI only uses what its models know. Tap to turn on.';
}
$('#web-toggle').addEventListener('click', () => {
  state.settings.webSearch = state.settings.webSearch === 'off' ? 'auto' : 'off';
  saveSettings();
  syncWebToggle();
});

// ---------------------------------------------------------------------------
// Model picker: alias in bold, real model name underneath (a native <select>
// can only show one line, so it stays hidden and holds the value).
// ---------------------------------------------------------------------------

function modelSubtitle(m) {
  return [m.base, m.perDay ? `${m.perDay}/day` : ''].filter(Boolean).join(' · ');
}

function syncModelButton() {
  const m = state.models.find((x) => x.id === $('#model-select').value) || state.models[0];
  if (!m) return;
  $('#model-button .mp-label').textContent = m.label;
  $('#model-button .mp-base').textContent = m.base || '';
  $('#model-button').setAttribute('aria-label', `Model: ${m.label} (${m.base || m.id})`);
  document.querySelectorAll('#model-menu [role=option]').forEach((li) => li.setAttribute('aria-selected', String(li.dataset.id === m.id)));
}

function renderModelMenu() {
  const menu = $('#model-menu');
  menu.replaceChildren(...state.models.map((m) => {
    const li = document.createElement('li');
    li.setAttribute('role', 'option');
    li.dataset.id = m.id;
    li.tabIndex = -1;
    const name = document.createElement('span');
    name.className = 'mo-label';
    name.textContent = m.label;
    const sub = document.createElement('span');
    sub.className = 'mo-base';
    sub.textContent = modelSubtitle(m);
    const check = document.createElement('span');
    check.className = 'mo-check';
    check.textContent = '✓';
    li.append(name, sub, check);
    li.addEventListener('click', () => chooseModel(m.id));
    return li;
  }));
  syncModelButton();
}

function chooseModel(id) {
  const sel = $('#model-select');
  sel.value = id;
  sel.dispatchEvent(new Event('change'));
  syncModelButton();
  closeModelMenu(true);
}

function openModelMenu() {
  $('#model-menu').hidden = false;
  $('#model-button').setAttribute('aria-expanded', 'true');
  (document.querySelector('#model-menu [aria-selected=true]') || document.querySelector('#model-menu [role=option]'))?.focus();
}

function closeModelMenu(focusButton) {
  if ($('#model-menu').hidden) return;
  $('#model-menu').hidden = true;
  $('#model-button').setAttribute('aria-expanded', 'false');
  if (focusButton) $('#model-button').focus();
}

$('#model-button').addEventListener('click', () => ($('#model-menu').hidden ? openModelMenu() : closeModelMenu()));
$('#model-menu').addEventListener('keydown', (e) => {
  const items = [...document.querySelectorAll('#model-menu [role=option]')];
  const i = items.indexOf(document.activeElement);
  if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
  else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (items[i]) chooseModel(items[i].dataset.id); }
  else if (e.key === 'Escape') { e.preventDefault(); closeModelMenu(true); }
  else if (e.key === 'Tab') closeModelMenu();
});
document.addEventListener('click', (e) => { if (!e.target.closest('.model-picker')) closeModelMenu(); });

$('#model-select').addEventListener('change', (e) => {
  state.settings.model = e.target.value;
  saveSettings();
  if (state.current) state.current.model = e.target.value;
});

// ---------------------------------------------------------------------------
// Chats
// ---------------------------------------------------------------------------

function uid() {
  return [...crypto.getRandomValues(new Uint8Array(12))].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function newChat() {
  stopStreaming();
  state.current = {
    id: uid(),
    title: 'New chat',
    model: $('#model-select').value || state.models[0]?.id,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ghost: $('#ghost-toggle').checked,
  };
  renderMessages();
  renderChatList();
  closeSidebar();
  $('#input').focus();
}

function openChat(id) {
  const chat = state.chats.find((c) => c.id === id);
  if (!chat) return;
  stopStreaming();
  state.current = chat;
  $('#ghost-toggle').checked = false;
  updateGhostBanner();
  if (chat.model && state.models.some((m) => m.id === chat.model)) { $('#model-select').value = chat.model; syncModelButton(); }
  renderMessages();
  renderChatList();
  closeSidebar();
}

async function persist(chat) {
  if (chat.ghost) return;
  chat.updatedAt = Date.now();
  if (!state.chats.includes(chat)) state.chats.unshift(chat);
  state.chats.sort((a, b) => b.updatedAt - a.updatedAt);
  renderChatList();
  await saveToStore(chat);
}

async function saveToStore(chat) {
  try {
    await state.store.saveChat(stripGhost(chat));
    state.unsynced.delete(chat.id);
  } catch (e) {
    if (state.store === vault) throw e;
    state.unsynced.add(chat.id);
  }
  updateSyncStatus();
}

async function retryUnsynced() {
  if (state.store === vault || !state.unsynced.size) return;
  for (const id of [...state.unsynced]) {
    const chat = state.chats.find((c) => c.id === id);
    if (!chat) { state.unsynced.delete(id); continue; }
    await saveToStore(chat);
    if (state.unsynced.has(id)) break; // still failing: stop for now
  }
}
window.addEventListener('online', retryUnsynced);
setInterval(retryUnsynced, 30000);

function stripGhost(chat) {
  const { ghost, ...rest } = chat;
  return rest;
}

async function deleteChat(id) {
  if (!confirm('Delete this conversation?')) return;
  try { await state.store.deleteChat(id); } catch (e) { toast(`Couldn't delete: ${e.message}`); return; }
  state.unsynced.delete(id);
  state.chats = state.chats.filter((c) => c.id !== id);
  if (state.current?.id === id) newChat();
  else renderChatList();
}

async function renameChat(id) {
  const chat = state.chats.find((c) => c.id === id);
  if (!chat) return;
  const title = prompt('Rename conversation', chat.title);
  if (title && title.trim()) { chat.title = title.trim().slice(0, 120); await persist(chat); }
}

function groupLabel(ts) {
  const d = new Date(ts);
  const now = new Date();
  const day = 86400000;
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (ts >= startToday) return 'Today';
  if (ts >= startToday - day) return 'Yesterday';
  if (ts >= startToday - 7 * day) return 'Previous 7 days';
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function renderChatList() {
  const nav = $('#chat-list');
  nav.replaceChildren();
  if (!state.chats.length) {
    const p = document.createElement('p');
    p.className = 'empty-list';
    p.textContent = 'No saved chats yet.';
    nav.append(p);
    return;
  }
  let lastGroup = null;
  for (const chat of state.chats) {
    const g = groupLabel(chat.updatedAt);
    if (g !== lastGroup) {
      const h = document.createElement('div');
      h.className = 'group-label';
      h.textContent = g;
      nav.append(h);
      lastGroup = g;
    }
    const row = document.createElement('div');
    row.className = 'chat-item' + (state.current?.id === chat.id ? ' active' : '');
    const btn = document.createElement('button');
    btn.className = 'chat-title';
    btn.textContent = chat.title;
    btn.title = chat.title;
    btn.addEventListener('click', () => openChat(chat.id));
    const ren = document.createElement('button');
    ren.className = 'icon-btn small';
    ren.setAttribute('aria-label', 'Rename');
    ren.textContent = '✎';
    ren.addEventListener('click', () => renameChat(chat.id));
    const del = document.createElement('button');
    del.className = 'icon-btn small';
    del.setAttribute('aria-label', 'Delete');
    del.textContent = '🗑';
    del.addEventListener('click', () => deleteChat(chat.id));
    row.append(btn, ren, del);
    nav.append(row);
  }
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

function renderMessages() {
  const box = $('#messages');
  box.querySelectorAll('.msg').forEach((n) => n.remove());
  const msgs = state.current?.messages || [];
  $('#welcome').hidden = msgs.length > 0;
  for (const m of msgs) box.append(messageNode(m));
  scrollToBottom(true);
}

function messageNode(m) {
  const wrap = document.createElement('div');
  wrap.className = `msg ${m.role}`;
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  if (m.role === 'assistant') {
    bubble.innerHTML = renderMarkdown(m.sources?.length ? stripCitations(m.content) : m.content); // renderer escapes all input
    if (m.error) bubble.classList.add('error-bubble');
  } else {
    bubble.textContent = m.content;
    if (!m.content) bubble.hidden = true;
  }
  if (m.role === 'assistant' && m.trace) {
    const summary = renderTrace(m.trace);
    if (summary) wrap.append(summary);
  }
  if (m.images?.length) wrap.append(imagesNode(m.images, m.role === 'assistant'));
  if (m.photos?.length) wrap.append(photosNode(m.photos));
  wrap.append(bubble);
  if (m.role === 'assistant' && m.sources?.length) wrap.append(sourcesNode(m.sources));
  if (m.role === 'assistant' && !m.pending) {
    const actions = document.createElement('div');
    actions.className = 'msg-actions';
    const copy = document.createElement('button');
    copy.className = 'icon-btn small';
    copy.textContent = '⧉ Copy';
    copy.addEventListener('click', () => copyText(m.content, copy));
    actions.append(copy);
    wrap.append(actions);
  }
  return wrap;
}

// ---------------------------------------------------------------------------
// Images: attach (vision) and AI-generated pictures
// ---------------------------------------------------------------------------

const MAX_ATTACH = 4;
const isImageData = (src) => /^data:image\/(jpeg|png|webp|gif);base64,/.test(src);

function imagesNode(images, generated) {
  const box = document.createElement('div');
  box.className = `msg-images${generated ? ' generated' : ''}`;
  for (const src of images) {
    if (!isImageData(src)) continue;
    const fig = document.createElement('figure');
    const img = document.createElement('img');
    img.src = src;
    img.alt = generated ? 'Image created by Neon Apple' : 'Attached image';
    img.loading = 'lazy';
    img.addEventListener('click', () => openLightbox(src));
    fig.append(img);
    if (generated) {
      const save = document.createElement('button');
      save.type = 'button';
      save.className = 'icon-btn small img-download';
      save.textContent = '⤓ Save image';
      save.addEventListener('click', () => saveImage(src));
      fig.append(save);
    }
    box.append(fig);
  }
  return box;
}

/** Turn a data URI into a File (no fetch(), so the strict CSP stays as it is). */
function dataUriToFile(src, name) {
  const [head, b64] = src.split(',');
  const type = head.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return new File([bytes], name, { type });
}

/**
 * Save a created image. On iPhone/iPad (and other phones) this opens the share sheet,
 * which has "Save Image" (Photos) and "Save to Files"; on computers it downloads a .jpg.
 * (A plain download link opens a blank page in iOS Home Screen apps.)
 */
async function saveImage(src) {
  const file = dataUriToFile(src, `neon-apple-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.jpg`);
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file] }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Real photos found on the web, with a small caption (title · creator · license). */
function photosNode(photos) {
  const box = document.createElement('div');
  box.className = 'msg-images photos';
  for (const p of photos) {
    if (!isImageData(p.src)) continue;
    const fig = document.createElement('figure');
    const img = document.createElement('img');
    img.src = p.src;
    img.alt = p.title || 'Photo from the web';
    img.loading = 'lazy';
    img.addEventListener('click', () => openLightbox(p.src));
    const cap = document.createElement('figcaption');
    cap.textContent = [p.title, p.credit].filter(Boolean).join(' · ');
    cap.title = cap.textContent;
    fig.append(img, cap);
    box.append(fig);
  }
  return box;
}

function openLightbox(src) {
  const dlg = document.createElement('dialog');
  dlg.className = 'lightbox';
  const img = document.createElement('img');
  img.src = src;
  img.alt = '';
  dlg.append(img);
  dlg.addEventListener('click', () => dlg.close());
  dlg.addEventListener('close', () => dlg.remove());
  document.body.append(dlg);
  dlg.showModal();
}

/** Load an image (File or data URI), shrink it (max side `max` px) and return a JPEG data URI. */
async function shrinkImage(source, max, quality) {
  // Decode via createImageBitmap from a File: reliable on iPhone/iPad, where drawing a
  // freshly loaded data-URI <img> onto a canvas can produce a blank (white) picture.
  const file = typeof source === 'string' ? dataUriToFile(source, 'image') : source;
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() => createImageBitmap(file));
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; // transparent PNGs get a white background
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  if (looksBlank(ctx, canvas.width, canvas.height)) throw new Error('blank');
  return canvas.toDataURL('image/jpeg', quality);
}

/** True if every sampled pixel is pure white (the drawing failed). */
function looksBlank(ctx, w, h) {
  try {
    const { data } = ctx.getImageData(0, 0, w, h);
    const step = Math.max(4, Math.floor(data.length / 4 / 400)) * 4; // ~400 samples
    for (let i = 0; i < data.length; i += step) if (data[i] < 250 || data[i + 1] < 250 || data[i + 2] < 250) return false;
    return true;
  } catch { return false; }
}

state.attachments = []; // [{ full, thumb }]

async function addImageFiles(files) {
  const images = [...files].filter((f) => f.type.startsWith('image/'));
  if (!images.length) return;
  if (state.attachments.length + images.length > MAX_ATTACH) toast(`You can attach up to ${MAX_ATTACH} images per message.`);
  for (const file of images.slice(0, MAX_ATTACH - state.attachments.length)) {
    if (file.size > 25 * 1024 * 1024) { toast('That image is too large (max 25 MB).'); continue; }
    try {
      // Full size for the AI to read (sharp enough for text in screenshots), small copy for your chat history.
      let full;
      try { full = await shrinkImage(file, 1600, 0.85); } catch (e) {
        // Couldn't resize (or a plain white picture): send the original if it's small enough.
        if (file.size > 1.5 * 1024 * 1024 || !/^image\/(jpeg|png|webp|gif)$/.test(file.type)) throw e;
        full = await new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(file); });
      }
      const thumb = await shrinkImage(full, 640, 0.75).catch(() => full);
      state.attachments.push({ full, thumb });
    } catch {
      toast("Couldn't read that image. Try a JPEG or PNG.");
    }
  }
  renderAttachments();
}

function renderAttachments() {
  const box = $('#attachments');
  box.replaceChildren();
  box.hidden = !state.attachments.length;
  state.attachments.forEach((att, i) => {
    const item = document.createElement('div');
    item.className = 'attachment';
    const img = document.createElement('img');
    img.src = att.thumb;
    img.alt = `Attached image ${i + 1}`;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'attachment-remove';
    remove.setAttribute('aria-label', 'Remove image');
    remove.textContent = '×';
    remove.addEventListener('click', () => { state.attachments.splice(i, 1); renderAttachments(); });
    item.append(img, remove);
    box.append(item);
  });
}

// Remove citation markers like [1], [1, 2] or [1][2] (sources are shown as links instead).
function stripCitations(text) {
  // Leave code untouched: split out ``` blocks and `inline code`, strip only the prose parts.
  return text.split(/(```[\s\S]*?(?:```|$)|`[^`\n]*`)/g)
    .map((part, i) => (i % 2 ? part : part.replace(/ ?(\[\d{1,2}(?:\s*[,–-]\s*\d{1,2})*\])+(?![(\w])/g, '')))
    .join('');
}

function sourcesNode(sources) {
  const box = document.createElement('div');
  box.className = 'sources';
  const label = document.createElement('span');
  label.className = 'sources-label';
  label.textContent = 'Sources';
  box.append(label);
  sources.forEach((src, i) => {
    let host = '';
    try { host = new URL(src.url).hostname.replace(/^www\./, ''); } catch { return; }
    if (!/^https?:/.test(src.url)) return;
    const a = document.createElement('a');
    a.className = 'source';
    a.href = src.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer nofollow';
    a.title = src.title;
    const t = document.createElement('span');
    t.className = 'source-title';
    t.textContent = src.title;
    const h = document.createElement('span');
    h.className = 'source-host';
    h.textContent = host;
    a.append(t, h);
    box.append(a);
  });
  return box;
}

function copyText(text, btn) {
  navigator.clipboard?.writeText(text).then(() => {
    const old = btn.textContent;
    btn.textContent = '✓ Copied';
    setTimeout(() => { btn.textContent = old; }, 1200);
  });
}

$('#messages').addEventListener('click', (e) => {
  const btn = e.target.closest('.copy-code');
  if (btn) copyText(btn.closest('.code-block').querySelector('code').textContent, btn);
});

// Follow the reply while it streams, but stop as soon as the user scrolls up to
// read, and resume when they scroll back to the bottom. Scrolling is instant
// (smooth-scroll animations restarted many times a second make it stutter).
const scrollState = { follow: true, programmatic: false };

function distanceFromBottom(box) { return box.scrollHeight - box.scrollTop - box.clientHeight; }

function scrollToBottom(force) {
  const box = $('#messages');
  if (force) scrollState.follow = true;
  if (!scrollState.follow) { updateJumpButton(); return; }
  if (distanceFromBottom(box) > 1) {
    scrollState.programmatic = true;
    box.scrollTop = box.scrollHeight;
  }
  updateJumpButton();
}

function updateJumpButton() {
  const btn = $('#jump-latest');
  if (btn) btn.hidden = scrollState.follow || distanceFromBottom($('#messages')) < 80;
}

(() => {
  const box = $('#messages');
  box.addEventListener('scroll', () => {
    if (scrollState.programmatic) { scrollState.programmatic = false; return; }
    scrollState.follow = distanceFromBottom(box) < 80;
    updateJumpButton();
  }, { passive: true });
  // Any upward gesture stops following immediately (before the scroll event lands).
  box.addEventListener('wheel', (e) => { if (e.deltaY < 0) { scrollState.follow = false; updateJumpButton(); } }, { passive: true });
  let touchY = 0;
  box.addEventListener('touchstart', (e) => { touchY = e.touches[0].clientY; }, { passive: true });
  box.addEventListener('touchmove', (e) => { if (e.touches[0].clientY > touchY + 4) { scrollState.follow = false; updateJumpButton(); } }, { passive: true });
  const btn = document.createElement('button');
  btn.id = 'jump-latest';
  btn.type = 'button';
  btn.className = 'jump-latest';
  btn.hidden = true;
  btn.textContent = '↓ Latest';
  btn.setAttribute('aria-label', 'Jump to the latest message');
  btn.addEventListener('click', () => scrollToBottom(true));
  document.querySelector('.composer').before(btn);
})();

// ---------------------------------------------------------------------------
// Sending & streaming
// ---------------------------------------------------------------------------

async function send(text, attachments = []) {
  const chat = state.current;
  if ((!text.trim() && !attachments.length) || state.streaming) return;
  chat.model = $('#model-select').value || chat.model;
  const userMsg = { role: 'user', content: text };
  if (attachments.length) userMsg.images = attachments.map((a) => a.thumb);
  chat.messages.push(userMsg);
  if (chat.messages.length === 1) chat.title = (text.trim() ? text : '🖼️ Image').replace(/\s+/g, ' ').slice(0, 60);
  $('#welcome').hidden = true;
  $('#messages').append(messageNode(userMsg));
  await persist(chat);

  const reply = { role: 'assistant', content: '', pending: true };
  const node = messageNode(reply);
  node.classList.add('streaming');
  const bubble = node.querySelector('.bubble');
  bubble.hidden = true; // shown when the first word arrives
  const stepsHost = document.createElement('div');
  node.prepend(stepsHost);
  const modelLabel = state.models.find((m) => m.id === chat.model)?.label || 'PortAI';
  const live = new LiveSteps(stepsHost, { model: modelLabel });
  live.start('connecting', `Connecting to ${modelLabel}`, `Connected to ${modelLabel}`);
  let outcome = 'done';
  $('#messages').append(node);
  scrollToBottom(true);

  const controller = new AbortController();
  state.streaming = controller;
  setStreamingUi(true);

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: chat.model,
        temperature: state.settings.temperature,
        search: state.searchAvailable && state.settings.webSearch !== 'off' ? 'auto' : false,
        messages: chat.messages.filter((m) => !m.error).map((m) => {
          // Only the new message's images are sent (full size); older ones are just mentioned.
          if (m === userMsg && attachments.length) return { role: m.role, content: m.content, images: attachments.map((a) => a.full) };
          const note = m.images?.length && m.role === 'user' ? `\n\n[The user attached ${m.images.length === 1 ? 'an image' : `${m.images.length} images`} here.]` : '';
          return { role: m.role, content: (m.content + note).trim() || '(image)' };
        }),
      }),
      signal: controller.signal,
    });

    if (!res.ok || !res.body) {
      let info = {};
      try { info = await res.clone().json(); } catch { /* Cloudflare block pages are HTML */ }
      throw Object.assign(new Error(friendlyError({ status: res.status, message: info.error || '', retryAfter: res.headers.get('Retry-After'), model: info.model, limit: info.limit })), { friendly: true });
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    let frame = 0;
    let lastRender = 0;
    let renderedText = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf('\n\n')) >= 0) {
        const event = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        const data = event.replace(/^data:\s?/, '');
        if (data === '[DONE]') continue;
        let msg;
        try { msg = JSON.parse(data); } catch { continue; }
        if (msg.error) throw Object.assign(new Error(friendlyError({ message: msg.error })), { friendly: true });
        if (msg.status === 'reading') {
          live.start('reading', `Extracting page content from ${msg.host}`, `Read ${msg.host}`);
        }
        if (msg.status === 'read') {
          reply.sources = [...(reply.sources || []), { title: msg.title || msg.host, url: msg.url }];
        }
        if (msg.status === 'read_failed') {
          live.relabel(`Couldn't read ${msg.host}`);
        }
        if (msg.status === 'read_skipped') live.note('reading', `Link not read · ${msg.reason}`);
        if (msg.status === 'searching') {
          live.start('searching', `Searching the web for “${msg.query.length > 60 ? msg.query.slice(0, 57) + '…' : msg.query}”`, 'Searched the web');
        }
        if (msg.status === 'searched') {
          reply.sources = [...(reply.sources || []), ...msg.sources];
          if (msg.provider !== 'photos') live.relabel(`Searched the web · ${msg.sources.length} source${msg.sources.length === 1 ? '' : 's'}`);
        }
        if (msg.status === 'search_skipped') {
          if (live.phase === 'searching') live.relabel(`Web search skipped · ${msg.reason}`);
          else live.note('search', `Web search skipped · ${msg.reason}`);
        }
        if (msg.status === 'vision') {
          live.start('viewing', `Looking at your image${msg.count > 1 ? 's' : ''} with ${msg.model}`, `Looked at ${msg.count > 1 ? `${msg.count} images` : 'your image'}`);
        }
        if (msg.status === 'photo_searching') {
          live.start('photos', `Searching the web for pictures of “${msg.query.length > 50 ? msg.query.slice(0, 47) + '…' : msg.query}”`, 'Found pictures on the web');
        }
        if (msg.status === 'photo_none') live.relabel('No pictures found');
        if (Array.isArray(msg.photos)) {
          reply.photos = msg.photos.filter((p) => isImageData(p.src));
          node.querySelector('.msg-images.photos')?.remove();
          node.insertBefore(photosNode(reply.photos), bubble);
          scrollToBottom();
        }
        if (msg.status === 'drawing') {
          live.start('drawing', '🍎 Neon Apple is creating your image', 'Created with 🍎 Neon Apple');
        }
        if (msg.image && isImageData(msg.image)) {
          reply.images = [...(reply.images || []), msg.image];
          node.querySelector('.msg-images')?.remove();
          node.insertBefore(imagesNode(reply.images, true), bubble);
          scrollToBottom();
        }
        if (msg.status === 'thinking' && ['connecting', 'searching', 'reading', 'viewing'].includes(live.phase)) {
          live.start('thinking', 'Thinking', 'Thought');
          if (mentionsMultiport(text)) live.note('knowledge', 'Checked Multiport knowledge');
        }
        if (msg.status === 'switched') {
          live.note('switch', `${msg.from} was ${msg.reason === 'busy' ? 'busy' : 'unavailable'}, switched to ${msg.to}`);
        }
        if (msg.delta) {
          if (live.phase !== 'writing') { live.start('writing', 'Writing', 'Wrote reply'); bubble.hidden = false; }
          reply.content += msg.delta;
        }
      }
      // Re-render at most ~12 times a second (rendering every frame is heavy on long answers).
      if (!frame && reply.content !== renderedText) {
        const wait = Math.max(0, 80 - (performance.now() - lastRender));
        frame = setTimeout(() => requestAnimationFrame(() => {
          frame = 0;
          lastRender = performance.now();
          renderedText = reply.content;
          bubble.innerHTML = renderMarkdown(reply.sources?.length ? stripCitations(reply.content) : reply.content);
          scrollToBottom();
        }), wait);
      }
    }
    if (!reply.content) reply.content = '_(The model returned an empty response.)_';
  } catch (err) {
    if (err.name === 'AbortError') {
      outcome = 'stopped';
      if (!reply.content) reply.content = '_(Stopped.)_';
    } else {
      outcome = 'error';
      reply.error = !reply.content;
      reply.content = (reply.content ? reply.content + '\n\n' : '') + `⚠️ ${err.friendly ? err.message : friendlyError({ status: err instanceof TypeError ? 0 : undefined, message: err.message })}`;
    }
  } finally {
    // Keep a smaller copy of created images in the (encrypted) chat history.
    if (reply.images?.length) reply.images = await Promise.all(reply.images.map((src) => shrinkImage(src, 640, 0.8).catch(() => src)));
    if (reply.photos?.length) reply.photos = await Promise.all(reply.photos.map(async (p) => ({ ...p, src: await shrinkImage(p.src, 480, 0.78).catch(() => p.src) })));
    delete reply.pending;
    reply.trace = live.finish(reply.content, outcome);
    state.streaming = null;
    setStreamingUi(false);
    // Only keep the reply if this chat is still active (user may have switched).
    chat.messages.push(reply);
    if (state.current === chat) node.replaceWith(messageNode(reply));
    await persist(chat);
    scrollToBottom();
  }
}

function stopStreaming() {
  state.streaming?.abort();
}

function setStreamingUi(on) {
  $('#send').hidden = on;
  $('#stop').hidden = !on;
}

// ---------------------------------------------------------------------------
// Composer
// ---------------------------------------------------------------------------

const input = $('#input');
function autosize() {
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 220) + 'px';
}
input.addEventListener('input', autosize);
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    $('#composer').requestSubmit();
  }
});
$('#composer').addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value;
  if ((!text.trim() && !state.attachments.length) || state.streaming) return;
  const attachments = state.attachments;
  state.attachments = [];
  renderAttachments();
  input.value = '';
  autosize();
  send(text, attachments);
});
$('#attach').addEventListener('click', () => $('#file-input').click());
$('#file-input').addEventListener('change', (e) => { addImageFiles(e.target.files); e.target.value = ''; });
// Paste a screenshot straight into the message box, or drop image files on it.
input.addEventListener('paste', (e) => {
  const files = [...(e.clipboardData?.files || [])].filter((f) => f.type.startsWith('image/'));
  if (files.length) { e.preventDefault(); addImageFiles(files); }
});
$('#composer').addEventListener('dragover', (e) => { if ([...e.dataTransfer.types].includes('Files')) { e.preventDefault(); $('#composer').classList.add('dragging'); } });
$('#composer').addEventListener('dragleave', () => $('#composer').classList.remove('dragging'));
$('#composer').addEventListener('drop', (e) => {
  $('#composer').classList.remove('dragging');
  if (e.dataTransfer.files?.length) { e.preventDefault(); addImageFiles(e.dataTransfer.files); }
});
$('#stop').addEventListener('click', stopStreaming);
document.querySelectorAll('.suggestion').forEach((b) => b.addEventListener('click', () => send(b.textContent.replace(/^\P{L}+/u, '').trim())));

// ---------------------------------------------------------------------------
// Ghost mode
// ---------------------------------------------------------------------------

function updateGhostBanner() {
  $('#ghost-banner').hidden = !$('#ghost-toggle').checked;
  document.body.classList.toggle('ghost', $('#ghost-toggle').checked);
}
$('#ghost-toggle').addEventListener('change', () => {
  updateGhostBanner();
  newChat();
});

// ---------------------------------------------------------------------------
// Sidebar (mobile)
// ---------------------------------------------------------------------------

function openSidebar() { $('#sidebar').classList.add('open'); $('#scrim').hidden = false; }
function closeSidebar() { $('#sidebar').classList.remove('open'); $('#scrim').hidden = true; }
$('#open-sidebar').addEventListener('click', openSidebar);

// Resizing / rotating: no slide animations mid-resize, and never leave the
// mobile sidebar or its dark overlay stuck when switching layouts.
let resizeTimer;
window.addEventListener('resize', () => {
  document.body.classList.add('resizing');
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => document.body.classList.remove('resizing'), 200);
}, { passive: true });
matchMedia('(max-width: 760px)').addEventListener('change', closeSidebar);
$('#close-sidebar').addEventListener('click', closeSidebar);
$('#scrim').addEventListener('click', closeSidebar);
$('#new-chat').addEventListener('click', newChat);

// ---------------------------------------------------------------------------
// Settings dialog
// ---------------------------------------------------------------------------

$('#open-settings').addEventListener('click', () => {
  $('#temperature').value = state.settings.temperature;
  $('#temp-out').textContent = state.settings.temperature;
  $('#theme-select').value = state.settings.theme;
  $('#vault-mode').textContent = state.session
    ? '☁️ Signed in: your chats are end-to-end encrypted and synced across your devices.'
    : vault.mode === 'passphrase'
      ? '🔐 Your chat history is protected by your passphrase on this device.'
      : '🔑 Your chat history is saved only on this device, encrypted automatically.';
  $('#lock-now').hidden = vault.mode !== 'passphrase';
  $('#settings-account').hidden = !state.accounts;
  $('#settings-account').textContent = state.session ? '👤 Manage account' : '👤 Sign in or create an account to sync chats';
  $('#settings').showModal();
});
$('#temperature').addEventListener('input', (e) => {
  state.settings.temperature = Number(e.target.value);
  $('#temp-out').textContent = e.target.value;
  saveSettings();
});
$('#theme-select').addEventListener('change', (e) => {
  state.settings.theme = e.target.value;
  saveSettings();
  applyTheme();
});
$('#lock-now').addEventListener('click', lockApp);
$('#erase-data').addEventListener('click', async () => {
  if (!state.session) return eraseEverything();
  if (!confirm('Delete ALL your chats from your account on every device? This cannot be undone.')) return;
  for (const chat of [...state.chats]) {
    try { await state.store.deleteChat(chat.id); } catch (e) { toast(`Couldn't delete everything: ${e.message}`); break; }
    state.chats = state.chats.filter((c) => c !== chat);
  }
  $('#settings').close();
  newChat();
});
$('#settings-account').addEventListener('click', () => { $('#settings').close(); openAccount(); });
$('#export-data').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state.chats.map(stripGhost), null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `portai-chats-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

// Keyboard shortcut: Ctrl/Cmd+Shift+O → new chat
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'o') { e.preventDefault(); newChat(); }
});

// Auto-lock passphrase vaults after 15 minutes of inactivity.
let idleTimer;
function resetIdle() {
  clearTimeout(idleTimer);
  if (vault.mode === 'passphrase') idleTimer = setTimeout(() => { if (!state.streaming) lockApp(); }, 15 * 60 * 1000);
}
['pointerdown', 'keydown'].forEach((ev) => document.addEventListener(ev, resetIdle, { passive: true }));

// ---------------------------------------------------------------------------
// Accounts (zero-knowledge, end-to-end encrypted sync)
// ---------------------------------------------------------------------------

function toast(message) {
  let el = $('#toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    el.setAttribute('role', 'status');
    document.body.append(el);
  }
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 5000);
}

function updateAccountUi() {
  const btn = $('#open-account');
  btn.hidden = !state.accounts;
  btn.textContent = state.session ? '☁️ Account · synced' : '👤 Sign in to sync chats';
  $('#account-signed-in').hidden = !state.session;
  $('#account-signed-out').hidden = !!state.session;
  $('.privacy-badge').textContent = state.session ? '🔒 End-to-end encrypted sync' : '🔒 Private · No ads · No tracking';
  updateSyncStatus();
}

function updateSyncStatus() {
  const el = $('#sync-status');
  if (!el) return;
  el.textContent = state.unsynced.size
    ? `⚠️ ${state.unsynced.size} chat(s) waiting to sync. PortAI will keep retrying.`
    : `${state.chats.length} chat(s) synced.`;
  if (state.session) $('#open-account').textContent = state.unsynced.size ? '☁️ Account · syncing…' : '☁️ Account · synced';
}

function openAccount() {
  closeSidebar();
  updateAccountUi();
  if (!state.session) { showTab('signin'); }
  $('#account').showModal();
  if (!state.session) $('#signin-pass').focus();
}

function showTab(tab) {
  document.querySelectorAll('#account .tab').forEach((t) => {
    const on = t.dataset.tab === tab;
    t.classList.toggle('active', on);
    t.setAttribute('aria-selected', String(on));
  });
  $('#signin-form').hidden = tab !== 'signin';
  $('#create-form').hidden = tab !== 'create';
  $('#signin-error').textContent = $('#create-error').textContent = '';
  if (tab === 'create' && !$('#gen-pass').value) $('#gen-pass').value = Account.generatePassphrase();
}

document.querySelectorAll('#account .tab').forEach((t) => t.addEventListener('click', () => showTab(t.dataset.tab)));
$('#open-account').addEventListener('click', openAccount);
$('#account-close').addEventListener('click', () => $('#account').close());
$('#gen-new').addEventListener('click', () => { $('#gen-pass').value = Account.generatePassphrase(); $('#create-saved').checked = false; });
$('#gen-copy').addEventListener('click', (e) => copyText($('#gen-pass').value, e.currentTarget));
$('#use-custom').addEventListener('click', () => { $('#gen-wrap').hidden = true; $('#custom-wrap').hidden = false; $('#custom-pass').focus(); });
$('#use-generated').addEventListener('click', () => { $('#gen-wrap').hidden = false; $('#custom-wrap').hidden = true; });

async function startSession(session, remember) {
  // Offer to move chats that are only on this device into the account.
  const local = state.store === vault ? state.chats.slice() : await vault.loadChats();
  const store = new Account.AccountStore(session);
  let remote = await store.loadChats();
  if (local.length && confirm(`Move ${local.length} chat(s) from this device into your account? They'll be encrypted and synced.`)) {
    const remoteIds = new Set(remote.map((c) => c.id));
    for (const chat of local) {
      if (!remoteIds.has(chat.id)) await store.saveChat(stripGhost(chat));
      await vault.deleteChat(chat.id);
    }
    remote = await store.loadChats();
  }
  if (remember) await vault.saveSession(session);
  else await vault.clearSession();
  state.session = session;
  state.store = store;
  state.chats = remote;
  state.unsynced.clear();
  updateAccountUi();
  renderChatList();
  newChat();
}

$('#signin-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const err = $('#signin-error');
  const pass = $('#signin-pass').value;
  if (!pass.trim()) return;
  err.textContent = '';
  busy(e.submitter, 'Signing in…');
  try {
    const session = await Account.deriveAccount(pass);
    await Account.login(session);
    await startSession(session, $('#signin-remember').checked);
    $('#signin-pass').value = '';
    $('#account').close();
    toast('Signed in. Your chats are synced.');
  } catch (ex) {
    err.textContent = ex.status === 404
      ? 'No account found for this passphrase. Check it for typos, or create a new account.'
      : ex.message || 'Could not sign in.';
  } finally {
    busy(e.submitter, null);
  }
});

$('#create-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const err = $('#create-error');
  const custom = !$('#custom-wrap').hidden;
  const pass = custom ? $('#custom-pass').value : $('#gen-pass').value;
  if (custom) {
    if (pass.trim().length < Account.MIN_CUSTOM_LENGTH) { err.textContent = `Use at least ${Account.MIN_CUSTOM_LENGTH} characters. Longer is safer.`; return; }
    if (pass !== $('#custom-pass2').value) { err.textContent = 'Passphrases do not match.'; return; }
  }
  if (!$('#create-saved').checked) { err.textContent = 'Please save your passphrase first. It cannot be recovered.'; return; }
  err.textContent = '';
  busy(e.submitter, 'Creating…');
  try {
    const session = await Account.deriveAccount(pass);
    await Account.createAccount(session);
    await startSession(session, $('#create-remember').checked);
    ['#custom-pass', '#custom-pass2', '#gen-pass'].forEach((s) => { $(s).value = ''; });
    $('#create-saved').checked = false;
    $('#account').close();
    toast('Account created. Sign in with your passphrase on any device.');
  } catch (ex) {
    err.textContent = ex.message || 'Could not create the account.';
  } finally {
    busy(e.submitter, null);
  }
});

$('#sign-out').addEventListener('click', async () => {
  stopStreaming();
  await vault.clearSession();
  state.session = null;
  state.store = vault;
  state.unsynced.clear();
  state.chats = await vault.loadChats();
  $('#account').close();
  updateAccountUi();
  renderChatList();
  newChat();
  toast('Signed out. Your synced chats are safe in your account.');
});

$('#delete-account').addEventListener('click', async (e) => {
  if (!confirm('Permanently delete your account and ALL synced chats? This cannot be undone.')) return;
  busy(e.currentTarget, 'Deleting…');
  try {
    await Account.deleteAccount(state.session);
    $('#sign-out').click();
    toast('Your account and all synced chats were deleted.');
  } catch (ex) {
    toast(`Couldn't delete the account: ${ex.message}`);
  } finally {
    busy(e.currentTarget, null);
  }
});

// ---------------------------------------------------------------------------
// Auto-update: apps opened from the Home Screen stay in memory and never reload,
// so check for a new version whenever PortAI comes back to the foreground.
// ---------------------------------------------------------------------------

let lastUpdateCheck = 0;
async function checkForUpdate() {
  if (Date.now() - lastUpdateCheck < 60_000 || !state.version) return;
  lastUpdateCheck = Date.now();
  try {
    const cfg = await (await fetch('/api/config', { credentials: 'same-origin', cache: 'no-store' })).json();
    if (!cfg.version || cfg.version === state.version) return;
    const busyNow = state.streaming || $('#input').value.trim() || document.querySelector('dialog[open]');
    if (!busyNow) { location.reload(); return; }
    showUpdateToast();
  } catch { /* offline: try again later */ }
}

function showUpdateToast() {
  if ($('#update-toast')) return;
  const btn = document.createElement('button');
  btn.id = 'update-toast';
  btn.type = 'button';
  btn.className = 'update-toast';
  btn.textContent = '✨ New version of PortAI available · Tap to reload';
  btn.addEventListener('click', () => location.reload());
  document.body.append(btn);
}

document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkForUpdate(); });
window.addEventListener('focus', checkForUpdate);
setInterval(checkForUpdate, 10 * 60_000);

boot();
