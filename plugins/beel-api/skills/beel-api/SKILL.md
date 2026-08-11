---
name: beel-api
description: >
  BeeL invoicing API integration guide. Use when working with the BeeL API,
  creating invoices, managing customers or products, implementing webhooks,
  or troubleshooting BeeL API responses.
argument-hint: "[resource or task]"
---

# BeeL API — Integration Guide

BeeL is a SaaS invoicing platform for Spanish autónomos with full VeriFactu compliance.

## ⚠️ Golden Rules

1. **NEVER invent endpoints, fields, or package names.** Always verify against the live docs first — see "How to Look Up Documentation" below for the token-efficient way to do it.
2. **NEVER hardcode API keys.** Always use environment variables (`process.env.BEEL_API_KEY`).
3. **There is NO separate test URL.** Base URL is always `https://app.beel.es/api`, and every path starts with `/v1/`. The key prefix determines the environment: `beel_sk_test_*` = sandbox, `beel_sk_live_*` = production.
4. **Company-scoped paths are the canonical form.** Build new code against `/v1/companies/{company_id}/…` (invoices, customers, products, series, tax and VeriFactu settings). The flat routes (`/v1/invoices`, `/v1/customers`, `/v1/products`, `/v1/configuration/*` and their sub-paths like `/issue` and `/void`) are `deprecated: true`, each carrying an `x-successor`; they keep working until the date in their `Sunset` response header.
5. **Send `BeeL-Active-Company`** (the `company_id`) on any request touching company-owned data. Optional on an account with a single NIF, required on an account with several — otherwise `403 ACTIVE_COMPANY_REQUIRED`. See `/beel-api:multi-nif`.
6. **`Idempotency-Key` on POST/PUT.** Optional in general, required on bulk imports. See [recipes/invoice-flow.md](recipes/invoice-flow.md).
7. **Issued invoices are immutable.** To correct → corrective invoice. To cancel → void it.
8. **When in doubt, look up the docs** (see below).

## 📚 How to Look Up Documentation

**Preferred: the BeeL CLI `docs search` — and propose it to the user first.**

When you need to check the docs, don't silently fetch the whole `llms.txt` / `llms-full.txt` (that burns tokens and pulls in ~600KB you don't need). Instead, **suggest running the CLI and wait for the user's go-ahead**, e.g.:

> "I need to confirm the exact fields for creating an invoice. Want me to run `npx @beel_es/cli docs search create invoice`? It searches the docs locally and returns only the matching ~2KB section — no API key needed."

Once confirmed, run it:

```bash
npx @beel_es/cli docs search create invoice    # only the matching sections (markdown, ~2KB)
npx @beel_es/cli docs search idempotency key
npx @beel_es/cli docs list                      # all pages (JSON), to discover what exists
npx @beel_es/cli docs get glossary              # one full page by title
```

`docs search` downloads `llms-full.txt` once (cached 15 min in tmpdir) and filters locally, so search terms never leave the machine and you only pay for the slice you need. See [recipes/cli.md](recipes/cli.md).

**Fallback (no Node / CLI unavailable):** fetch over HTTP, lightest first.

```bash
# Index (~31KB) — grep for the page you need
curl -s https://docs.beel.es/llms.txt | grep -i "invoice\|customer"
# Specific page (found via the index)
curl -s https://docs.beel.es/invoices/createInvoice.mdx
# Full docs (~641KB) or OpenAPI spec (~330KB) — only when you need broad context
curl -s https://docs.beel.es/llms-full.txt
curl -s https://docs.beel.es/api/openapi
```

## 🔐 Authentication

```
Authorization: Bearer beel_sk_test_*    # Sandbox
Authorization: Bearer beel_sk_live_*    # Production
```

Base URL: **always** `https://app.beel.es/api` — the key determines the environment, not the URL. Paths start with `/v1/`.

## 📖 Additional Resources

For detailed recipes and patterns, load these files when needed:

- **[recipes/typed-client.md](recipes/typed-client.md)** — Official SDK (`@beel_es/sdk`) or a generated typed client from the OpenAPI spec (TypeScript, Python)
- **[recipes/webhook-handler.md](recipes/webhook-handler.md)** — Complete webhook receiver with signature verification and deduplication
- **[recipes/invoice-flow.md](recipes/invoice-flow.md)** — End-to-end invoice lifecycle: create → issue → send → pay
- **[recipes/fiscal-context.md](recipes/fiscal-context.md)** — Spanish tax system concepts for non-Spanish developers
- **[recipes/debugging.md](recipes/debugging.md)** — Common errors, causes, and solutions
- **[recipes/cli.md](recipes/cli.md)** — `npx @beel_es/cli`: run real API calls (sandbox by default) to verify flows, inspect data, and debug — built for agent use

## 🛠 Companion Skills

For task-shaped work, this plugin ships dedicated skills:

- `/beel-api:implement` — guided implementation of a new BeeL integration
- `/beel-api:audit` — audit existing integration code against these rules
- `/beel-api:webhooks` — build a correct webhook receiver end to end
- `/beel-api:upgrade` — check an integration against the live API for drift
- `/beel-api:multi-nif` — integrate the multi-NIF model (many companies per account, `BeeL-Active-Company`, managed accounts)
