import { Vault } from './vault.js';
import { renderMarkdown } from './markdown.js';

const $ = (sel) => document.querySelector(sel);
const vault = new Vault();

const state = {
  models: [],
  chats: [],          // decrypted, in memory only while unlocked
  current: null,      // active chat object
  streaming: null,    // AbortController
  settings: loadSettings(),
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
  if (status === 'device') {
    await vault.unlock();
    return enterApp();
  }
  $('#vault').hidden = false;
  $('#setup-form').hidden = status !== 'new';
  $('#unlock-form').hidden = status !== 'passphrase';
  (status === 'new' ? $('#setup-pass') : $('#unlock-pass')).focus();
}

$('#setup-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const p1 = $('#setup-pass').value;
  const p2 = $('#setup-pass2').value;
  const err = $('#setup-error');
  if (p1.length < 8) { err.textContent = 'Use at least 8 characters.'; return; }
  if (p1 !== p2) { err.textContent = 'Passphrases do not match.'; return; }
  err.textContent = '';
  busy(e.submitter, 'Encrypting…');
  await vault.setupPassphrase(p1);
  $('#setup-pass').value = $('#setup-pass2').value = '';
  enterApp();
});

$('#setup-device').addEventListener('click', async () => {
  await vault.setupDevice();
  enterApp();
});

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
  state.chats = await vault.loadChats();
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
  if (!confirm('Erase all PortAI conversations and keys from this device? This cannot be undone.')) return;
  await vault.eraseAll();
  location.reload();
}

// ---------------------------------------------------------------------------
// Models
// ---------------------------------------------------------------------------

async function loadConfig() {
  try {
    const res = await fetch('/api/config', { credentials: 'omit' });
    const cfg = await res.json();
    state.models = cfg.models || [];
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
  await vault.saveChat(stripGhost(chat));
  renderChatList();
}

function stripGhost(chat) {
  const { ghost, ...rest } = chat;
  return rest;
}

async function deleteChat(id) {
  if (!confirm('Delete this conversation?')) return;
  await vault.deleteChat(id);
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
  bubble.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
  $('#messages').append(node);
  scrollToBottom(true);

  const controller = new AbortController();
  state.streaming = controller;
  setStreamingUi(true);

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      credentials: 'omit',
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
      let msg = `Request failed (${res.status}).`;
      try { msg = (await res.json()).error || msg; } catch { /* ignore */ }
      throw new Error(msg);
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
        if (msg.error) throw new Error(msg.error);
        if (msg.delta) reply.content += msg.delta;
      }
      if (!frame) {
        frame = requestAnimationFrame(() => {
          frame = 0;
          bubble.innerHTML = renderMarkdown(reply.content) || '<span class="typing"><i></i><i></i><i></i></span>';
          scrollToBottom();
        });
      }
    }
    if (!reply.content) reply.content = '_(The model returned an empty response.)_';
  } catch (err) {
    if (err.name === 'AbortError') {
      if (!reply.content) reply.content = '_(Stopped.)_';
    } else {
      reply.error = !reply.content;
      reply.content = (reply.content ? reply.content + '\n\n' : '') + `⚠️ ${err.message || 'Something went wrong.'}`;
    }
  } finally {
    delete reply.pending;
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
  $('#vault-mode').textContent = vault.mode === 'passphrase'
    ? '🔐 Your chats are encrypted with a key derived from your passphrase (PBKDF2 · AES-256-GCM).'
    : '🔑 Your chats are encrypted with a non-extractable device key (AES-256-GCM). Erase data and set up again to use a passphrase.';
  $('#lock-now').hidden = vault.mode !== 'passphrase';
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
$('#erase-data').addEventListener('click', eraseEverything);
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

boot();
