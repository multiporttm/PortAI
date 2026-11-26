// Regenerates lib/multiport-knowledge.mjs from MULTIPORT_KNOWLEDGE.md.
// Cloudflare Pages Functions can't import .md files, so the knowledge is embedded
// as a JS string. Run `npm run knowledge` after editing the Markdown file
// (`npm test` fails if you forget).
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
export const DETAILS_MARKER = '<!-- DETAILS BELOW';

/** Split the Markdown into the always-sent core and the details sent only when relevant. */
export function splitKnowledge(md) {
  const i = md.indexOf(DETAILS_MARKER);
  if (i < 0) return { core: md.trim(), details: '' };
  const rest = md.slice(i);
  return { core: md.slice(0, i).trim(), details: rest.slice(rest.indexOf('-->') + 3).trim() };
}

export function renderKnowledgeModule(md) {
  const { core, details } = splitKnowledge(md);
  return `/* This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. */\n\n// GENERATED from MULTIPORT_KNOWLEDGE.md by scripts/build-knowledge.mjs. Do not edit by hand.\n// Run \`npm run knowledge\` after changing the Markdown file.\n\n// Always sent: about Multiport and its products.\nexport const MULTIPORT_KNOWLEDGE = ${JSON.stringify(core)};\n\n// Only sent when a question is about PortAI, Multiport, privacy or help.\nexport const MULTIPORT_KNOWLEDGE_DETAILS = ${JSON.stringify(details)};\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const md = fs.readFileSync(new URL('MULTIPORT_KNOWLEDGE.md', root), 'utf8');
  fs.writeFileSync(new URL('lib/multiport-knowledge.mjs', root), renderKnowledgeModule(md));
  console.log('Updated lib/multiport-knowledge.mjs');
}
