# Recipe: Full Invoice Flow

The typical integration: create a customer → create a product → create an invoice → issue it → send it.

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
```

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

// Every POST/PUT must include Idempotency-Key:
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

- **All POST/PUT must include `Idempotency-Key` header**
- Keys expire after 24 hours, max 255 characters
- Use UUID for one-off ops, deterministic keys for business ops (e.g., `order-${orderId}`)
- On duplicate: returns original response with `Idempotency-Replay: true`

For detailed idempotency patterns:
```bash
curl https://docs.beel.es/llms.txt | grep -i idempotency
```
