---
name: beel-api
description: >
  BeeL invoicing API integration guide for Spanish autonomous workers.
  Use when implementing BeeL API calls, creating invoices, managing customers
  or products, or troubleshooting BeeL API responses.
argument-hint: "[resource or task]"
---

# BeeL API Integration Guide

BeeL is a SaaS invoicing platform for Spanish autonomous workers (autónomos) with VeriFactu compliance. This guide covers everything needed to integrate the BeeL public API correctly.

## Integration Options

You have two ways to integrate with BeeL:

### Option 1: Node.js SDK (Recommended for Node.js/TypeScript)

**Use when:**
- You're building a Node.js or TypeScript project
- You want full type safety and IDE auto-completion
- Standard use cases covered by the API

**Features:**
- ✅ 100% auto-generated from OpenAPI spec (always in sync)
- ✅ Full TypeScript support with complete type definitions
- ✅ Tree-shakeable — only bundle what you use
- ✅ ESM and CommonJS support

**Quick start:**

```typescript
import { BeeL } from '@beel/sdk';

const client = new BeeL({
  apiKey: process.env.BEEL_API_KEY!,
});

// Create an invoice
const invoice = await client.invoices.create({
  type: 'STANDARD',
  issue_date: '2025-01-27',
  recipient: { recipient_type: 'EXISTING', customer_id: 'uuid' },
  lines: [{ description: 'Service', quantity: 1, unit_price: 100 }],
});

// List customers
const customers = await client.customers.list({ page: 1, pageSize: 20 });
```

**📖 Complete SDK documentation:** [sdk-guide.md](sdk-guide.md)

---

### Option 2: Direct REST API

**Use when:**
- You're working in non-Node.js environments (Python, Go, PHP, etc.)
- You need full control over requests (custom headers, retries)
- You need idempotency guarantees (SDK doesn't handle this automatically)
- Bundle size is critical

**Features:**
- ✅ Works with any HTTP client (fetch, curl, axios, requests, etc.)
- ✅ Built-in idempotency via `X-Idempotency-Key` header
- ✅ Generate typed clients from OpenAPI spec for any language

**Quick start:**

```bash
curl -X POST https://app.beel.es/api/v1/invoices \
  -H "X-API-Key: $BEEL_API_KEY" \
  -H "X-Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "STANDARD",
    "issue_date": "2025-01-27",
    "recipient": { "recipient_type": "EXISTING", "customer_id": "uuid" },
    "lines": [{ "description": "Service", "quantity": 1, "unit_price": 100 }]
  }'
```

**📖 Complete REST API documentation:** [rest-api-guide.md](rest-api-guide.md)

---

## Base URL & Authentication

**Base URL:** `https://app.beel.es/api/v1`

**Authentication:** Include your API key in every request via the `X-API-Key` header:

```
X-API-Key: beel_sk_test_*    # Sandbox
X-API-Key: beel_sk_live_*    # Production
```

Keys are obtained from **Settings > API Keys** in the BeeL dashboard. Each key is bound to a specific business profile.

**Never** include the API key in source code. Always use environment variables:

```bash
export BEEL_API_KEY="beel_sk_test_..."
```

---

## Quick Reference

### Resources

- **Invoices**: Create, list, get, update, delete, mark as paid/sent/overdue, schedule, send via email
- **Customers**: CRUD + search + bulk import (CSV, Holded)
- **Products**: CRUD + search + bulk operations
- **Invoice Series**: Configure numbering series
- **Configuration**: Tax types, VeriFactu settings, preferences, customization
- **Business Profiles**: CRUD + representation flow + API key management
- **NIF Validation**: Validate Spanish tax IDs

### Invoice Types

| Type | Description |
|------|-------------|
| `STANDARD` | Standard invoice |
| `CORRECTIVE` | Corrects or cancels a previous invoice |
| `SIMPLIFIED` | Simplified invoice (up to 400€ without NIF, 3000€ with NIF) |

### Invoice Statuses

| Status | Description |
|--------|-------------|
| `DRAFT` | Editable draft (not legally binding) |
| `ISSUED` | Legally issued with definitive number |
| `SENT` | Marked as sent to customer |
| `PAID` | Marked as paid |
| `OVERDUE` | Not paid after due date |
| `VOIDED` | Cancelled via TOTAL corrective invoice |
| `SCHEDULED` | Will auto-issue on future date |

**Status flow:**

```
DRAFT → ISSUED → SENT → PAID
          ↓
        VOIDED

DRAFT → SCHEDULED → ISSUED
```

---

## Response Format

All successful responses follow this envelope format:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-01-15T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

Paginated lists include additional `meta` fields: `total`, `page`, `per_page`, `total_pages`.

## Error Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": { "field": "error description" }
  },
  "meta": { "timestamp": "...", "request_id": "..." }
}
```

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | OK — successful GET or idempotent replay |
| `201` | Created — resource successfully created |
| `401` | Unauthorized — invalid or missing API key |
| `404` | Not Found |
| `409` | Conflict — idempotency conflict or duplicate |
| `422` | Unprocessable Entity — validation error |
| `500` | Internal Server Error |

---

## VeriFactu

Spanish tax authority compliance system. When enabled:

- Invoices are submitted automatically on `DRAFT → ISSUED` transition
- Manual submission: `POST /invoices/{id}/submit-verifactu`
- Configure via `PUT /verifactu-configuration`

---

## Additional Resources

**This skill folder contains:**

- **[sdk-guide.md](sdk-guide.md)** — Complete Node.js SDK guide (installation, examples, patterns)
- **[rest-api-guide.md](rest-api-guide.md)** — Complete REST API guide (idempotency, codegen, examples)
- **[endpoints.md](endpoints.md)** — Quick reference of all endpoints
- **[examples.md](examples.md)** — Code examples (TypeScript, Python, curl)

**Machine-readable documentation:**

1. **Start here — index of all doc pages**: https://docs.beel.es/llms.txt
   - Lists every page with a short description
   - Find the relevant page URL, then fetch only that page

2. **Fetch a specific page** by appending `.mdx` to any docs URL:
   - https://docs.beel.es/docs/invoices/createInvoice.mdx
   - https://docs.beel.es/docs/guides/idempotency.mdx

3. **OpenAPI spec** (complete schema + all endpoints): https://docs.beel.es/api/openapi
   - Use when you need request/response schemas for a specific endpoint
   - Prefer this over `llms-full.txt` when you need structured endpoint data

4. **Full documentation** (single file, ~300KB): https://docs.beel.es/llms-full.txt
   - **Last resort only** — use only when multiple unrelated sections are needed simultaneously

---

## When to Use Each Option

| Feature | SDK | REST API |
|---------|-----|----------|
| Platform | Node.js/TypeScript only | Any language |
| Type safety | ✅ Full TypeScript types | ⚠️ Manual types or codegen |
| Idempotency | ❌ Not automatic | ✅ Built-in via headers |
| Auto-completion | ✅ Full IDE support | ⚠️ Depends on codegen |
| Flexibility | ⚠️ Limited to generated methods | ✅ Full control |
| Bundle size | ~50KB (tree-shakeable) | Minimal (fetch only) |

**Choose SDK if:**
- You're using Node.js/TypeScript
- You want type safety and IDE auto-completion
- Standard use cases covered by the API

**Choose REST API if:**
- You're using Python, Go, PHP, or any other language
- You need full control over requests
- You need guaranteed idempotency
- Bundle size is critical

---

**Need help?** Load the relevant guide:
- For SDK: read [sdk-guide.md](sdk-guide.md)
- For REST API: read [rest-api-guide.md](rest-api-guide.md)
- For endpoints: read [endpoints.md](endpoints.md)
- For examples: read [examples.md](examples.md)
