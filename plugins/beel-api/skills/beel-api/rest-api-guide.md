# BeeL REST API Guide

> Direct REST API integration. Use when you need full control, idempotency guarantees, or are working in non-Node.js environments.

## Base URL

```
https://app.beel.es/api/v1
```

The same base URL serves both environments — the API key prefix determines the environment.

## Authentication

Include your API key in every request via the `X-API-Key` header:

```
X-API-Key: beel_sk_live_*    # Production
X-API-Key: beel_sk_test_*    # Sandbox
```

Keys are obtained from **Settings > API Keys** in the BeeL dashboard. Each key is bound to a specific business profile.

**Never** include the API key in source code. Always use environment variables:

```bash
export BEEL_API_KEY="beel_sk_test_..."
```

## Idempotency (Required for POST)

All POST requests **must** include an `X-Idempotency-Key` header to prevent duplicate resource creation on retries.

```
X-Idempotency-Key: <UUID v4 or unique string>
```

### Rules

- Use UUID v4 or a composite unique string (e.g., `invoice-order-${orderId}`)
- Keys expire after **24 hours** — the same key can be safely reused after that
- Max length: 255 characters
- On duplicate detection: returns the original response with `X-Idempotency-Replay: true` header
- Applies to POST and PUT requests only

```javascript
import { v4 as uuidv4 } from 'uuid';
const idempotencyKey = uuidv4();
// or: `invoice-order-${orderId}-${timestamp}`
```

### Why idempotency matters

Without idempotency, retrying a failed request can create duplicate resources:

```javascript
// ❌ BAD: No idempotency key
try {
  await fetch('https://app.beel.es/api/v1/invoices', {
    method: 'POST',
    headers: { 'X-API-Key': API_KEY },
    body: JSON.stringify(invoiceData),
  });
} catch (error) {
  // Network timeout — was the invoice created or not?
  // Retrying will create a duplicate invoice
}
```

```javascript
// ✅ GOOD: With idempotency key
const idempotencyKey = uuidv4();

for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    const res = await fetch('https://app.beel.es/api/v1/invoices', {
      method: 'POST',
      headers: {
        'X-API-Key': API_KEY,
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(invoiceData),
    });
    break; // Success
  } catch (error) {
    if (attempt === 3) throw error;
    await new Promise(r => setTimeout(r, 300 * attempt));
  }
}
```

### Detect idempotency replay

```javascript
const res = await fetch('https://app.beel.es/api/v1/invoices', { ... });
const isReplay = res.headers.get('X-Idempotency-Replay') === 'true';
// true = response is cached from a previous identical request
```

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

## Common Implementation Patterns

### POST with idempotency (TypeScript)

```typescript
async function beelPost<T>(path: string, body: T): Promise<unknown> {
  const res = await fetch(`https://app.beel.es/api/v1${path}`, {
    method: 'POST',
    headers: {
      'X-API-Key': process.env.BEEL_API_KEY!,
      'X-Idempotency-Key': crypto.randomUUID(),
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

// Usage
const invoice = await beelPost('/invoices', {
  type: 'STANDARD',
  issue_date: '2025-01-27',
  // ...
});
```

### Safe retry — same idempotency key across retries

```typescript
async function beelPostWithRetry<T>(path: string, body: T, retries = 3) {
  const idempotencyKey = crypto.randomUUID(); // generate once, reuse on retry

  for (let i = 1; i <= retries; i++) {
    try {
      const res = await fetch(`https://app.beel.es/api/v1${path}`, {
        method: 'POST',
        headers: {
          'X-API-Key': process.env.BEEL_API_KEY!,
          'X-Idempotency-Key': idempotencyKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      const json = await res.json();
      if (!json.success) throw new Error(json.error.code);
      
      return json.data;
    } catch (err) {
      if (i === retries) throw err;
      await new Promise(r => setTimeout(r, 300 * i));
    }
  }
}
```

### Error handling

```typescript
const res = await fetch('https://app.beel.es/api/v1/invoices', { ... });
const json = await res.json();

if (!json.success) {
  const { code, message, details } = json.error;
  // code: 'UNAUTHORIZED' | 'VALIDATION_ERROR' | 'CONFLICT' | 'NOT_FOUND' | ...
  // details: field-level errors for VALIDATION_ERROR
  throw Object.assign(new Error(message), { code, details });
}
```

### Pagination

```
GET /invoices?page=1&per_page=50
```

```typescript
async function* beelPaginate(path: string, params: Record<string, string> = {}) {
  let page = 1;
  while (true) {
    const url = new URL(`https://app.beel.es/api/v1${path}`);
    Object.entries({ ...params, page: String(page), per_page: '100' })
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

## API-First: Generate Types from OpenAPI

Instead of writing types manually, generate them directly from the OpenAPI spec.

### TypeScript — openapi-typescript + openapi-fetch

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
    'X-API-Key': process.env.BEEL_API_KEY!,
  },
});

// Fully typed — request body and response inferred from spec
const { data, error } = await beel.POST('/invoices', {
  headers: { 'X-Idempotency-Key': crypto.randomUUID() },
  body: { ... }, // TypeScript will tell you exactly what goes here
});
```

Re-run the codegen whenever the API is updated:

```bash
npx openapi-typescript https://docs.beel.es/api/openapi -o src/beel-api.d.ts
```

### Python — openapi-python-client

```bash
pip install openapi-python-client
openapi-python-client generate --url https://docs.beel.es/api/openapi
```

This generates a fully-typed Python client with models for all requests and responses.

## Resources Overview

### Invoices

**Types:**

| Value | Description |
|-------|-------------|
| `STANDARD` | Standard invoice |
| `CORRECTIVE` | Corrects or cancels a previous invoice |
| `SIMPLIFIED` | Simplified invoice (up to 400€ without NIF, 3000€ with NIF) |

**Statuses:**

| Value | Description |
|-------|-------------|
| `DRAFT` | Editable draft, not legally binding. Assigned a draft number (e.g. `DRAFT-2025-001`) |
| `ISSUED` | Legally issued with definitive number. Triggers VeriFactu if configured |
| `SENT` | Marked as sent to the customer |
| `PAID` | Marked as paid |
| `OVERDUE` | Not paid after due date |
| `VOIDED` | Cancelled via a TOTAL corrective invoice |
| `SCHEDULED` | Will auto-issue on a future date |

**Status flow:**

```
DRAFT → ISSUED → SENT → PAID
          ↓
        VOIDED

DRAFT → SCHEDULED → ISSUED
```

**Rectification types (CORRECTIVE invoices):**

- `TOTAL` — Completely voids the original invoice (status → VOIDED). Lines optional (defaults to negated original lines)
- `PARTIAL` — Partially corrects the original invoice. Lines required (adjustment amounts)

### Customers

CRUD + bulk operations + CSV import (preview → confirm flow) + Holded import.

### Products

CRUD + search + bulk create/delete.

### Business Profiles

CRUD + representation flow (generate → submit → status → download → cancel) + API key management per profile.

### Configuration

Tax types, invoice series, VeriFactu settings, language preferences, invoice customization options.

## VeriFactu

Spanish tax authority compliance system. When enabled:

- Invoices are submitted automatically on `DRAFT → ISSUED` transition
- Manual submission: `POST /invoices/{id}/submit-verifactu`
- Configure via `PUT /verifactu-configuration`

## Example Requests

### Create a standard invoice

```bash
curl -X POST https://app.beel.es/api/v1/invoices \
  -H "X-API-Key: $BEEL_API_KEY" \
  -H "X-Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "STANDARD",
    "issue_date": "2025-01-27",
    "recipient": {
      "recipient_type": "EXISTING",
      "customer_id": "customer-uuid"
    },
    "lines": [
      {
        "description": "Web development services",
        "quantity": 10,
        "unit": "hours",
        "unit_price": 50.00,
        "tax_rate": 21
      }
    ],
    "payment_method": "TRANSFER",
    "payment_deadline": 30
  }'
```

### List invoices

```bash
curl https://app.beel.es/api/v1/invoices?status=ISSUED&page=1&per_page=20 \
  -H "X-API-Key: $BEEL_API_KEY"
```

### Get an invoice

```bash
curl https://app.beel.es/api/v1/invoices/{invoice_id} \
  -H "X-API-Key: $BEEL_API_KEY"
```

### Mark invoice as paid

```bash
curl -X PUT https://app.beel.es/api/v1/invoices/{invoice_id}/mark-as-paid \
  -H "X-API-Key: $BEEL_API_KEY" \
  -H "X-Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_date": "2025-01-27"
  }'
```

### Send invoice via email

```bash
curl -X POST https://app.beel.es/api/v1/invoices/{invoice_id}/send \
  -H "X-API-Key: $BEEL_API_KEY" \
  -H "X-Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_email": "client@example.com",
    "subject": "Your invoice from BeeL",
    "message": "Please find attached your invoice."
  }'
```

### Create a customer

```bash
curl -X POST https://app.beel.es/api/v1/customers \
  -H "X-API-Key: $BEEL_API_KEY" \
  -H "X-Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corp",
    "nif": "B12345678",
    "email": "contact@acme.com",
    "phone": "+34600123456",
    "address": {
      "street": "Gran Vía 123",
      "city": "Madrid",
      "postal_code": "28013",
      "province": "Madrid",
      "country": "ES"
    }
  }'
```

### Create a product

```bash
curl -X POST https://app.beel.es/api/v1/products \
  -H "X-API-Key: $BEEL_API_KEY" \
  -H "X-Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Web Development",
    "description": "Hourly rate for web development services",
    "unit_price": 50.00,
    "tax_rate": 21,
    "unit": "hour"
  }'
```

## Machine-Readable Documentation

Always use the most targeted fetch possible — the full docs file is 300KB+:

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

## Further Reference

- **Endpoint quick-reference**: [endpoints.md](endpoints.md)
- **SDK guide** (for Node.js projects): [sdk-guide.md](sdk-guide.md)
- **Code examples**: [examples.md](examples.md)
- **OpenAPI spec**: https://docs.beel.es/api/openapi
- **Full docs**: https://docs.beel.es
