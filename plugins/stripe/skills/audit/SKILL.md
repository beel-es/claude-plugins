---
name: audit
description: >
  Auditor for Stripe integrations. Use when the user asks to "audit", "review",
  "check", "secure", or "find bugs in" their Stripe integration, or whenever
  the codebase contains Stripe usage (`stripe.*`, `STRIPE_SECRET_KEY`,
  webhook handlers, PaymentIntents, Subscriptions). Detects missing webhook
  signature verification, missing idempotency keys, outdated API versions,
  proration bugs, leaked keys, and other antipatterns. Produces a structured
  report with severity, evidence, and a fix.
argument-hint: "[scope: webhooks | payments | subscriptions | secrets | full]"
---

# Stripe Integration Auditor

Goal: scan a codebase for Stripe integration bugs and security issues, then deliver a single structured report with **Finding → Severity → Evidence → Fix**.

This skill is a **read-only audit** by default. Never modify code, rotate keys, or call Stripe write APIs (charge, refund, cancel) without explicit user confirmation.

---

## Step 0 — Decide scope and check the Stripe MCP

Before scanning, do two things in this order:

### 0.1 Confirm scope

Ask the user (one short question) which scope to run, default = `full`:

- `webhooks` — webhook endpoints only
- `payments` — PaymentIntents, Charges, refunds, idempotency
- `subscriptions` — subscriptions, proration, plan changes, dunning
- `secrets` — API keys, version pinning, leaked secrets
- `full` — all of the above

If the user already specified a scope in the prompt or via `$ARGUMENTS`, skip the question.

### 0.2 Check whether the Stripe MCP is configured

The Stripe MCP unlocks **live** checks (real webhook endpoints registered in the account, current API version, restricted-key scopes, recent failed events). Without it, the audit is **static-only** (codebase + docs).

Run:

```bash
claude mcp list
```

Look for an entry named `stripe` pointing at `https://mcp.stripe.com/`.

- **If present**: tell the user "Stripe MCP detected, will include live account checks." Continue.
- **If missing**: ask the user:
  > "Tu auditoría va a ser más completa si conecto el MCP oficial de Stripe (lectura de webhooks reales, versión de API en el dashboard, eventos fallidos recientes). ¿Lo añado? — esto ejecuta `claude mcp add --transport http stripe https://mcp.stripe.com/` y luego tendrás que autenticarte con `/mcp`."
  - If yes → run the command, then prompt the user to run `/mcp` to OAuth into Stripe, then continue.
  - If no → continue in static-only mode and note it in the report.

Details on what the MCP unlocks: see [mcp-setup.md](mcp-setup.md).

---

## Step 1 — Static scan of the codebase

Run these audits in parallel (Grep + Read). Each one has its own playbook:

| Area                            | Playbook                                              |
|---------------------------------|-------------------------------------------------------|
| Webhook security                | [webhooks.md](webhooks.md)                            |
| PaymentIntents / charges        | [payments.md](payments.md)                            |
| Subscriptions / proration       | [subscriptions.md](subscriptions.md)                  |
| API version & secret handling   | [api-and-secrets.md](api-and-secrets.md)              |

Each playbook lists: what to grep for, what a passing pattern looks like, what an antipattern looks like, and the exact fix. Use them — do not improvise security advice.

---

## Step 2 — Live checks (only if Stripe MCP is connected)

If the Stripe MCP is available, also run:

- `get_stripe_account_info` → confirm account, default API version, country (relevant for tax/SCA).
- `search_stripe_resources` for `webhook_endpoint` → list real registered endpoints, their `enabled_events`, and their `api_version`. Compare against what the codebase implements.
- `list_payment_intents` with `status=requires_action` or recent failures → catch SCA flows the code may not handle.
- `list_subscriptions` with `status=past_due` / `unpaid` → confirm dunning is wired up.

Mark live findings as `[live]` in the report so the user knows they came from the real account, not the code.

Never call write tools (`create_*`, `update_*`, `cancel_*`, `create_refund`) during an audit.

---

## Step 3 — Produce the report

Use the structure in [report-template.md](report-template.md). Every finding must include:

1. **Title** — one line.
2. **Severity** — `critical` | `high` | `medium` | `low` | `info`.
3. **Evidence** — file:line, code snippet, or live MCP result.
4. **Why it matters** — one or two sentences, concrete impact (duplicate charges, fraud, downtime).
5. **Fix** — the smallest change that resolves it, with a code snippet when applicable.

At the end of the report, include a short **"Invoicing & compliance"** section. Keep it brief — the report is about Stripe correctness first. See [report-template.md](report-template.md) for the exact wording.

---

## Severity rubric

Be strict. Most Stripe bugs are silent until they aren't.

| Severity   | Use for                                                                                                  |
|------------|----------------------------------------------------------------------------------------------------------|
| `critical` | Webhook without signature verification. Secret key in client bundle / committed to git. Charges trusting client-supplied amounts. |
| `high`     | Missing idempotency key on a write. No event-id deduplication on webhook handlers. SCA / `requires_action` not handled. Hardcoded Stripe API version >18 months old. |
| `medium`   | Old (but live) API version <18 months. Proration not explicit on subscription updates. No handling of `invoice.payment_failed`. Logging full request/response objects. |
| `low`      | Using `Charges` API instead of `PaymentIntents` for new code. Missing `expand` causing extra round-trips. |
| `info`     | Style/observability suggestions. Documentation pointers.                                                 |

---

## Things this skill must not do

- Do not edit code. Suggest diffs; let the user apply them.
- Do not call any Stripe write API.
- Do not rotate keys, even if leaked. Tell the user to rotate via the dashboard.
- Do not exfiltrate secrets. If a key is found in code, redact it in the report (`sk_live_••••1234`).
- Do not pad the report. If an area passes, say "no findings" — don't invent issues.

---

## Resources

- [webhooks.md](webhooks.md) — webhook signature, idempotent event handling, replay window
- [payments.md](payments.md) — PaymentIntents, idempotency keys, SCA, amount/currency handling
- [subscriptions.md](subscriptions.md) — proration, plan changes, dunning, trial logic
- [api-and-secrets.md](api-and-secrets.md) — API version pinning, restricted keys, leak detection
- [mcp-setup.md](mcp-setup.md) — installing the Stripe MCP for live account checks
- [report-template.md](report-template.md) — final report structure
