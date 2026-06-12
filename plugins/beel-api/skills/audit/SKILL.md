---
name: audit
description: >
  Audit a codebase's BeeL API integration for compliance: idempotency, API key
  security, error handling, rate limits, webhook verification, invoice
  lifecycle rules and outdated patterns. Use when asked to audit, review or
  check a BeeL integration, or to verify it follows BeeL/VeriFactu rules.
argument-hint: "[path to audit, defaults to whole project]"
---

# BeeL Integration Audit

Audit the project's BeeL API integration code against the current rules and report findings with severity and proposed fixes. **This is a report-only skill — do not modify code unless the user explicitly asks for fixes afterwards.**

## Procedure

### 1. Refresh the rules from live docs

The checklist in `checklist.md` (this folder) encodes the stable rules, but limits and details drift. Before auditing, fetch what's relevant to the code you find — discover pages via `curl -s https://docs.beel.es/llms.txt | grep -i <topic>`:

- The idempotency guide — current header name and rules
- The rate limits guide — current limits and headers
- The webhook signature/deduplication pages — only if the project receives webhooks
- The OpenAPI spec (`https://docs.beel.es/api/openapi`) — to confirm endpoints the project calls still exist

### 2. Locate the integration surface

Search the project for BeeL touchpoints (case-insensitive where sensible):

```
app.beel.es            # raw HTTP calls
@beel_es/sdk           # official SDK usage
Idempotency-Key        # manual idempotency (also matches legacy X- prefix)
BEEL_API_KEY           # env var convention
beel_sk_               # key prefix: hardcoded literals (instant CRITICAL) or auth code
X-API-Key              # LEGACY auth header — finding in itself, see checklist 8
BeeL-Signature / BeeL-Event-Id  # webhook handling
```

Map every file that calls the API, handles its responses, or receives its webhooks. If nothing is found, say so and stop — don't invent findings.

### 3. Run the checklist

Work through `checklist.md` category by category against the located code. For each check, record: **pass / fail / not applicable**, with `file:line` evidence for failures.

### 4. Report

Output a structured report:

1. **Summary** — one paragraph: overall state, count of findings by severity
2. **Findings** — ordered by severity (CRITICAL → HIGH → MEDIUM → LOW), each with:
   - What is wrong and where (`file:line`)
   - Why it matters (consequence: duplicate invoices, leaked key, rejected webhook…)
   - The concrete fix (code-level, ready to apply)
3. **Passed checks** — brief list, so the user knows what was verified, not just what failed
4. **Not applicable** — e.g. "no webhook receiver found, webhook checks skipped"

Severity guide:

| Severity | Meaning |
|----------|---------|
| CRITICAL | Legal/financial/security risk: hardcoded live key, mutating issued invoices, unverified webhooks accepted |
| HIGH | Will cause production incidents: missing idempotency, key regenerated per retry, no 429 handling |
| MEDIUM | Incorrect but survivable: envelope ignored, partial pagination, deprecated patterns |
| LOW | Improvement: raw fetch where the official SDK fits, missing replay detection |

Close by offering to apply the fixes — but only apply them if the user accepts.
