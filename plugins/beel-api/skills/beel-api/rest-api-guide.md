# BeeL REST API - Integration Guide

> Direct REST API integration. Works with any HTTP client in any language.

## How to Find API Documentation

**Always fetch live documentation from docs.beel.es:**

### Step 1: Start with the index

```bash
curl https://docs.beel.es/llms.txt
```

This lists all available pages. Find the page you need (e.g., "Create invoice").

### Step 2: Fetch specific page

Append `.mdx` to any docs URL:

```bash
curl https://docs.beel.es/docs/invoices/createInvoice.mdx
curl https://docs.beel.es/docs/guides/idempotency.mdx
```

### Step 3: Get schemas from OpenAPI spec

```bash
curl https://docs.beel.es/api/openapi
```

Use this for request/response schemas, validation rules, and endpoint details.

---

## Base URL & Authentication

**Base URL:** `https://app.beel.es/api/v1`

**Authentication header:**

```
X-API-Key: beel_sk_test_*    # Sandbox
X-API-Key: beel_sk_live_*    # Production
```

Get API keys from **Settings > API Keys** in the BeeL dashboard.

**Never hardcode keys** - use environment variables:

```bash
export BEEL_API_KEY="beel_sk_test_..."
```

---

## Idempotency (Critical for POST/PUT)

All POST and PUT requests **MUST** include an `Idempotency-Key` header to prevent duplicate resource creation on retries.

### Header

```
Idempotency-Key: <UUID v4 or unique string>
```

### Rules

- Use UUID v4 or a composite unique string (e.g., `invoice-order-${orderId}`)
- Keys expire after **24 hours**
- Max length: 255 characters
- On duplicate detection: returns the original response with `X-Idempotency-Replay: true` header
- Applies to POST and PUT requests only

### Why it matters

Without idempotency, retrying a failed request creates duplicates:

```javascript
// ❌ BAD: No idempotency key
try {
  await fetch('https://app.beel.es/api/v1/invoices', {
    method: 'POST',
    headers: { 'X-API-Key': API_KEY },
    body: JSON.stringify(invoiceData),
  });
} catch (error) {
  // Network timeout — was the invoice created?
  // Retrying creates a DUPLICATE invoice
}
```

```javascript
// ✅ GOOD: With idempotency key
const idempotencyKey = crypto.randomUUID(); // Generate ONCE

for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    const res = await fetch('https://app.beel.es/api/v1/invoices', {
      method: 'POST',
      headers: {
        'X-API-Key': API_KEY,
        'Idempotency-Key': idempotencyKey, // REUSE same key on retry
      },
      body: JSON.stringify(invoiceData),
    });
    break; // Success
  } catch (error) {
    if (attempt === 3) throw error;
    await sleep(300 * attempt);
  }
}
```

### Detect idempotency replay

```javascript
const isReplay = res.headers.get('X-Idempotency-Replay') === 'true';
// true = response is cached from a previous identical request
```

**For full idempotency docs, always fetch:**

```
https://docs.beel.es/docs/guides/idempotency.mdx
```

---

## Generate Typed Clients from OpenAPI

Instead of writing types manually, generate them from the live OpenAPI spec.

### TypeScript - openapi-typescript + openapi-fetch

```bash
npx openapi-typescript https://docs.beel.es/api/openapi -o src/beel-api.d.ts
npm install openapi-fetch
```

```typescript
import createClient from 'openapi-fetch';
import type { paths } from './beel-api.d.ts';

const beel = createClient<paths>({
  baseUrl: 'https://app.beel.es/api/v1',
  headers: { 'X-API-Key': process.env.BEEL_API_KEY! },
});

// Fully typed requests and responses
const { data, error } = await beel.POST('/invoices', {
  headers: { 'Idempotency-Key': crypto.randomUUID() },
  body: { ... }, // TypeScript validates this
});
```

**Re-generate when the API updates:**

```bash
npx openapi-typescript https://docs.beel.es/api/openapi -o src/beel-api.d.ts
```

### Python - openapi-python-client

```bash
pip install openapi-python-client
openapi-python-client generate --url https://docs.beel.es/api/openapi
```

This generates a fully-typed Python client with models for all requests and responses.

---

## Common Patterns

### POST with idempotency (TypeScript)

```typescript
async function beelPost<T>(path: string, body: T): Promise<unknown> {
  const res = await fetch(`https://app.beel.es/api/v1${path}`, {
    method: 'POST',
    headers: {
      'X-API-Key': process.env.BEEL_API_KEY!,
      'Idempotency-Key': crypto.randomUUID(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  
  const json = await res.json();
  if (!json.success) {
    throw new Error(`${json.error.code}: ${json.error.message}`);
  }
  
  return json.data;
}
```

### Error handling

```typescript
const res = await fetch('https://app.beel.es/api/v1/invoices', { ... });
const json = await res.json();

if (!json.success) {
  const { code, message, details } = json.error;
  // code: 'UNAUTHORIZED' | 'VALIDATION_ERROR' | 'CONFLICT' | ...
  // details: field-level errors for VALIDATION_ERROR
  throw Object.assign(new Error(message), { code, details });
}
```

### Pagination

```
GET /invoices?page=1&per_page=50
```

```typescript
async function* beelPaginate(path: string, params = {}) {
  let page = 1;
  while (true) {
    const url = new URL(`https://app.beel.es/api/v1${path}`);
    Object.entries({ ...params, page, per_page: 100 })
      .forEach(([k, v]) => url.searchParams.set(k, v));

    const res = await fetch(url, {
      headers: { 'X-API-Key': process.env.BEEL_API_KEY! },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error.code);

    yield* json.data;
    if (page >= json.meta.total_pages) break;
    page++;
  }
}

// Usage
for await (const invoice of beelPaginate('/invoices', { status: 'ISSUED' })) {
  console.log(invoice.id);
}
```

---

## Response & Error Formats

### Success Response

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

Paginated lists include: `total`, `page`, `per_page`, `total_pages` in `meta`.

### Error Response

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

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | OK |
| `201` | Created |
| `401` | Unauthorized |
| `404` | Not Found |
| `409` | Conflict (idempotency) |
| `422` | Validation Error |
| `500` | Internal Server Error |

---

## Resources Overview

Fetch details from live docs at `https://docs.beel.es/llms.txt` and specific `.mdx` files.

**Main resources:**

- **Invoices** - Create, list, get, update, delete, mark as paid/sent, schedule, send via email
- **Customers** - CRUD + search + bulk import (CSV, Holded)
- **Products** - CRUD + search + bulk operations
- **Invoice Series** - Configure numbering series
- **Configuration** - Tax types, VeriFactu settings, preferences
- **NIF Validation** - Validate Spanish tax IDs

---

## Further Reference

**Always fetch live docs:**

1. **Start here**: `https://docs.beel.es/llms.txt` (index of all pages)
2. **Specific endpoint**: `https://docs.beel.es/docs/<section>/<endpoint>.mdx`
3. **OpenAPI spec**: `https://docs.beel.es/api/openapi`
4. **Full docs** (last resort): `https://docs.beel.es/llms-full.txt`

**Local guides (how to search, not full docs):**

- [sdk-guide.md](sdk-guide.md) - Node.js SDK alternative
- [endpoints.md](endpoints.md) - Endpoint quick reference
- [examples.md](examples.md) - Code examples

**Never use static docs** - always fetch from docs.beel.es for latest updates.
