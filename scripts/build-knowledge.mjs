// Regenerates lib/multiport-knowledge.mjs from MULTIPORT_KNOWLEDGE.md.
// Cloudflare Pages Functions can't import .md files, so the knowledge is embedded
// as a JS string. Run `npm run knowledge` after editing the Markdown file
// (`npm test` fails if you forget).
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
export const DETAILS_MARKER = '<!-- DETAILS BELOW';
export const LIBRARY_MARKER = '<!-- LIBRARY BELOW';

const afterComment = (text) => text.slice(text.indexOf('-->') + 3);

/** Parse library sections: "## Title", a "<!-- topics: a, b -->" line, then the body. */
export function parseLibrary(text) {
  return text.split(/^## /m).slice(1).map((chunk) => {
    const title = chunk.slice(0, chunk.indexOf('\n')).trim();
    const topics = (chunk.match(/<!--\s*topics:\s*([\s\S]*?)-->/i)?.[1] || '').split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
    const body = chunk.slice(chunk.indexOf('\n')).replace(/<!--[\s\S]*?-->/g, '').trim();
    return { title, topics, text: `## ${title}\n${body}` };
  }).filter((sec) => sec.topics.length && sec.text.length);
}

/** Split the Markdown into: core (always sent), details (PortAI/help questions) and the topic library. */
export function splitKnowledge(md) {
  const d = md.indexOf(DETAILS_MARKER);
  const l = md.indexOf(LIBRARY_MARKER);
  const coreEnd = [d, l].filter((i) => i >= 0).sort((x, y) => x - y)[0] ?? md.length;
  const details = d >= 0 ? afterComment(md.slice(d, l > d ? l : md.length)).trim() : '';
  const library = l >= 0 ? parseLibrary(afterComment(md.slice(l))) : [];
  return { core: md.slice(0, coreEnd).trim(), details, library };
}

export function renderKnowledgeModule(md) {
  const { core, details, library } = splitKnowledge(md);
  return `/* This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. */\n\n// GENERATED from MULTIPORT_KNOWLEDGE.md by scripts/build-knowledge.mjs. Do not edit by hand.\n// Run \`npm run knowledge\` after changing the Markdown file.\n\n// Always sent: about Multiport and its products.\nexport const MULTIPORT_KNOWLEDGE = ${JSON.stringify(core)};\n\n// Only sent when a question is about PortAI, Multiport, privacy or help.\nexport const MULTIPORT_KNOWLEDGE_DETAILS = ${JSON.stringify(details)};\n\n// Topic library: only the sections matching a question are sent.\nexport const MULTIPORT_LIBRARY = ${JSON.stringify(library, null, 1)};\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const md = fs.readFileSync(new URL('MULTIPORT_KNOWLEDGE.md', root), 'utf8');
  fs.writeFileSync(new URL('lib/multiport-knowledge.mjs', root), renderKnowledgeModule(md));
  console.log('Updated lib/multiport-knowledge.mjs');
}
