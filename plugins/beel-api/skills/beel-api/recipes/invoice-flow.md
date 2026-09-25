# Recipe: Full Invoice Flow

The typical integration: create a customer → create a product → create an invoice → issue it → send it.

Build all of it against the canonical company-scoped paths — `/v1/companies/{company_id}/customers`, `/v1/companies/{company_id}/products`, `/v1/companies/{company_id}/invoices` and their sub-paths (`/issue`, `/send`, `/void`, `/corrective`). The flat `/v1/invoices`-style routes are deprecated and retire on 9 December 2026.

## Before writing any code

Fetch the relevant doc pages to verify endpoints and required fields:

```bash
# Find the endpoints in the API reference index
curl -s https://docs.beel.es/api-reference/llms.txt | grep -i "create an invoice\|create a customer\|create a product\|issue\|send"

# Then fetch each page as Markdown to see exact fields, e.g.:
# curl -s https://docs.beel.es/invoices/createCompanyInvoice.md
```

## Invoice Lifecycle (Stable)

```
DRAFT → ISSUED → SENT → PAID
  │        │
  │        └→ PAID (direct)
  │
  └→ SCHEDULED → DRAFT or ISSUED (on scheduled date)

ISSUED/SENT/PAID/RECTIFIED → VOIDED     (void, or a TOTAL corrective)
ISSUED/SENT/PAID/RECTIFIED → RECTIFIED  (a PARTIAL corrective)
SENT → ISSUED only undoes the "sent" mark; nothing ever goes back to DRAFT

Proformas (type=PROFORMA), non-fiscal, a separate track:
ACTIVE → CONVERTED (POST /v1/companies/{company_id}/invoices/{invoice_id}/convert-to-invoice)
ACTIVE → VOIDED   (offer rejected or withdrawn)
ACTIVE → EXPIRED  (derived on read once valid_until passes; never stored)
```

`InvoiceStatus` has 11 values: `SCHEDULED`, `DRAFT`, `ISSUED`, `SENT`, `PAID`, `OVERDUE`, `RECTIFIED`, `VOIDED`, `CONVERTED`, `ACTIVE`, `EXPIRED`. `OVERDUE` is reserved: no operation sets it and it is not computed, so an unpaid invoice past its `due_date` stays `ISSUED` or `SENT` — compare `due_date` with today to find overdue invoices.

**Key rules:**
- `DRAFT` → editable, deleteable, not legally binding
- `ISSUED` → legally binding, numbered, submitted to VeriFactu asynchronously — **cannot edit or delete** (LIF-001)
- To fix an issued invoice → create a **corrective** invoice
- **Void** only an invoice that should never have been issued (VOI-001); anything that did happen is corrected, not voided
- `SENT` and `PAID` are commercial marks with no fiscal effect

The full diagram, and which operation each status allows, is in the invoice lifecycle guide (`https://docs.beel.es/guides/invoice-lifecycle.md`) and the rules of the `lifecycle` domain.

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

// Send Idempotency-Key on every write that creates, issues, corrects or voids (required on bulk imports):
const headers = { 'Idempotency-Key': crypto.randomUUID() };
```

The typed client catches wrong endpoints and fields at compile time. If BeeL changes an endpoint, regenerate the types and the compiler tells you what broke.

## Corrective Invoices

When you need to fix or cancel an issued invoice:

- **PARTIAL correction** → original becomes RECTIFIED
- **TOTAL correction** → original becomes VOIDED
- The `rectification_code` must match the cause: R1–R4 for a standard invoice, always R5 for a simplified one (COR-002)

For the corrective fields and the rules that apply:
```bash
curl -s https://docs.beel.es/verifactu/corrective-invoices.md
curl -s https://docs.beel.es/rules/corrective.md
```

## Series and addresses

- **Creating a series requires `document_type`** — without it, `422 VALIDATION_ERROR`; `UNASSIGNED` is not accepted for a new series. Existing `UNASSIGNED` series keep working.
- **`country_code` decides an address's country.** Send the ISO 3166-1 code (`ES`, `GB` — not `UK`). `country` is only accepted as a real ISO code or the country's official name in Spanish, English or Catalan: anything else answers `422 COUNTRY_CODE_REQUIRED`, and a `country` that names a different country than `country_code` answers `422 COUNTRY_CODE_MISMATCH`. With neither field the address is Spanish. Responses always carry the code and the Spanish name derived from it.

## Idempotency

- **Always send it on writes that create, issue, correct or void** — it is the only protection against a retried write (LIF-004). `POST` always honours it; `PUT`/`PATCH`/`DELETE` only where the API reference lists the header. It is **required** on the bulk imports: a missing key there answers `400 IDEMPOTENCY_KEY_REQUIRED`
- Any unique client-generated string of letters, digits, `-` and `_` (a UUID qualifies), max 255 characters; anything else answers `400 INVALID_IDEMPOTENCY_KEY`
- A `2xx` **or a `5xx`** is stored and replayed for 24 hours; a `4xx` is not stored, so the key is free again for the corrected request
- Scoped per user, per company and per environment, and bound to the operation, its query string and its body
- Use UUID for one-off ops, deterministic keys for business ops (e.g., `order-${orderId}`)
- On duplicate: returns original response with `Idempotency-Replay: true`
- `409 IDEMPOTENCY_KEY_PROCESSING` → the first request is still in flight; wait and retry with the same key
- `409 IDEMPOTENCY_KEY_MISMATCH` → the key was already used with a different body; use a new key

For detailed idempotency patterns:
```bash
curl -s https://docs.beel.es/guides/idempotency.md
```
