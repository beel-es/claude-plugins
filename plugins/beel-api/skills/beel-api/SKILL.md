---
name: beel-api
description: >
  BeeL. invoicing API integration guide: golden rules, authentication, the
  company-scoped routes, idempotency and where to look things up in the live
  docs, plus recipes. Use when working with the BeeL. API, creating invoices,
  managing customers or products, implementing webhooks, or troubleshooting
  BeeL. API responses.
argument-hint: "[resource or task]"
---

# BeeL. API — Integration Guide

BeeL. is an invoicing API for businesses in Spain with VeriFactu built in: it issues, numbers and sends invoices, and registers each one with the tax agency (AEAT).

## Golden rules

1. **Never invent endpoints, fields or package names.** Verify against the live docs first: see "How to look up documentation" below.
2. **Never hardcode or log API keys.** Read the key from the environment (`BEEL_API_KEY`), and never call the API from a browser.
3. **There is no separate test URL.** The base URL is always `https://app.beel.es/api`, and every path starts with `/v1/`. The key selects the environment: `beel_sk_test_*` is the sandbox, `beel_sk_live_*` issues real invoices. Develop and test with a test key (LIF-003).
4. **The company goes in the path.** Invoices, customers, products, series and settings live under `/v1/companies/{company_id}/…`; what belongs to the account (its companies, members, webhooks) lives under `/v1/accounts/{account_id}/…`. Do not send a `BeeL-Active-Company` header: the path is the only source of context and the header plays no part in it. The older flat routes (`/v1/invoices`, `/v1/customers`, …) are deprecated and stop answering on the date in their `Sunset` response header, so never write new code against them. `/beel-api:upgrade` migrates code that still uses them.
5. **`Idempotency-Key` on every write that creates, issues, corrects or voids**, generated once per operation and reused on every retry (LIF-004). See "Idempotency" below.
6. **An issued invoice is never edited or deleted (LIF-001).** Wrong data on an issued invoice → a corrective invoice (COR-001). An invoice that should never have been issued → void it (VOI-001). The number is assigned on issue and never reused (NUM-001, NUM-002).
7. **Some fiscal rules are yours, not BeeL.'s.** Rules enforced by the integrator or the issuing business are not checked by the API. Use `/beel-api:rules` whenever code issues, corrects, voids or renders invoices, and cite rule IDs in reviews.
8. **When in doubt, look it up** (see below).

## Idempotency

- Send `Idempotency-Key` (exactly that name; `X-Idempotency-Key` is silently ignored) on every `POST`. Some `PUT`, `PATCH` and `DELETE` operations honour it too: rely on it there only where the operation's reference lists the header. It is required on the bulk imports.
- A `2xx` **and a `5xx`** are stored and replayed with `Idempotency-Replay: true`. A `4xx` is not stored: it frees the key.
- So a retry after a network error reuses the key. After a `5xx`, check whether the operation happened, then retry with a **new** key.
- `409 IDEMPOTENCY_KEY_PROCESSING`: the first request is still in flight, so wait and retry with the same key. `409 IDEMPOTENCY_KEY_MISMATCH`: the key was used with a different body or path, so use a new one.
- An idempotency key identifies a request, not a business object. For "one invoice per order", use `external_ref`.

Lifetime, scope and format limits: [guides/idempotency](https://docs.beel.es/guides/idempotency.md).

## How to look up documentation

**Preferred: the BeeL. CLI `docs search`, proposed to the user first.** Don't silently pull whole files into context. Suggest the command and wait for the go-ahead:

> "I need to confirm the exact fields for creating an invoice. Want me to run `npx @beel_es/cli docs search create invoice`? It searches the docs locally and returns only the matching sections. No API key needed."

```bash
npx @beel_es/cli docs search create invoice    # only the matching sections, as markdown
npx @beel_es/cli docs list                      # every page (JSON), to discover what exists
npx @beel_es/cli docs get glossary              # one full page by title
```

See [recipes/cli.md](recipes/cli.md).

**Over HTTP**, lightest first:

| Need | Fetch |
|---|---|
| Where things are, plus instructions for agents and the critical rules | `https://docs.beel.es/llms.txt`: one line per page and per rule |
| Any page, as Markdown | Its URL plus `.md`, e.g. `https://docs.beel.es/guides/idempotency.md` |
| One operation | `https://docs.beel.es/api-reference/llms.txt` lists them all, e.g. `https://docs.beel.es/invoices/createCompanyInvoice.md` |
| One error code | `https://docs.beel.es/errors/<CODE>`, index at `https://docs.beel.es/errors/llms.txt` |
| What changed | `https://docs.beel.es/changelog/llms.txt`, or `https://docs.beel.es/api/changelog` as JSON |
| A fiscal rule | `https://docs.beel.es/rules/<ID>.md`, or `/beel-api:rules` |
| One area in full | `https://docs.beel.es/<area>/llms-full.txt`, where the area is `get-started`, `multi-nif`, `verifactu`, `rules`, `stripe`, `api-reference`, `changelog` or `errors` |
| The contract | `https://docs.beel.es/api/openapi` |

```bash
curl -s https://docs.beel.es/llms.txt | grep -i "invoice\|customer"
```

`https://docs.beel.es/llms-full.txt` holds every page at once. Reach for it last, when an area file is not enough.

## Authentication

```
Authorization: Bearer beel_sk_test_*    # Sandbox
Authorization: Bearer beel_sk_live_*    # Production
```

## Recipes

Load these when needed:

- **[recipes/typed-client.md](recipes/typed-client.md)**: the official SDK (`@beel_es/sdk`), or a typed client generated from the OpenAPI spec (TypeScript, Python)
- **[recipes/invoice-flow.md](recipes/invoice-flow.md)**: create → issue → send → pay, correcting and voiding
- **[recipes/webhook-handler.md](recipes/webhook-handler.md)**: a webhook receiver with signature verification and deduplication
- **[recipes/fiscal-context.md](recipes/fiscal-context.md)**: Spanish tax concepts for developers new to them
- **[recipes/debugging.md](recipes/debugging.md)**: common errors, causes and fixes
- **[recipes/cli.md](recipes/cli.md)**: `npx @beel_es/cli` to search the docs and run real calls (sandbox by default)
- **[recipes/agents-md.md](recipes/agents-md.md)**: add BeeL.'s critical-rules block to a project's `AGENTS.md` or `CLAUDE.md`

## Companion skills

- `/beel-api:rules`: the fiscal rules catalogue, by rule ID, with a lookup script
- `/beel-api:implement`: guided implementation of a new integration
- `/beel-api:audit`: audit existing integration code against these rules and the catalogue
- `/beel-api:webhooks`: build a correct webhook receiver end to end
- `/beel-api:upgrade`: check an integration against the changelog and the live contract
- `/beel-api:multi-nif`: integrate the multi-NIF model (many companies per account, managed accounts)
