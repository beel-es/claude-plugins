---
name: implement
description: >
  Guided implementation of a BeeL API integration: client setup, environment
  configuration, and specific flows (create/issue invoices, customers,
  products, recurring invoices, exports). Use when asked to integrate BeeL,
  add invoicing to a project, or implement a specific BeeL flow.
argument-hint: "[flow to implement, e.g. 'create and issue invoices']"
---

# Implement a BeeL Integration

Build a correct BeeL API integration in the current project. Correct means: typed where possible, idempotent, retry-safe, envelope-aware, and validated against the **live** API reference — never against remembered schemas. The golden rules in the `beel-api` skill apply throughout.

## Procedure

### 1. Detect the stack and choose the integration path

Inspect the project (`package.json`, `pyproject.toml`/`requirements.txt`, `go.mod`, …):

| Stack | Path |
|-------|------|
| Node.js / TypeScript | **Official SDK** `@beel_es/sdk` — fetch the live SDK docs (find via `curl -s https://docs.beel.es/llms.txt \| grep -i sdk`) for the current API surface before writing SDK code |
| Python | Typed client generated from the OpenAPI spec — see `../beel-api/recipes/typed-client.md` |
| Anything else | Raw HTTP following the invariants in the `beel-api` skill |

If an integration already partially exists, extend it in its style rather than introducing a second client.

### 2. Scope the flows

If the user named a flow (e.g. "invoice my Stripe payments", "monthly recurring invoices"), implement that. If not, ask which flows they need rather than guessing — typical ones:

- Create + issue invoices (the core flow — see `../beel-api/recipes/invoice-flow.md`)
- Customer / product management or import (CSV, Holded)
- Recurring invoices
- Mark paid / send by email / PDF download
- Exports (Excel, bulk PDF)
- Webhook-driven reactions → hand off to `/beel-api:webhooks`

### 3. Fetch the live reference for each flow

For every endpoint you are about to call, fetch its doc page (discover via `https://docs.beel.es/llms.txt`) or its OpenAPI definition. Field names, required fields and enums must come from the live spec — never invented.

### 4. Environment setup

- API key in `BEEL_API_KEY` env var; add to `.env.example` (placeholder only), never to committed files
- Start against **sandbox** (`beel_sk_test_`); make the production switch a deployment concern, not a code change
- Base URL is always `https://app.beel.es/api/v1` — the key prefix selects the environment, there is no separate test URL

### 5. Implement with the invariants baked in

- `Authorization: Bearer <key>` auth; `Idempotency-Key` on every POST/PUT (SDK does this automatically) — generated once per logical operation, reused on retry
- Parse the `{success, data, error}` envelope; surface `error.code` and `error.details`
- Handle 429 with `Retry-After` + backoff (SDK does this automatically); don't retry other 4xx
- Paginate to `meta.total_pages` on list endpoints
- Respect the invoice lifecycle: validate before issuing (draft PDF preview exists for this); corrective invoices for anything already issued
- Prefer bulk endpoints when the flow processes many resources

### 6. Verify

If a `beel_sk_test_` key is available in the environment, exercise the implemented flow against the sandbox (create a draft, preview, issue if appropriate) and show the result. If no key is available, finish with exact instructions: where to get the key (Settings > API Keys in the BeeL dashboard) and the one command to run the flow.

## Quality bar

Match the project's existing conventions (error handling style, HTTP layer, config loading). The integration should pass `/beel-api:audit` with zero CRITICAL/HIGH findings — run it mentally against the audit checklist before declaring done.
