#!/usr/bin/env node
// Regenerates the pool table inside skills/medium-pool/SKILL.md from every manifest.
// `node scripts/build-router.mjs` writes it; `--check` exits 1 if the file is stale.
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

const ROOT = new URL('..', import.meta.url).pathname;
const SKILLS = join(ROOT, 'skills');
const ROUTER = join(SKILLS, 'medium-pool', 'SKILL.md');

const fm = (t) => { const m = t.match(/^---\n([\s\S]*?)\n---/); return m ? parse(m[1]) : null; };
const rows = [];
for (const dir of readdirSync(SKILLS)) {
  const base = join(SKILLS, dir);
  if (dir.startsWith('.') || !statSync(base).isDirectory()) continue;
  const lane = join(base, 'lane.md'), comp = join(base, 'composition.md');
  const file = existsSync(lane) ? lane : existsSync(comp) ? comp : null;
  if (!file) continue;
  const d = fm(readFileSync(file, 'utf8'));
  const level = file === comp ? 'composition' : d.lane ? `kind of ${d.lane}` : 'medium';
  rows.push({ skill: dir, name: d.name, level, direction: d.direction, hook: d.hook, message: d.message, order: (d.lane ? 50 : file === comp ? 90 : 0) + (d.order ?? 99), parts: d.mediums ? `${d.mediums.join(' + ')}, bound by ${d.binding}` : '' });
}
rows.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

const table = [
  '| Read this skill | It is | Direction | What it is | What it does to the person |',
  '|---|---|---|---|---|',
  ...rows.map((r) => `| \`${r.skill}\` | ${r.name}, ${r.level}${r.parts ? ` (${r.parts})` : ''} | ${r.direction} | ${r.hook} | ${r.message} |`),
].join('\n');
const block = `<!-- pool:start -->\n${table}\n<!-- pool:end -->`;

const current = readFileSync(ROUTER, 'utf8');
const next = current.replace(/<!-- pool:start -->[\s\S]*?<!-- pool:end -->/, block);
if (process.argv.includes('--check')) {
  if (next !== current) { console.error('skills/medium-pool/SKILL.md is stale. Run: bun run router'); process.exit(1); }
  console.log(`router table is current (${rows.length} rows).`);
} else {
  writeFileSync(ROUTER, next);
  console.log(`router table written (${rows.length} rows).`);
}
