// Shared by lookup.mjs (runtime) and scripts/build-rules-skill.mjs (repo root, build time).
// Loads BeeL.'s fiscal rules catalogue and renders it as Markdown. No dependencies: Node 18+.
//
// The wording of every rule comes from the catalogue verbatim. The labels below mirror the ones
// docs.beel.es uses, so a rule reads the same here as on its page: a law is a law, an AEAT
// criterion is an AEAT criterion, and a BeeL. rule is BeeL.'s own.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const DEFAULT_SOURCE = 'https://docs.beel.es/api/rules.json';
export const SNAPSHOT_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'rules.snapshot.json');

export const SEVERITY_LABEL = { MUST: 'MUST', MUST_NOT: 'MUST NOT', SHOULD: 'SHOULD' };
export const KIND_LABEL = { law: 'Law', aeat: 'AEAT criterion', beel: 'BeeL. rule' };
export const ENFORCED_LABEL = {
  api: 'BeeL. API',
  aeat: 'AEAT',
  integrator: 'Your integration',
  issuer: 'The issuing business',
};
const SUPPORTED_VERSION = 1;

/** Who has to catch a violation, in the catalogue's own terms. */
export function enforcementSentence(rule) {
  switch (rule.enforced_by) {
    case 'api':
      return rule.error_codes.length > 0 ? 'BeeL. rejects a request that breaks it.' : 'BeeL. does this for you.';
    case 'aeat':
      return 'AEAT rejects a record that breaks it.';
    default:
      return rule.error_codes.length > 0
        ? 'BeeL. rejects the cases listed under the error codes; the rest is yours to check.'
        : 'BeeL. does not check this; you must.';
  }
}

/** true when the integrator (or the business it works for) owns the rule. */
export const isYours = (rule) => rule.enforced_by === 'integrator' || rule.enforced_by === 'issuer';

/** Structural checks: what the rest of this module relies on. Returns a list of problems. */
export function validateCatalogue(data) {
  const problems = [];
  if (!data || typeof data !== 'object') return ['not a JSON object'];
  if (data.version !== SUPPORTED_VERSION) problems.push(`version ${data.version}, expected ${SUPPORTED_VERSION}`);
  if (!Array.isArray(data.domains) || data.domains.length === 0) problems.push('no domains');
  if (!Array.isArray(data.rules) || data.rules.length === 0) problems.push('no rules');
  if (problems.length) return problems;

  const ids = new Set();
  for (const r of data.rules) {
    for (const f of ['id', 'title', 'domain', 'severity', 'impact', 'kind', 'enforced_by', 'statement', 'why', 'markdown']) {
      if (typeof r[f] !== 'string' || !r[f]) problems.push(`${r.id ?? '?'}: missing ${f}`);
    }
    if (!/^[A-Z]{3}-\d{3}$/.test(r.id ?? '')) problems.push(`${r.id}: malformed id`);
    if (ids.has(r.id)) problems.push(`${r.id}: duplicate id`);
    ids.add(r.id);
    if (!(r.severity in SEVERITY_LABEL)) problems.push(`${r.id}: unknown severity ${r.severity}`);
    if (!(r.kind in KIND_LABEL)) problems.push(`${r.id}: unknown kind ${r.kind}`);
    if (!(r.enforced_by in ENFORCED_LABEL)) problems.push(`${r.id}: unknown enforced_by ${r.enforced_by}`);
    if (r.kind === 'beel' && r.legal_basis?.length) problems.push(`${r.id}: a BeeL. rule carries a legal basis`);
    for (const f of ['error_codes', 'legal_basis', 'related', 'docs', 'decision']) {
      if (!Array.isArray(r[f])) problems.push(`${r.id}: ${f} is not a list`);
    }
  }
  for (const r of data.rules) {
    for (const rel of r.related ?? []) if (!ids.has(rel)) problems.push(`${r.id}: related ${rel} does not exist`);
  }
  const listed = new Set();
  for (const d of data.domains) {
    for (const f of ['slug', 'prefix', 'title', 'description', 'url']) if (!d[f]) problems.push(`domain ${d.slug ?? '?'}: missing ${f}`);
    for (const id of d.rules ?? []) {
      listed.add(id);
      const r = data.rules.find((x) => x.id === id);
      if (!r) problems.push(`domain ${d.slug}: lists unknown rule ${id}`);
      else if (r.domain !== d.slug) problems.push(`${id}: domain ${r.domain}, listed under ${d.slug}`);
    }
  }
  for (const id of ids) if (!listed.has(id)) problems.push(`${id}: in no domain`);
  return problems;
}

async function readSource(source, timeoutMs) {
  if (/^https?:\/\//.test(source)) {
    const res = await fetch(source, { signal: AbortSignal.timeout(timeoutMs), headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`${source} answered ${res.status}`);
    return res.json();
  }
  return JSON.parse(readFileSync(source, 'utf8'));
}

/**
 * The catalogue from `source` (URL or path), else from the bundled snapshot.
 * Returns { data, origin, fallbackReason }.
 */
export async function loadRules({ source = DEFAULT_SOURCE, offline = false, timeoutMs = 8000 } = {}) {
  let fallbackReason = offline ? 'offline requested' : null;
  if (!offline) {
    try {
      const data = await readSource(source, timeoutMs);
      const problems = validateCatalogue(data);
      if (problems.length === 0) return { data, origin: source, fallbackReason: null };
      fallbackReason = `${source} is not a catalogue this script understands (${problems[0]})`;
    } catch (err) {
      fallbackReason = `${source}: ${err.message}`;
    }
  }
  const data = JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf8'));
  return { data, origin: 'bundled snapshot', fallbackReason };
}

/** Rules matching an id (VOI-001), a domain (void / VOI) or an error code (INVOICE_ALREADY_VOIDED). */
export function select(data, query) {
  const q = query.trim();
  const up = q.toUpperCase();
  if (/^[A-Z]{3}-\d{3}$/.test(up)) {
    return { kind: 'id', rules: data.rules.filter((r) => r.id === up) };
  }
  const domain = data.domains.find((d) => d.slug === q.toLowerCase() || d.prefix === up);
  if (domain) return { kind: 'domain', domain, rules: domain.rules.map((id) => data.rules.find((r) => r.id === id)) };
  return { kind: 'error_code', rules: data.rules.filter((r) => r.error_codes.some((c) => c.code === up)) };
}

const fence = (lang, code) => {
  const ticks = code.includes('```') ? '````' : '```';
  return `${ticks}${lang ?? ''}\n${code}\n${ticks}`;
};

function appliesTo(rule) {
  const a = rule.applies_to ?? {};
  const parts = [];
  const codes = (xs) => xs.map((x) => `\`${x}\``).join(', ');
  if (a.invoice_types?.length) parts.push(`invoice types ${codes(a.invoice_types)}`);
  if (a.statuses?.length) parts.push(`statuses ${codes(a.statuses)}`);
  if (a.operations?.length) parts.push(`operations ${codes(a.operations)}`);
  if (a.scope) parts.push(a.scope);
  return parts.join('; ');
}

function decisionLines(rule) {
  const out = [];
  for (const d of rule.decision) {
    if (d.when && d.then) out.push(`- *${d.when}* → ${d.then}`);
    else if (d.action && d.allowed) {
      let refused = '';
      if (typeof d.refused_with === 'string') refused = `; otherwise refused with \`${d.refused_with}\``;
      else if (d.refused_with && typeof d.refused_with === 'object') {
        const specific = Object.entries(d.refused_with).filter(([k]) => k !== '*');
        refused = `; otherwise refused with \`${d.refused_with['*']}\``;
        if (specific.length) refused += ` (${specific.map(([s, c]) => `\`${s}\`: \`${c}\``).join(', ')})`;
      }
      out.push(`- ${d.action}: allowed in ${d.allowed.map((s) => `\`${s}\``).join(', ')}${refused}`);
    }
  }
  return out;
}

/** One rule in full, as Markdown. Legal quotes are not reproduced: the rule's page carries them verbatim. */
export function ruleMarkdown(rule, { heading = 2 } = {}) {
  const h = '#'.repeat(heading);
  const out = [
    `${h} ${rule.id}`,
    '',
    `**${rule.title}**`,
    '',
    `\`${SEVERITY_LABEL[rule.severity]}\` · ${KIND_LABEL[rule.kind]} · Impact: ${rule.impact} · Checked by: ${ENFORCED_LABEL[rule.enforced_by]}. ${enforcementSentence(rule)}`,
    '',
    rule.statement,
    '',
    `**Why:** ${rule.why}`,
    '',
  ];
  const applies = appliesTo(rule);
  if (applies) out.push(`**Applies to:** ${applies}`, '');
  if (rule.error_codes.length) out.push(`**Error codes:** ${rule.error_codes.map((c) => `[\`${c.code}\`](${c.url})`).join(', ')}`, '');
  const decisions = decisionLines(rule);
  if (decisions.length) out.push('**Decides:**', '', ...decisions, '');
  if (rule.legal_basis.length) {
    out.push('**Legal basis:**', '');
    for (const b of rule.legal_basis) out.push(`- ${b.norm}, ${b.article} — ${b.url}`);
    out.push('');
  }
  for (const [label, key] of [['Incorrect', 'incorrect'], ['Correct', 'correct']]) {
    const ex = rule.examples?.[key];
    if (!ex) continue;
    out.push(`**${label}:** ${ex.text}`, '');
    if (ex.code) out.push(fence(ex.lang, ex.code), '');
  }
  if (rule.related.length) out.push(`**Related:** ${rule.related.join(', ')}`, '');
  if (rule.docs.length) out.push(`**Explained in:** ${rule.docs.join(' · ')}`, '');
  out.push(`**Full rule, with the legal text quoted:** ${rule.markdown}`);
  return out.join('\n');
}

/** One-line summary: `VOI-001 MUST — title` (+ `†` when the integrator or the issuer owns it). */
export function ruleLine(rule) {
  return `- ${rule.id} \`${SEVERITY_LABEL[rule.severity]}\`${isYours(rule) ? ' †' : ''} — ${rule.title}`;
}

export const GENERATED_NOTE =
  '<!-- Generated by scripts/build-rules-skill.mjs from the BeeL. rules catalogue (/api/rules.json). Do not edit by hand. -->';

/** reference/<slug>.md for one domain. Adds a table of contents when the file runs long. */
export function domainReference(data, domain) {
  const rules = domain.rules.map((id) => data.rules.find((r) => r.id === id));
  const body = rules.map((r) => ruleMarkdown(r, { heading: 2 })).join('\n\n---\n\n');
  const head = [
    GENERATED_NOTE,
    '',
    `# ${domain.title} (${domain.prefix})`,
    '',
    domain.description,
    '',
    `Rules page: ${domain.url}`,
    '',
    '"Checked by: Your integration" or "The issuing business" means BeeL. does not enforce the rule, beyond any error codes it lists: the integration has to.',
    '',
  ];
  const lineCount = head.length + body.split('\n').length;
  if (lineCount > 100) {
    head.push('## Contents', '', ...rules.map((r) => `- [${r.id}](#${r.id.toLowerCase()}) — ${r.title}`), '');
  }
  return `${head.join('\n')}\n${body}\n`;
}

/** The index block for SKILL.md: one line per rule, grouped by domain. */
export function indexBlock(data) {
  const out = [];
  for (const d of data.domains) {
    out.push(`**${d.title}** · [reference/${d.slug}.md](reference/${d.slug}.md)`);
    for (const id of d.rules) out.push(ruleLine(data.rules.find((r) => r.id === id)));
    out.push('');
  }
  return out.join('\n').trimEnd();
}

/** The void-or-correct rows, in catalogue order, each with the rule that decides it. */
export function decisionBlock(data, table = 'void-or-correct') {
  const out = [];
  for (const r of data.rules) {
    for (const d of r.decision) {
      if (d.table === table && d.when && d.then) out.push(`- ${d.when} → **${d.then}** (${r.id})`);
    }
  }
  return out.join('\n');
}
