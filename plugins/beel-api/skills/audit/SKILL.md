---
name: audit
description: >
  Audits a codebase's BeeL. API integration: API key security, idempotency,
  error handling, rate limits, webhook verification, deprecated routes and
  headers, and the fiscal rules catalogue (lifecycle, voiding, corrective
  invoices, numbering, QR…), reporting findings with rule IDs, severity and
  fixes. Use when asked to audit, review or check a BeeL. integration, or to
  verify it follows BeeL./VeriFactu rules.
argument-hint: "[path to audit, defaults to whole project]"
---

# BeeL Integration Audit

Audit the project's BeeL API integration code against the current rules and report findings with severity and proposed fixes. **This is a report-only skill — do not modify code unless the user explicitly asks for fixes afterwards.**

## Procedure

### 1. Refresh the rules from live docs

The checklist in `checklist.md` (this folder) encodes the stable rules, but limits and details drift. Before auditing, fetch what's relevant to the code you find (every page has a Markdown twin at `<url>.md`; the index is `https://docs.beel.es/llms.txt`):

- `https://docs.beel.es/guides/idempotency.md`: header name, which responses are replayed
- `https://docs.beel.es/guides/rate-limits.md`: current limits and headers
- `https://docs.beel.es/webhooks/signatures.md`, `/webhooks/retries.md`, `/webhooks/deduplication.md`: only if the project receives webhooks
- The OpenAPI spec (`https://docs.beel.es/api/openapi`): to confirm the endpoints the project calls still exist
- The fiscal rules: the `beel-api:rules` skill, or `https://docs.beel.es/api/rules.json`

### 2. Locate the integration surface

Search the project for BeeL touchpoints (case-insensitive where sensible):

```
app.beel.es            # raw HTTP calls
@beel_es/sdk           # official SDK usage
Idempotency-Key        # manual idempotency (also matches legacy X- prefix)
BEEL_API_KEY           # env var convention
beel_sk_               # key prefix: hardcoded literals (instant CRITICAL) or auth code
X-API-Key              # not a BeeL. header — a call sending it is unauthenticated, see checklist 2
BeeL-Active-Company    # only the deprecated flat routes read it, see checklist 8
/v1/invoices /v1/customers /v1/products /v1/configuration /v1/webhooks   # deprecated flat routes
BeeL-Signature / BeeL-Event-Id  # webhook handling
/void /corrective /issue  # fiscal operations: the rules catalogue applies, see checklist 9
```

Map every file that calls the API, handles its responses, or receives its webhooks. If nothing is found, say so and stop — don't invent findings.

### 3. Run the checklist

Work through `checklist.md` category by category against the located code. For each check, record: **pass / fail / not applicable**, with `file:line` evidence for failures. Where a check maps to a fiscal rule, cite the rule ID (`LIF-001`, `VOI-001`…).

Section 9 of the checklist runs the fiscal rules catalogue: list the domains the code touches and, with the `beel-api:rules` skill (`node scripts/lookup.mjs --yours <domain>` from its directory), check every rule BeeL. does not enforce. Re-run the failed checks after any fix until they pass or are reported.

### 4. Report

Output a structured report:

1. **Summary** — one paragraph: overall state, count of findings by severity
2. **Findings** — ordered by severity (CRITICAL → HIGH → MEDIUM → LOW), each with:
   - What is wrong and where (`file:line`), and the rule ID when a fiscal rule decides it
   - Why it matters (consequence: duplicate invoices, leaked key, rejected webhook…)
   - The concrete fix (code-level, ready to apply)
3. **Passed checks** — brief list, so the user knows what was verified, not just what failed
4. **Not applicable** — e.g. "no webhook receiver found, webhook checks skipped"

Severity guide:

| Severity | Meaning |
|----------|---------|
| CRITICAL | Legal/financial/security risk: hardcoded live key, mutating issued invoices (LIF-001), voiding real sales (VOI-001), unverified webhooks accepted |
| HIGH | Will cause production incidents: missing idempotency, key regenerated per retry, no 429 handling |
| MEDIUM | Incorrect but survivable: envelope ignored, partial pagination, deprecated routes or headers |
| LOW | Improvement: raw fetch where the official SDK fits, missing replay detection |

Close by offering to apply the fixes — but only apply them if the user accepts.
