#!/usr/bin/env node
// Validates every folder under skills/ (lanes, kinds, and compose-* compositions) against the contract in skills/README.md.
// Exit 1 with a list of problems; exit 0 with a count when everything holds.
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';

const ROOT = new URL('..', import.meta.url).pathname;
const problems = [];
let checked = 0;

// Parse frontmatter with a real YAML parser: the skills CLI and Astro both do, so an unquoted
// "description: Build X: Y" that a loose regex would accept gets rejected here first.
const frontmatter = (text, label) => {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  try {
    const data = parseYaml(m[1]);
    return data && typeof data === 'object' ? data : null;
  } catch (err) {
    problems.push(`${label}: frontmatter is not valid YAML (${String(err.message).split('\n')[0]}). Quote values that contain ": ".`);
    return null;
  }
};

const REQUIRED = ['slug', 'name', 'hook', 'message', 'accent', 'demo'];

function checkFolder(dir) {
  const kind = existsSync(join(ROOT, 'skills', dir, 'composition.md')) ? 'compositions' : 'skills';
  const manifestName = kind === 'skills' ? 'lane.md' : 'composition.md';
  const label = `skills/${dir}`;
  const skillPath = join(ROOT, 'skills', dir, 'SKILL.md');
  const manifestPath = join(ROOT, 'skills', dir, manifestName);
  checked++;

  if (!existsSync(skillPath)) { problems.push(`${label}: missing SKILL.md`); return; }
  const skill = readFileSync(skillPath, 'utf8');
  const sfm = frontmatter(skill, label + '/SKILL.md');
  if (sfm) {
    if (sfm.name !== dir) problems.push(`${label}: SKILL.md name "${sfm.name}" must equal the folder name "${dir}"`);
    if (!sfm.description) problems.push(`${label}: SKILL.md needs a description`);
  }
  const subject = kind === 'skills' ? 'medium' : 'composition';
  if (!skill.includes(`## What this ${subject} does to the person`)) {
    problems.push(`${label}: SKILL.md must lead with "## What this ${subject} does to the person"`);
  }

  if (!existsSync(manifestPath)) { problems.push(`${label}: missing ${manifestName}`); return; }
  const manifest = readFileSync(manifestPath, 'utf8');
  const mfm = frontmatter(manifest, label + '/' + manifestName);
  if (!mfm) return;
  for (const key of REQUIRED) if (mfm[key] == null || mfm[key] === '') problems.push(`${label}: ${manifestName} is missing "${key}"`);
  if (mfm.demo && !existsSync(join(ROOT, 'skills', dir, mfm.demo))) problems.push(`${label}: demo "${mfm.demo}" does not exist`);
  if (!/^## Why/m.test(manifest)) problems.push(`${label}: ${manifestName} body needs a "## Why" section`);
  if (!/^## Gotchas/m.test(manifest)) problems.push(`${label}: ${manifestName} body needs a "## Gotchas" section`);
  if (kind === 'compositions') {
    if (!mfm.mediums) problems.push(`${label}: composition.md needs "mediums"`);
    if (!mfm.binding) problems.push(`${label}: composition.md needs "binding"`);
  }
}

const base = join(ROOT, 'skills');
for (const dir of readdirSync(base)) {
  if (dir.startsWith('.') || dir.startsWith('_') || !statSync(join(base, dir)).isDirectory()) continue;
  checkFolder(dir);
}

if (problems.length) {
  console.error(`${problems.length} problem(s) in ${checked} folder(s):\n` + problems.map((p) => `  - ${p}`).join('\n'));
  process.exit(1);
}
console.log(`${checked} folder(s) checked, all follow the contract.`);
