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

function loadSettings() {
  try { return { theme: 'system', temperature: 0.7, model: null, ...JSON.parse(localStorage.getItem('portai.settings') || '{}') }; }
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
  } catch {
    state.models = [];
  }
  const sel = $('#model-select');
  sel.replaceChildren(...state.models.map((m) => new Option(m.label, m.id)));
  if (state.settings.model && state.models.some((m) => m.id === state.settings.model)) sel.value = state.settings.model;
}

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
  if (chat.model && state.models.some((m) => m.id === chat.model)) $('#model-select').value = chat.model;
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
    bubble.innerHTML = renderMarkdown(m.content); // renderer escapes all input
    if (m.error) bubble.classList.add('error-bubble');
  } else {
    bubble.textContent = m.content;
  }
  if (m.role === 'assistant' && m.trace) {
    const summary = renderTrace(m.trace);
    if (summary) wrap.append(summary);
  }
  wrap.append(bubble);
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

function scrollToBottom(force) {
  const box = $('#messages');
  const near = box.scrollHeight - box.scrollTop - box.clientHeight < 160;
  if (force || near) box.scrollTop = box.scrollHeight;
}

// ---------------------------------------------------------------------------
// Sending & streaming
// ---------------------------------------------------------------------------

async function send(text) {
  const chat = state.current;
  if (!text.trim() || state.streaming) return;
  chat.model = $('#model-select').value || chat.model;
  chat.messages.push({ role: 'user', content: text });
  if (chat.messages.length === 1) chat.title = text.replace(/\s+/g, ' ').slice(0, 60);
  $('#welcome').hidden = true;
  $('#messages').append(messageNode({ role: 'user', content: text }));
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
        messages: chat.messages.filter((m) => !m.error).map(({ role, content }) => ({ role, content })),
      }),
      signal: controller.signal,
    });

    if (!res.ok || !res.body) {
      let serverMsg = '';
      try { serverMsg = (await res.clone().json()).error || ''; } catch { /* Cloudflare block pages are HTML */ }
      throw Object.assign(new Error(friendlyError({ status: res.status, message: serverMsg, retryAfter: res.headers.get('Retry-After') })), { friendly: true });
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    let frame = 0;
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
        if (msg.status === 'thinking' && live.phase === 'connecting') {
          live.start('thinking', 'Thinking', 'Thought');
          if (mentionsMultiport(text)) live.note('knowledge', 'Checked Multiport knowledge');
        }
        if (msg.delta) {
          if (live.phase !== 'writing') { live.start('writing', 'Writing', 'Wrote reply'); bubble.hidden = false; }
          reply.content += msg.delta;
        }
      }
      if (!frame) {
        frame = requestAnimationFrame(() => {
          frame = 0;
          bubble.innerHTML = renderMarkdown(reply.content);
          scrollToBottom();
        });
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
  if (!text.trim()) return;
  input.value = '';
  autosize();
  send(text);
});
$('#stop').addEventListener('click', stopStreaming);
document.querySelectorAll('.suggestion').forEach((b) => b.addEventListener('click', () => send(b.textContent)));

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

boot();
