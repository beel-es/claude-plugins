#!/usr/bin/env node
// Rebuilds the generated parts of the `beel-api:rules` skill from BeeL.'s rules catalogue:
//
//   plugins/beel-api/skills/rules/data/rules.snapshot.json   the catalogue, as fetched
//   plugins/beel-api/skills/rules/reference/<domain>.md      one file per domain
//   plugins/beel-api/skills/rules/SKILL.md                   the blocks between GENERATED markers
//
// Usage:
//   node scripts/build-rules-skill.mjs                        from https://docs.beel.es/api/rules.json
//   node scripts/build-rules-skill.mjs --source <url|path>    from another copy (a docs preview, a local file)
//   node scripts/build-rules-skill.mjs --check                exit 1 if anything generated is out of date
//
// With --check it reads the bundled snapshot unless --source is given, so it works offline and
// only verifies that the committed files agree with each other. No dependencies: Node 18+.

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_SOURCE,
  SNAPSHOT_PATH,
  decisionBlock,
  domainReference,
  indexBlock,
  validateCatalogue,
} from '../plugins/beel-api/skills/rules/scripts/render.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKILL_DIR = join(ROOT, 'plugins/beel-api/skills/rules');
const REFERENCE_DIR = join(SKILL_DIR, 'reference');
const SKILL_MD = join(SKILL_DIR, 'SKILL.md');

const argv = process.argv.slice(2);
const check = argv.includes('--check');
const sourceAt = argv.indexOf('--source');
const source = sourceAt >= 0 ? argv[sourceAt + 1] : check ? SNAPSHOT_PATH : DEFAULT_SOURCE;
if (sourceAt >= 0 && !source) {
  console.error('--source needs a URL or a path');
  process.exit(2);
}

async function read(src) {
  if (/^https?:\/\//.test(src)) {
    const res = await fetch(src, { headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`${src} answered ${res.status}`);
    return res.json();
  }
  return JSON.parse(readFileSync(src, 'utf8'));
}

const data = await read(source);
const problems = validateCatalogue(data);
if (problems.length) {
  console.error(`The catalogue at ${source} does not validate:\n- ${problems.join('\n- ')}`);
  process.exit(1);
}

/** Replace the text between <!-- BEGIN GENERATED: name --> and <!-- END GENERATED: name -->. */
function fillBlock(text, name, content) {
  const re = new RegExp(`(<!-- BEGIN GENERATED: ${name} -->)[\\s\\S]*?(<!-- END GENERATED: ${name} -->)`);
  if (!re.test(text)) throw new Error(`SKILL.md has no GENERATED: ${name} block`);
  return text.replace(re, (_, begin, end) => `${begin}\n${content}\n${end}`);
}

const outputs = new Map();
outputs.set(SNAPSHOT_PATH, `${JSON.stringify(data, null, 2)}\n`);
for (const d of data.domains) outputs.set(join(REFERENCE_DIR, `${d.slug}.md`), domainReference(data, d));
let skill = readFileSync(SKILL_MD, 'utf8');
skill = fillBlock(skill, 'index', indexBlock(data));
skill = fillBlock(skill, 'decision', decisionBlock(data));
outputs.set(SKILL_MD, skill);

const stale = existsSync(REFERENCE_DIR)
  ? readdirSync(REFERENCE_DIR)
      .filter((f) => f.endsWith('.md'))
      .map((f) => join(REFERENCE_DIR, f))
      .filter((p) => !outputs.has(p))
  : [];

if (check) {
  const drift = [...outputs].filter(([p, c]) => !existsSync(p) || readFileSync(p, 'utf8') !== c).map(([p]) => p);
  drift.push(...stale);
  if (drift.length) {
    console.error(`Out of date (run node scripts/build-rules-skill.mjs):\n- ${drift.map((p) => relative(ROOT, p)).join('\n- ')}`);
    process.exit(1);
  }
  console.log(`rules skill up to date: ${data.rules.length} rules, ${data.domains.length} domains`);
  process.exit(0);
}

mkdirSync(REFERENCE_DIR, { recursive: true });
mkdirSync(dirname(SNAPSHOT_PATH), { recursive: true });
for (const [p, c] of outputs) writeFileSync(p, c);
for (const p of stale) rmSync(p);
console.log(
  `Built from ${source}: ${data.rules.length} rules, ${data.domains.length} reference files` +
    (stale.length ? `, removed ${stale.map((p) => relative(ROOT, p)).join(', ')}` : ''),
);
