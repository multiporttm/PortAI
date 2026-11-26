/* This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// Live, Claude-style activity steps for a reply ("Connecting…", "Thinking…",
// "Writing…") with a spinner and timer. Every step is driven by a real event
// (request sent, server handed the message to the model, first word arrived),
// so nothing is faked. When the reply finishes, the steps collapse into a
// one-line summary that can be expanded.

const FRAMES = ['·', '✢', '✳', '✶', '✻', '✽', '✻', '✶', '✳', '✢'];
const reducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const MULTIPORT_RE = /\b(multiport|portai|usex|counter ?app|lunchbox|everything quiz|hello new tab|new tab|kings island|coaster finder|city scraper|mac or windows|fontfiles|fonts?|browser games?|support)\b/i;

/** Whether a message is about Multiport, so PortAI consults its Multiport knowledge. */
export function mentionsMultiport(text) {
  return MULTIPORT_RE.test(String(text || ''));
}

export function formatSeconds(ms) {
  const s = ms / 1000;
  return s < 10 ? `${s.toFixed(1)}s` : `${Math.round(s)}s`;
}

function countWords(text) {
  return (String(text).match(/[\p{L}\p{N}]+/gu) || []).length;
}

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function stepRow({ label, ms, icon = '✓' }) {
  const row = el('div', 'step done');
  row.append(el('span', 'step-icon', icon), el('span', 'step-label', label), el('span', 'step-time', ms != null ? formatSeconds(ms) : ''));
  return row;
}

/** Build the collapsed summary for a finished reply (also used for saved chats). */
export function renderTrace(trace) {
  if (!trace?.steps?.length) return null;
  const details = el('details', 'steps-summary');
  const thought = trace.steps.find((s) => s.kind === 'thinking');
  const parts = [];
  if (trace.outcome === 'stopped') parts.push('Stopped');
  else if (trace.outcome === 'error') parts.push('Failed');
  else if (thought) parts.push(`Thought for ${formatSeconds(thought.ms)}`);
  if (trace.words) parts.push(`${trace.words} words`);
  const summary = el('summary', '', '');
  summary.append(el('span', 'step-icon', trace.outcome === 'error' ? '✕' : trace.outcome === 'stopped' ? '■' : '✓'), el('span', '', parts.join(' · ') || 'Done'));
  details.append(summary);
  const list = el('div', 'steps');
  for (const s of trace.steps) list.append(stepRow(s));
  details.append(list);
  return details;
}

export class LiveSteps {
  constructor(container, { model }) {
    this.container = container;
    this.model = model;
    this.steps = [];
    this.list = el('div', 'steps live');
    container.append(this.list);
    this.frame = 0;
    this.timer = setInterval(() => this.#tick(), 120);
  }

  #tick() {
    if (!this.current) return;
    if (!reducedMotion()) this.current.spinner.textContent = FRAMES[(this.frame = (this.frame + 1) % FRAMES.length)];
    this.current.time.textContent = formatSeconds(performance.now() - this.current.start);
  }

  /** Start a new active step; the previous one is marked done with its duration. */
  start(kind, label, doneLabel = label) {
    this.#finishCurrent();
    const row = el('div', `step active step-${kind}`);
    const spinner = el('span', 'step-icon spinner', FRAMES[0]);
    const text = el('span', 'step-label shimmer', `${label}…`);
    const time = el('span', 'step-time', '0.0s');
    row.append(spinner, text, time);
    this.list.append(row);
    this.current = { kind, label, doneLabel, start: performance.now(), row, spinner, time };
  }

  /** Record an instant step that already happened (e.g. consulting knowledge). */
  note(kind, label) {
    const step = { kind, label, ms: null };
    this.steps.push(step);
    const row = stepRow(step);
    if (this.current) this.list.insertBefore(row, this.current.row); else this.list.append(row);
  }

  #finishCurrent() {
    if (!this.current) return;
    const ms = performance.now() - this.current.start;
    this.steps.push({ kind: this.current.kind, label: this.current.doneLabel, ms });
    this.current.row.replaceWith(stepRow({ label: this.current.doneLabel, ms }));
    this.current = null;
  }

  get phase() { return this.current?.kind; }

  /** Stop the spinner and return a serialisable trace for the summary. */
  finish(content, outcome = 'done') {
    this.#finishCurrent();
    clearInterval(this.timer);
    this.list.remove();
    return { steps: this.steps, words: outcome === 'error' ? 0 : countWords(content), outcome };
  }
}
