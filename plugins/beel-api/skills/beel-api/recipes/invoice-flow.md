# Recipe: Full Invoice Flow

The typical integration: create a customer → create a product → create an invoice → issue it → send it.

Build all of it under the company in the path: `/v1/companies/{company_id}/customers`, `/v1/companies/{company_id}/products`, `/v1/companies/{company_id}/invoices` and their sub-paths (`/issue`, `/send`, `/void`, `/corrective`).

## Before writing any code

Fetch the operation pages to verify endpoints and required fields:

```bash
# Every operation, one line each
curl -s https://docs.beel.es/api-reference/llms.txt | grep -i "create an invoice\|create a customer\|create a product\|issue an invoice\|send an invoice"

# Then the page itself, as Markdown
curl -s https://docs.beel.es/invoices/createCompanyInvoice.md
```

## Invoice lifecycle

Two kinds of steps, kept apart:

- **Fiscal steps**: issue, void, correct. Each has its own operation, reaches AEAT when the company is under VeriFactu, and is irreversible.
- **Commercial steps**: `SENT` and `PAID`. They record what happened with the customer, have no fiscal effect, and are set with the status operation.

```
DRAFT ──issue──→ ISSUED ──→ SENT ──→ PAID
  ↕ schedule        │         │        │
SCHEDULED           ├─ PARTIAL corrective ─→ RECTIFIED
                    └─ void / TOTAL corrective ─→ VOIDED (terminal)

Proformas (type=PROFORMA), non-fiscal, a separate track:
ACTIVE → CONVERTED (…/invoices/{invoice_id}/convert-to-invoice)
ACTIVE → VOIDED    (offer rejected or withdrawn)
ACTIVE → EXPIRED   (derived on read once valid_until passes)
```

The full diagram and the commercial transitions: [guides/invoice-lifecycle](https://docs.beel.es/guides/invoice-lifecycle.md). The fiscal actions allowed per status, with the error each refusal answers, are rules:

- `DRAFT` and `SCHEDULED` are the only editable or deletable states. Once issued, an invoice is never edited or deleted (LIF-001).
- Only a draft can be issued (LIF-002). The number is assigned on issue and never reused, not even after a void (NUM-001, NUM-002). Don't send an issue date (DAT-001).
- Wrong data on an issued invoice → a corrective invoice (COR-001), with the right reason code: R1–R4 for a standard invoice, R5 for a simplified one (COR-002).
- An invoice that should never have been issued → void it, through the void operation (VOI-001, VOI-002).
- Distribute the PDF only once it carries the QR (QRC-002).

For any of them, `/beel-api:rules` has the full text and the void-or-correct table.

## Recommended approach

Use the typed client (see [typed-client.md](typed-client.md)) so endpoint paths and field names come from the generated types, with nothing hardcoded.

```typescript
import crypto from 'crypto';

// 1. Create customer → check docs for required fields
// 2. Create product → check docs for required fields
// 3. Create invoice (starts as DRAFT) → with an Idempotency-Key
// 4. Issue it (DRAFT → ISSUED, triggers VeriFactu) → with an Idempotency-Key
// 5. Send by email (ISSUED → SENT)

// One key per logical operation, created BEFORE any retry loop and reused by every attempt
const idempotencyKey = crypto.randomUUID();
```

The typed client catches wrong endpoints and fields at compile time. If BeeL. changes an endpoint, regenerate the types and the compiler tells you what broke.

## Corrective invoices

When the operation did happen but the issued invoice is wrong:

- **PARTIAL** correction → the original becomes `RECTIFIED`
- **TOTAL** correction → the original becomes `VOIDED`
- A reason code is required (COR-002). A corrective against a corrective is not allowed: correct the original again (COR-007).

Reason codes and fields: [verifactu/corrective-invoices](https://docs.beel.es/verifactu/corrective-invoices.md).

## Idempotency

- Send `Idempotency-Key` on every `POST` that creates, issues, corrects or voids. It is **required** on the bulk imports: without it they answer `400 IDEMPOTENCY_KEY_REQUIRED`.
- Some `PUT`, `PATCH` and `DELETE` operations honour it too. Rely on it there only where the operation's reference lists the header.
- `2xx` and `5xx` responses are stored and replayed (`Idempotency-Replay: true`). A `4xx` frees the key.
- Retry after a network error with the **same** key. After a `5xx`, check whether the invoice exists, for example by `external_ref`, then retry with a **new** key.
- `409 IDEMPOTENCY_KEY_PROCESSING`: the first request is still in flight, so wait `Retry-After` and retry with the same key. `409 IDEMPOTENCY_KEY_MISMATCH`: the key was used with a different body or path, so use a new key.
- Allowed characters `^[a-zA-Z0-9_-]+$`. A violation answers `400 INVALID_IDEMPOTENCY_KEY`.
- A key identifies a request, not an order. For "one invoice per order", set `external_ref`.

Lifetime, scope and length limit: [guides/idempotency](https://docs.beel.es/guides/idempotency.md).
