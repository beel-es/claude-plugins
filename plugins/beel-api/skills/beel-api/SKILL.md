---
name: beel-api
description: >
  BeeL invoicing API integration guide. Use when working with the BeeL API,
  creating invoices, managing customers or products, implementing webhooks,
  or troubleshooting BeeL API responses.
argument-hint: "[resource or task]"
---

# BeeL API — Integration Guide

BeeL. is an invoicing API for businesses in Spain with VeriFactu built in: it issues, numbers and sends invoices, and registers each one with the tax agency (AEAT).

## ⚠️ Golden Rules

1. **NEVER invent endpoints, fields, or package names.** Always verify against the live docs first — see "How to Look Up Documentation" below for the token-efficient way to do it.
2. **NEVER hardcode API keys.** Always use environment variables (`process.env.BEEL_API_KEY`), and never log them or call the API from a browser.
3. **There is NO separate test URL.** Base URL is always `https://app.beel.es/api`, and every path starts with `/v1/`. The key prefix determines the environment: `beel_sk_test_*` = sandbox, `beel_sk_live_*` = production. Develop and test with a test key only.
4. **The company goes in the path.** Build against `/v1/companies/{company_id}/…` (invoices, customers, products, series, tax and VeriFactu settings). The flat routes (`/v1/invoices`, `/v1/customers`, `/v1/products`, `/v1/configuration/*`…) are deprecated: they answer with `Deprecation` and `Sunset` headers and retire on **9 December 2026**. The `BeeL-Active-Company` header only exists for them; see `/beel-api:multi-nif` if you are migrating off them.
5. **`Idempotency-Key` on every write that creates, issues, corrects or voids** — generated once per logical operation and reused on every retry. `POST` always honours it; a `PUT`/`PATCH`/`DELETE` only where the API reference lists the header. See [recipes/invoice-flow.md](recipes/invoice-flow.md).
6. **Issued invoices are immutable.** To fix one → corrective invoice. Void only an invoice that should never have been issued.
7. **The fiscal rules decide.** The critical ones, and how to look up any rule by id or by error code, are in the `/beel-api:rules` skill ([../rules/SKILL.md](../rules/SKILL.md)). Cite the rule id when a rule drives a change.
8. **When in doubt, look up the docs** (see below).

## 📚 How to Look Up Documentation

**Preferred: the BeeL CLI `docs search` — and propose it to the user first.**

When you need to check the docs, don't silently fetch the whole `llms-full.txt`: it is large and you rarely need all of it. Instead, **suggest running the CLI and wait for the user's go-ahead**, e.g.:

> "I need to confirm the exact fields for creating an invoice. Want me to run `npx @beel_es/cli docs search create invoice`? It searches the docs locally and returns only the matching sections — no API key needed."

Once confirmed, run it:

```bash
npx @beel_es/cli docs search create invoice    # only the matching sections (markdown)
npx @beel_es/cli docs search idempotency key
npx @beel_es/cli docs list                      # all pages (JSON), to discover what exists
npx @beel_es/cli docs get glossary              # one full page by title
```

`docs search` downloads the machine-readable docs once (cached 15 min) and filters locally, so search terms never leave the machine and you only pay for the slice you need. See [recipes/cli.md](recipes/cli.md).

**Fallback (no Node / CLI unavailable):** fetch over HTTP, lightest first. Every page has a Markdown twin: add `.md` to its URL.

```bash
# The index: instructions for agents, one line per page and per rule
curl -s https://docs.beel.es/llms.txt | grep -i "invoice\|customer"
# One page, found via the index (child indexes: /api-reference/llms.txt, /errors/llms.txt, /changelog/llms.txt)
curl -s https://docs.beel.es/guides/idempotency.md
# One area in full, or the contract — only when you need broad context
curl -s https://docs.beel.es/verifactu/llms-full.txt
curl -s https://docs.beel.es/api/openapi
```

**Fiscal rules:** with the bundled MCP connected, `beel_rules_list` and `beel_rules_get` (also by `error_code`); otherwise `https://docs.beel.es/rules/<ID>.md` and `https://docs.beel.es/api/rules.json`. See `/beel-api:rules`.

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
- `/beel-api:multi-nif` — integrate the multi-NIF model (many companies per account, company-scoped paths, managed accounts)
- `/beel-api:rules` — the fiscal rules by id, the block to paste into `AGENTS.md` / `CLAUDE.md`, and how to look a rule up
