# Recipe: Full Invoice Flow

The typical integration: create a customer → create a product → create an invoice → issue it → send it.

Build all of it against the canonical company-scoped paths — `/v1/companies/{company_id}/customers`, `/v1/companies/{company_id}/products`, `/v1/companies/{company_id}/invoices` and their sub-paths (`/issue`, `/send`, `/void`, `/corrective`). The flat `/v1/invoices`-style routes are deprecated and only live until their `Sunset` date.

## Before writing any code

Fetch the relevant doc pages to verify endpoints and required fields:

```bash
# Find the endpoints
curl https://docs.beel.es/llms.txt | grep -i "create invoice\|create customer\|create product\|issue invoice\|send invoice"

# Then fetch each page to see exact fields, e.g.:
# curl https://docs.beel.es/invoices/createInvoice.mdx
```

## Invoice Lifecycle (Stable)

```
DRAFT → ISSUED → SENT → PAID
  │        │        │
  │        │        └→ OVERDUE → PAID
  │        │
  │        └→ PAID (direct)
  │
  └→ SCHEDULED → DRAFT or ISSUED (on scheduled date)

ISSUED/SENT → VOIDED (via corrective TOTAL)
ISSUED/SENT → RECTIFIED (via corrective PARTIAL)

Proformas (type=PROFORMA), non-fiscal, a separate track:
ACTIVE → CONVERTED (POST /v1/companies/{company_id}/invoices/{invoice_id}/convert-to-invoice)
ACTIVE → VOIDED   (offer rejected or withdrawn)
ACTIVE → EXPIRED  (derived on read once valid_until passes; never stored)
```

`InvoiceStatus` has 11 values: `SCHEDULED`, `DRAFT`, `ISSUED`, `SENT`, `PAID`, `OVERDUE`, `RECTIFIED`, `VOIDED`, `CONVERTED`, `ACTIVE`, `EXPIRED`.

**Key rules:**
- `DRAFT` → editable, deleteable, not legally binding
- `ISSUED` → legally binding, VeriFactu submitted, **cannot edit or delete**
- To fix an issued invoice → create a **corrective** invoice
- To cancel an issued invoice → **void** it

## Recommended approach

Use the typed client (see [typed-client.md](typed-client.md)) so endpoint paths and field names come from the generated types — no hardcoding.

```typescript
import crypto from 'crypto';

// The typed client from openapi-fetch gives you autocomplete
// for all endpoints and fields. No guessing.

// 1. Create customer → check docs for required fields
// 2. Create product → check docs for required fields
// 3. Create invoice (starts as DRAFT) → include Idempotency-Key
// 4. Issue it (DRAFT → ISSUED, triggers VeriFactu)
// 5. Send by email (ISSUED → SENT)

// Send Idempotency-Key on every POST/PUT (required on bulk imports):
const headers = { 'Idempotency-Key': crypto.randomUUID() };
```

The typed client catches wrong endpoints and fields at compile time. If BeeL changes an endpoint, regenerate the types and the compiler tells you what broke.

## Corrective Invoices

When you need to fix or cancel an issued invoice:

- **PARTIAL correction** → original becomes RECTIFIED
- **TOTAL correction** → original becomes VOIDED
- Must include a reason code

For reason codes and corrective invoice fields:
```bash
curl https://docs.beel.es/llms.txt | grep -i corrective
```

## Idempotency

- **Optional on POST/PUT, but always send it** — it is the only protection against a retried write. It is **required** on the bulk imports, which write many rows per call: a missing key there answers `400 IDEMPOTENCY_KEY_REQUIRED`
- Any unique client-generated string. Allowed characters `^[a-zA-Z0-9_-]+$` (a violation answers `400 INVALID_IDEMPOTENCY_KEY`), max 255 characters
- Keys expire 24 hours after processing, and are scoped per user and environment
- Use UUID for one-off ops, deterministic keys for business ops (e.g., `order-${orderId}`)
- On duplicate: returns original response with `Idempotency-Replay: true`
- `409 IDEMPOTENCY_KEY_PROCESSING` → the first request is still in flight; wait and retry with the same key
- `409 IDEMPOTENCY_KEY_MISMATCH` → the key was already used with a different body; use a new key

For detailed idempotency patterns:
```bash
curl https://docs.beel.es/llms.txt | grep -i idempotency
```
