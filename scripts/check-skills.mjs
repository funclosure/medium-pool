#!/usr/bin/env node
// Validates every folder under skills/ (lanes, kinds, and compose-* compositions) against the contract in skills/README.md.
// Exit 1 with a list of problems; exit 0 with a count when everything holds.
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
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

const REQUIRED = ['slug', 'name', 'hook', 'message', 'direction', 'substrate', 'accent', 'instances'];

function checkFolder(dir) {
  const hasManifest = existsSync(join(ROOT, 'skills', dir, 'lane.md')) || existsSync(join(ROOT, 'skills', dir, 'composition.md'));
  if (!hasManifest) return checkPoolSkill(dir);
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
  if (!skill.includes('## Reference instances')) problems.push(`${label}: SKILL.md needs a "## Reference instances" section (instances are evidence, not the ${subject})`);

  if (!existsSync(manifestPath)) { problems.push(`${label}: missing ${manifestName}`); return; }
  const manifest = readFileSync(manifestPath, 'utf8');
  const mfm = frontmatter(manifest, label + '/' + manifestName);
  if (!mfm) return;
  for (const key of REQUIRED) if (mfm[key] == null || mfm[key] === '') problems.push(`${label}: ${manifestName} is missing "${key}"`);
  for (const legacy of ['demo', 'examples']) if (legacy in mfm) problems.push(`${label}: "${legacy}" is gone; put it under "instances"`);
  if (!['in', 'out', 'both'].includes(mfm.direction)) problems.push(`${label}: direction must be in, out, or both`);
  const instances = Array.isArray(mfm.instances) ? mfm.instances : [];
  if (!instances.some((i) => i && i.module)) problems.push(`${label}: needs at least one pool instance (an instance with a module)`);
  for (const i of instances) {
    if (!i || !i.name) { problems.push(`${label}: every instance needs a name`); continue; }
    if (i.module) { if (!existsSync(join(ROOT, 'skills', dir, i.module))) problems.push(`${label}: instance "${i.name}" module "${i.module}" does not exist`); }
    else if (!i.by || !i.note) problems.push(`${label}: wild instance "${i.name}" needs "by" and "note"`);
  }
  if (!/^## Why/m.test(manifest)) problems.push(`${label}: ${manifestName} body needs a "## Why" section`);
  if (!/^## Gotchas/m.test(manifest)) problems.push(`${label}: ${manifestName} body needs a "## Gotchas" section`);
  if (kind === 'compositions') {
    if (!mfm.mediums) problems.push(`${label}: composition.md needs "mediums"`);
    if (!mfm.binding) problems.push(`${label}: composition.md needs "binding"`);
  }
}

// A pool-level skill (the router) has a SKILL.md and no manifest: it describes the pool, not a class.
function checkPoolSkill(dir) {
  const label = `skills/${dir}`;
  checked++;
  const skillPath = join(ROOT, 'skills', dir, 'SKILL.md');
  if (!existsSync(skillPath)) { problems.push(`${label}: no manifest and no SKILL.md; not a skill folder`); return; }
  const sfm = frontmatter(readFileSync(skillPath, 'utf8'), label + '/SKILL.md');
  if (sfm) {
    if (sfm.name !== dir) problems.push(`${label}: SKILL.md name "${sfm.name}" must equal the folder name "${dir}"`);
    if (!sfm.description) problems.push(`${label}: SKILL.md needs a description`);
  }
  if (dir === 'medium-pool') {
    const r = spawnSync(process.execPath, [join(ROOT, 'scripts', 'build-router.mjs'), '--check'], { encoding: 'utf8' });
    if (r.status !== 0) problems.push(`${label}: ${(r.stderr || r.stdout).trim()}`);
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
