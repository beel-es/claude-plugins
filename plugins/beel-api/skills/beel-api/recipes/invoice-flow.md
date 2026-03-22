# Recipe: Full Invoice Flow

The typical integration: create a customer → create a product → create an invoice → issue it → send it.

⚠️ **Always verify field names against the OpenAPI spec before using this pattern:**
```bash
curl https://docs.beel.es/api/openapi
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

## Pattern (TypeScript with openapi-fetch)

```typescript
import crypto from 'crypto';

// 1. Create customer (verify required fields in OpenAPI spec)
const customer = await beel.POST('/customers', {
  body: { /* fetch required fields from OpenAPI spec */ },
  params: { header: { 'Idempotency-Key': crypto.randomUUID() } }
});

// 2. Create product (verify required fields in OpenAPI spec)
const product = await beel.POST('/products', {
  body: { /* fetch required fields from OpenAPI spec */ },
  params: { header: { 'Idempotency-Key': crypto.randomUUID() } }
});

// 3. Create invoice (starts as DRAFT)
const invoice = await beel.POST('/invoices', {
  body: {
    type: 'STANDARD',
    issue_date: '2026-03-22',
    recipient: { recipient_type: 'EXISTING', customer_id: customer.data.id },
    lines: [{ description: 'Service', quantity: 1, unit_price: 100 }]
  },
  params: { header: { 'Idempotency-Key': `invoice-order-${orderId}` } }
});

// 4. Issue it (DRAFT → ISSUED, triggers VeriFactu)
await beel.POST('/invoices/{invoice_id}/issue', {
  params: { path: { invoice_id: invoice.data.id } }
});

// 5. Send by email (ISSUED → SENT)
await beel.POST('/invoices/{invoice_id}/send', {
  params: { path: { invoice_id: invoice.data.id } }
});
```

## Corrective Invoices

When you need to fix or cancel an issued invoice:

- **PARTIAL correction** → original becomes RECTIFIED
- **TOTAL correction** → original becomes VOIDED
- Must include a reason code

For reason codes and corrective invoice fields:
```bash
curl https://docs.beel.es/llms.txt | grep -i corrective
curl https://docs.beel.es/llms.txt | grep -i glossary
```

## Idempotency

- **All POST/PUT must include `Idempotency-Key` header**
- Keys expire after 24 hours, max 255 characters
- Use UUID for one-off ops, deterministic keys for business ops (e.g., `shopify-order-${orderId}`)
- On duplicate: returns original response with `Idempotency-Replay: true`

For detailed idempotency patterns:
```bash
curl https://docs.beel.es/llms.txt | grep -i idempotency
```
