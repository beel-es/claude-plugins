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

## Machine-Readable References

Before writing any code, fetch the relevant documentation:

- **Index of all doc pages**: `https://docs.beel.es/llms.txt`
- **Full documentation (single file)**: `https://docs.beel.es/llms-full.txt`
- **OpenAPI spec**: `https://docs.beel.es/api/openapi`

Use `llms.txt` to discover available pages, then fetch individual `.mdx` URLs for details on specific endpoints or topics. Use `llms-full.txt` when you need comprehensive context in a single request.

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

Rules:
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

## Response Format

All successful responses:

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

See `endpoints.md` for the full list of invoice endpoints.

### Customers
CRUD + bulk operations + CSV import (preview → confirm flow) + Holded import.

### Products
CRUD + search + bulk create/delete.

### Business Profiles
CRUD + representation flow (generate → submit → status → download → cancel) + API key management per profile.

### Configuration
Tax types, invoice series, VeriFactu settings, language preferences, invoice customization options.

## Common Implementation Patterns

### POST with idempotency

```javascript
const res = await fetch('https://app.beel.es/api/v1/invoices', {
  method: 'POST',
  headers: {
    'X-API-Key': process.env.BEEL_API_KEY,
    'X-Idempotency-Key': uuidv4(),
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload),
});
const json = await res.json();
if (!json.success) {
  throw new Error(`BeeL ${json.error.code}: ${json.error.message}`);
}
return json.data;
```

### Detect idempotency replay

```javascript
const isReplay = res.headers.get('X-Idempotency-Replay') === 'true';
```

### Pagination

```
GET /invoices?page=1&per_page=50
```

Use `meta.total_pages` to iterate all pages.

## VeriFactu

Spanish tax authority compliance system. When enabled:
- Invoices are submitted automatically on `DRAFT → ISSUED` transition
- Manual submission: `POST /invoices/{id}/submit-verifactu`
- Configure via `PUT /verifactu-configuration`

## Further Reference

- **Endpoints quick-reference**: `endpoints.md` (this skill folder)
- **Code examples**: `examples.md` (this skill folder)
- **All doc pages**: `https://docs.beel.es/llms.txt`
- **Full docs (single file)**: `https://docs.beel.es/llms-full.txt`
- **OpenAPI spec**: `https://docs.beel.es/api/openapi`
- **Auth guide**: `https://docs.beel.es/docs/auth`
- **Idempotency guide**: `https://docs.beel.es/docs/guides/idempotency`
