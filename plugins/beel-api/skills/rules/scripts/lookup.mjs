#!/usr/bin/env node
// Look up BeeL. fiscal rules by id, domain or error code.
//
//   node lookup.mjs VOI-001                    one rule
//   node lookup.mjs void                       a domain, by slug or prefix (void, VOI); --full for every rule in full
//   node lookup.mjs INVOICE_ALREADY_VOIDED     the rules an error code reports
//   node lookup.mjs --yours [domain]           rules BeeL. does not check (enforced_by integrator or issuer)
//   node lookup.mjs --list                     the one-line index
//
// Options: --brief (one line per rule) · --full · --json · --offline (bundled snapshot only)
//          --source <url|path> (default https://docs.beel.es/api/rules.json, or $BEEL_RULES_URL)
//
// Reads the live catalogue and falls back to the snapshot bundled with this skill when it is
// unreachable. Stderr says which one answered. Exit codes: 0 found · 1 nothing matched · 2 usage.

import { DEFAULT_SOURCE, indexBlock, isYours, loadRules, ruleLine, ruleMarkdown, select } from './render.mjs';

const USAGE = 'usage: lookup.mjs <RULE-ID | domain | ERROR_CODE> | --yours [domain] | --list  [--brief|--full] [--json] [--offline] [--source <url|path>]';

const KNOWN = new Set(['--brief', '--full', '--json', '--offline', '--list', '--yours', '--help']);
const flags = new Set();
const positional = [];
let source = process.env.BEEL_RULES_URL || DEFAULT_SOURCE;
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--source') {
    source = argv[++i];
    if (!source) usage(2);
  } else if (a.startsWith('--')) {
    if (!KNOWN.has(a)) usage(2);
    flags.add(a);
  } else positional.push(a);
}
const query = positional[0];
if (flags.has('--help')) usage(0);
if (!query && !flags.has('--list') && !flags.has('--yours')) usage(2);

function usage(code) {
  (code ? console.error : console.log)(USAGE);
  process.exit(code);
}

const { data, origin, fallbackReason } = await loadRules({ source, offline: flags.has('--offline') });
const note = flags.has('--offline') ? ' (--offline)' : fallbackReason ? ` (live catalogue unavailable: ${fallbackReason})` : '';
console.error(`rules: ${origin}${note}`);

if (flags.has('--list')) {
  console.log(flags.has('--json') ? JSON.stringify(data.rules.map(({ id, severity, title, enforced_by }) => ({ id, severity, title, enforced_by })), null, 2) : indexBlock(data));
  process.exit(0);
}

let result;
if (flags.has('--yours')) {
  const scoped = query ? select(data, query) : { rules: data.rules };
  result = { kind: 'yours', rules: scoped.rules.filter(isYours) };
} else {
  result = select(data, query);
}

if (result.rules.length === 0) {
  console.error(`No rule matches "${query}". Try an id (VOI-001), a domain (${data.domains.map((d) => d.slug).join(', ')}) or an error code.`);
  process.exit(1);
}

if (flags.has('--json')) {
  console.log(JSON.stringify(result.rules, null, 2));
} else if (flags.has('--brief') || ((result.kind === 'domain' || result.kind === 'yours') && !flags.has('--full'))) {
  if (result.domain) console.log(`# ${result.domain.title} (${result.domain.prefix}) — ${result.domain.url}\n\n${result.domain.description}\n`);
  console.log(result.rules.map(ruleLine).join('\n'));
  if (!flags.has('--brief')) console.log('\n† checked by the integrator or the issuing business. Pass an id for the full rule, or --full for all of them.');
} else {
  console.log(result.rules.map((r) => ruleMarkdown(r, { heading: 2 })).join('\n\n---\n\n'));
}
