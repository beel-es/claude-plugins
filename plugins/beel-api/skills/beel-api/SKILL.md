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

1. **NEVER invent endpoints, fields, or package names.** Always verify against the live docs first. Use `curl https://docs.beel.es/llms.txt` to find the relevant page, then fetch that page to check exact endpoints and fields.
2. **NEVER hardcode API keys.** Always use environment variables (`process.env.BEEL_API_KEY`).
3. **There is NO separate test URL.** Base URL is always `https://app.beel.es/api/v1`. The key prefix determines the environment: `beel_sk_test_*` = sandbox, `beel_sk_live_*` = production.
4. **ALWAYS include `Idempotency-Key` header** on POST and PUT requests.
5. **Issued invoices are immutable.** To correct → corrective invoice. To cancel → void it.
6. **When in doubt, fetch the docs** (see below).

## 📚 Live Documentation

Always fetch live docs before generating integration code. These are the entry points:

```bash
# Index of all doc pages
curl https://docs.beel.es/llms.txt

# Full docs in one request
curl https://docs.beel.es/llms-full.txt

# OpenAPI spec — source of truth for schemas, fields, and validation
curl https://docs.beel.es/api/openapi
```

**Workflow:** `llms.txt` → find relevant page → fetch it → cross-check fields against OpenAPI spec.

## 🔐 Authentication

```
Authorization: Bearer beel_sk_test_*    # Sandbox
Authorization: Bearer beel_sk_live_*    # Production
```

Base URL: **always** `https://app.beel.es/api/v1` — the key determines the environment, not the URL.

## 📖 Additional Resources

For detailed recipes and patterns, load these files when needed:

- **[recipes/typed-client.md](recipes/typed-client.md)** — Generate a fully-typed API client from the OpenAPI spec (TypeScript, Python)
- **[recipes/webhook-handler.md](recipes/webhook-handler.md)** — Complete webhook receiver with signature verification and deduplication
- **[recipes/invoice-flow.md](recipes/invoice-flow.md)** — End-to-end invoice lifecycle: create → issue → send → pay
- **[recipes/fiscal-context.md](recipes/fiscal-context.md)** — Spanish tax system concepts for non-Spanish developers
- **[recipes/debugging.md](recipes/debugging.md)** — Common errors, causes, and solutions
