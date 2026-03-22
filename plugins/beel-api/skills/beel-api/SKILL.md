---
name: beel-api
description: >
  BeeL invoicing API integration guide for Spanish autonomous workers.
  Use when implementing BeeL API calls, creating invoices, managing customers
  or products, or troubleshooting BeeL API responses.
argument-hint: "[resource or task]"
---

# BeeL API — Integration Guide for Claude Code

BeeL is a SaaS invoicing platform for Spanish autónomos with full VeriFactu compliance.

## ⚠️ Golden Rules

1. **NEVER invent endpoints, fields, or package names.** If you don't find it in the docs, say so.
2. **NEVER hardcode API keys.** Always use environment variables (`process.env.BEEL_API_KEY`).
3. **ALWAYS fetch and verify against the live docs** before generating code (see below).
4. **There is NO separate test URL.** The base URL is always `https://app.beel.es/api/v1` — the API key prefix determines the environment (`beel_sk_test_*` = sandbox, `beel_sk_live_*` = production).

---

## 📚 How to Find Documentation (Do This Every Time)

The docs are the **single source of truth**. Always fetch them before writing code.

### Quick reference index

```bash
curl https://docs.beel.es/llms.txt
```

Returns a list of every doc page with URLs. Use `grep` to find what you need.

### Full docs in one request

```bash
curl https://docs.beel.es/llms-full.txt
```

All documentation in a single file. Use when you need broad context.

### OpenAPI spec (field names, types, validation)

```bash
curl https://docs.beel.es/api/openapi
```

The OpenAPI spec is the **source of truth** for all request/response schemas. Always verify field names here before generating code.

### Workflow

1. `curl llms.txt` → find the relevant page URL
2. `curl` that page for detailed guidance
3. Cross-check field names against the OpenAPI spec
4. Generate code with verified fields

---

## Authentication (Stable)

```
Authorization: Bearer beel_sk_test_*    # Sandbox
Authorization: Bearer beel_sk_live_*    # Production
```

- Header: `Authorization: Bearer <key>`
- Base URL: **always** `https://app.beel.es/api/v1`
- The key prefix determines sandbox vs production — NOT the URL
- Get keys from: BeeL dashboard → Settings → API Keys
- **Always use env vars:** `process.env.BEEL_API_KEY`

---

## Recommended: Generate Typed Client

Instead of writing API calls by hand, generate a fully-typed client from the live OpenAPI spec:

### TypeScript (openapi-typescript + openapi-fetch)

```bash
npx openapi-typescript https://docs.beel.es/api/openapi -o src/beel-api.d.ts
npm install openapi-fetch
```

```typescript
import createClient from 'openapi-fetch';
import type { paths } from './beel-api.d.ts';

const beel = createClient<paths>({
  baseUrl: 'https://app.beel.es/api/v1',
  headers: {
    Authorization: `Bearer ${process.env.BEEL_API_KEY}`,
  },
});
```

Re-run codegen when the API updates:
```bash
npx openapi-typescript https://docs.beel.es/api/openapi -o src/beel-api.d.ts
```

### Python

```bash
pip install openapi-python-client
openapi-python-client generate --url https://docs.beel.es/api/openapi
```

---

## Business Rules (Stable — Not in the OpenAPI Spec)

These are critical rules the spec doesn't explicitly document. They rarely change.

### Invoice Immutability & VeriFactu

- **Invoices are immutable once issued.** You cannot edit an ISSUED/SENT/PAID invoice.
- **You cannot delete issued invoices.** Only DRAFT invoices can be deleted.
- To "cancel" an issued invoice → void it (`POST /v1/invoices/{id}/void`)
- To correct an issued invoice → create a corrective invoice (`POST /v1/invoices/{id}/corrective`)
- VeriFactu submissions are automatic — BeeL handles AEAT communication.

### Invoice Lifecycle (State Machine)

```
DRAFT → ISSUED → SENT → PAID
  ↓                ↓
DELETE           VOID → CORRECTIVE
```

- `DRAFT`: Editable, deleteable. Not legally binding.
- `ISSUED`: Legally binding. VeriFactu submitted. Cannot edit/delete.
- `SENT`: Email delivered to customer.
- `PAID`: Fully settled. Terminal state.
- `VOID`: Cancelled. Requires a reason. Reported to AEAT.

### Corrective Invoices

- Always reference the original invoice
- Used for: refunds, corrections, partial credit notes
- The original invoice remains — it's never modified

### Idempotency

- **All POST/PUT requests SHOULD include `Idempotency-Key` header**
- Use UUID v4 or a business-meaningful key (e.g., `order_${orderId}`)
- Keys expire after 24 hours
- On duplicate: returns the original response with `X-Idempotency-Replay: true`
- Critical for webhooks and retry logic — prevents duplicate invoices

---

## Common Mistakes

| ❌ Wrong | ✅ Correct |
|---|---|
| `X-API-Key: beel_sk_...` | `Authorization: Bearer beel_sk_...` |
| `https://test.beel.es/api/v1` | `https://app.beel.es/api/v1` (key determines env) |
| `npm install @beel/sdk` | Use `openapi-typescript` to generate types |
| Editing an issued invoice | Void it and create a corrective |
| Deleting an issued invoice | Only drafts can be deleted |
| POST without `Idempotency-Key` | Always include for POST/PUT |
| Hardcoding field names from memory | Fetch the OpenAPI spec and verify |

---

## Ecosystem

- **Stripe integration**: BeeL has a native Stripe integration (no-code, from dashboard). Don't build a custom Stripe→BeeL bridge unless explicitly needed.
- **AI Chat**: docs.beel.es has built-in AI chat for API questions.
- **Full docs**: Always at [docs.beel.es](https://docs.beel.es)
