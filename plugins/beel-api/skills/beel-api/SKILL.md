---
name: beel-api
description: >
  BeeL invoicing API integration guide for Spanish autonomous workers.
  Use when implementing BeeL API calls, creating invoices, managing customers
  or products, or troubleshooting BeeL API responses.
argument-hint: "[resource or task]"
---

# BeeL API — Integration Guide for Claude Code

BeeL is a SaaS invoicing platform for Spanish autónomos and small businesses with full VeriFactu compliance.

---

## ⚠️ Golden Rules

These are non-negotiable. Follow them in every interaction.

1. **NEVER invent endpoints, fields, or package names.** Always verify against the live OpenAPI spec first.
2. **NEVER hardcode API keys.** Always use environment variables (`process.env.BEEL_API_KEY`).
3. **There is NO separate test URL.** The base URL is always `https://app.beel.es/api/v1`. The API key prefix determines the environment: `beel_sk_test_*` = sandbox, `beel_sk_live_*` = production.
4. **ALWAYS include `Idempotency-Key` header** on POST and PUT requests. Use UUID v4 or a deterministic business key.
5. **Issued invoices are immutable.** You cannot edit or delete them. To correct → create a corrective invoice. To cancel → void it.
6. **When in doubt, fetch the docs.** See the next section.

---

## 📚 How to Find Documentation

The live docs are the **single source of truth**. Fetch them before writing any BeeL integration code.

### Quick reference index

```bash
curl https://docs.beel.es/llms.txt
```

Lists every doc page with its URL. Use `grep` to find what you need:

```bash
curl https://docs.beel.es/llms.txt | grep -i webhook
curl https://docs.beel.es/llms.txt | grep -i invoice
curl https://docs.beel.es/llms.txt | grep -i customer
```

### Full docs in one request

```bash
curl https://docs.beel.es/llms-full.txt
```

All documentation in a single file. Use when you need broad context or are unsure which page to read.

### OpenAPI spec (schemas, fields, validation)

```bash
curl https://docs.beel.es/api/openapi
```

The **source of truth** for all request/response schemas, field names, types, enums, and validation rules. Always verify field names here before generating code.

### Standard workflow

1. `curl llms.txt` → find the relevant page URL
2. Fetch that specific page for detailed guidance
3. Cross-check field names and types against the OpenAPI spec
4. Generate code with verified fields

---

## 🔐 Authentication (Stable)

```
Authorization: Bearer beel_sk_test_*    # Sandbox (no fiscal effects)
Authorization: Bearer beel_sk_live_*    # Production (real invoices, VeriFactu)
```

- Base URL: **always** `https://app.beel.es/api/v1`
- The key prefix determines the environment — NOT the URL
- Keys are created from: BeeL dashboard → Settings → API Keys
- Keys are shown once at creation — store securely immediately

```typescript
// Always use environment variables
const response = await fetch('https://app.beel.es/api/v1/invoices', {
  headers: {
    'Authorization': `Bearer ${process.env.BEEL_API_KEY}`,
    'Content-Type': 'application/json'
  }
});
```

For full auth details (key rotation, security best practices, SDK examples):
```bash
curl https://docs.beel.es/llms.txt | grep -i auth
```

---

## 🛠️ Recommended: Generate a Typed Client

Instead of writing API calls by hand, generate a fully-typed client from the live OpenAPI spec. This is the recommended approach for any integration.

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

// Fully typed — autocomplete and compile-time validation
const { data, error } = await beel.GET('/invoices', {
  params: { query: { status: 'ISSUED', limit: 10 } }
});
```

Re-run codegen whenever the API updates:
```bash
npx openapi-typescript https://docs.beel.es/api/openapi -o src/beel-api.d.ts
```

### Python

```bash
pip install openapi-python-client
openapi-python-client generate --url https://docs.beel.es/api/openapi
```

### Why this matters

- Types are always in sync with the actual API
- No risk of using wrong field names or types
- IDE autocomplete works out of the box
- Breaking changes are caught at compile time

---

## 🧾 Invoice Lifecycle (Stable)

This is the core state machine. It rarely changes and is critical to understand.

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
- `VOIDED` → cancelled, requires a reason, reported to AEAT
- Only DRAFT invoices can be updated or deleted via PUT/DELETE
- To "fix" an issued invoice → create a **corrective** invoice (never modify the original)
- To cancel an issued invoice → **void** it

### Corrective invoices

- `PARTIAL` → partially corrects the original (original status → RECTIFIED)
- `TOTAL` → completely cancels the original (original status → VOIDED)
- Always reference the original invoice
- Must include a reason code (`R1`–`R5`)

For corrective reason codes and detailed lifecycle rules:
```bash
curl https://docs.beel.es/llms.txt | grep -i glossary
curl https://docs.beel.es/llms.txt | grep -i corrective
```

---

## 🔄 Idempotency (Stable)

All POST and PUT requests **must** include an `Idempotency-Key` header to prevent duplicate resources.

```typescript
const response = await fetch('https://app.beel.es/api/v1/invoices', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.BEEL_API_KEY}`,
    'Idempotency-Key': crypto.randomUUID(), // or a deterministic business key
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(invoiceData)
});
```

**Rules:**
- Keys expire after **24 hours**
- Max length: **255 characters**
- On duplicate: returns the original response with `Idempotency-Replay: true` header
- For retries, use the **same key** (that's the whole point)
- Best keys: UUID v4 for one-off ops, deterministic keys for business ops (e.g., `shopify-order-${orderId}`)

For detailed idempotency patterns, retry logic, and error handling:
```bash
curl https://docs.beel.es/llms.txt | grep -i idempotency
```

---

## 🇪🇸 Spanish Fiscal Context

BeeL operates in the Spanish tax system. If the developer is unfamiliar with Spanish fiscal concepts, here's what they need to know:

### Core concepts (stable, rarely change)

- **IVA** (Impuesto sobre el Valor Añadido) = VAT. Applied to most goods and services. Multiple rates exist.
- **IRPF** (Impuesto sobre la Renta de las Personas Físicas) = income tax withholding. Autónomos (freelancers) apply a retention percentage on invoices to other businesses.
- **Recargo de equivalencia** = equivalence surcharge. Extra tax for certain retailers.
- **IGIC** = Canary Islands tax (instead of IVA). **IPSI** = Ceuta & Melilla tax.
- **NIF** = Spanish tax ID (umbrella term). Includes DNI (individuals), NIE (foreigners), CIF (companies).
- **VeriFactu** = AEAT's verifiable invoicing system. BeeL handles submission automatically.

### What NOT to hardcode

Tax rates, regime codes, and available tax types can change. Always fetch current values from:

```bash
# Current tax configuration for the user's account
GET /v1/tax-configuration

# Full glossary of fiscal terms and their API field mappings
curl https://docs.beel.es/llms.txt | grep -i glossary

# Available tax regimes, payment methods, and reason codes
curl https://docs.beel.es/llms.txt | grep -i glossary
```

### Invoice types

- **STANDARD** → regular B2B/B2C invoices, full fiscal data required
- **SIMPLIFIED** → consumer receipts, NIF/address optional (like a restaurant ticket)
- **CORRECTIVE** → fixes or cancels a previously issued invoice

For which type to use when, and field requirements per type:
```bash
curl https://docs.beel.es/api/openapi   # Check the InvoiceType enum and required fields
```

---

## 🪝 Recipe: Webhook Handler

When implementing a webhook receiver for BeeL events, always include:

1. **Signature verification** — validate `BeeL-Signature` header (format: `t=timestamp,v1=hmac-sha256`)
2. **Deduplication** — track `BeeL-Event-Id` to avoid processing the same event twice
3. **Fast response** — return 200 immediately, process async
4. **Retry awareness** — BeeL retries up to 5 times on failure

For the complete webhook setup guide, signature verification code, event types, and payload schemas:
```bash
curl https://docs.beel.es/llms.txt | grep -i webhook
```

### Minimal Express example (verify + dedup pattern)

```typescript
import crypto from 'crypto';
import express from 'express';

const app = express();
const processedEvents = new Set<string>(); // Use Redis/DB in production

app.post('/webhooks/beel', express.raw({ type: 'application/json' }), (req, res) => {
  // 1. Verify signature
  const signature = req.headers['beel-signature'] as string;
  if (!verifySignature(req.body, signature, process.env.BEEL_WEBHOOK_SECRET!)) {
    return res.status(401).send('Invalid signature');
  }

  // 2. Deduplicate
  const eventId = req.headers['beel-event-id'] as string;
  if (processedEvents.has(eventId)) {
    return res.status(200).send('Already processed');
  }

  // 3. Respond fast
  res.status(200).send('OK');

  // 4. Process async
  const event = JSON.parse(req.body.toString());
  processedEvents.add(eventId);
  handleEvent(event).catch(console.error);
});

function verifySignature(payload: Buffer, header: string, secret: string): boolean {
  const parts = Object.fromEntries(header.split(',').map(p => p.split('=')));
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${parts.t}.${payload.toString()}`)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
}

async function handleEvent(event: any) {
  switch (event.type) {
    case 'invoice.emitted':
      // Invoice was issued — update your system
      break;
    case 'verifactu.status.updated':
      // VeriFactu status changed (accepted/rejected by AEAT)
      break;
    // Fetch docs for the full list of event types
  }
}
```

⚠️ **Always verify the exact signature format and event payload schemas from the live docs.** The pattern above shows the structure; field names may evolve.

---

## 🚀 Recipe: Full Invoice Flow

The typical integration flow: create a customer, create a product, create an invoice, issue it, send it.

```typescript
// This shows the PATTERN — always verify field names against the OpenAPI spec

// 1. Create customer
const customer = await beel.POST('/customers', {
  body: { /* check required fields in OpenAPI spec */ },
  headers: { 'Idempotency-Key': crypto.randomUUID() }
});

// 2. Create product
const product = await beel.POST('/products', {
  body: { /* check required fields in OpenAPI spec */ },
  headers: { 'Idempotency-Key': crypto.randomUUID() }
});

// 3. Create invoice (starts as DRAFT)
const invoice = await beel.POST('/invoices', {
  body: {
    type: 'STANDARD',
    issue_date: '2026-03-22',
    recipient: { recipient_type: 'EXISTING', customer_id: customer.data.id },
    lines: [{ description: 'Service', quantity: 1, unit_price: 100 }]
  },
  headers: { 'Idempotency-Key': `invoice-order-${orderId}` }
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

⚠️ **Always fetch the OpenAPI spec to verify exact field names, required fields, and body structure before using this pattern.**

---

## 🐛 Debugging: Common Errors

| Error | Likely cause | Solution |
|---|---|---|
| `401 Unauthorized` | Wrong API key, wrong env, or expired key | Check key prefix matches intended env (`test_` vs `live_`) |
| `403 Forbidden` | Key lacks permissions for this operation | Check key scopes in dashboard |
| `404 Not Found` | Wrong resource ID or wrong endpoint | Verify endpoint in OpenAPI spec |
| `409 Conflict` | Duplicate or business rule violation | Check `Idempotency-Key`, check invoice status |
| `422 Unprocessable Entity` | Invalid field values or missing required fields | Fetch OpenAPI spec, verify field names and types |
| `429 Too Many Requests` | Rate limit exceeded (100/min standard) | Implement exponential backoff, check `X-RateLimit-*` headers |
| Can't edit invoice | Invoice is ISSUED (immutable) | Create a corrective invoice instead |
| Can't delete invoice | Invoice is ISSUED (immutable) | Void it instead (POST `/invoices/{id}/void`) |
| Can't delete customer | Customer has associated invoices | Deactivate instead (soft delete) |

For rate limit details and backoff strategies:
```bash
curl https://docs.beel.es/llms.txt | grep -i rate
```

---

## 🌐 Ecosystem

- **Stripe integration**: BeeL has a native, no-code Stripe integration from the dashboard. Don't build a custom Stripe→BeeL bridge unless the developer specifically needs custom logic beyond what the native integration provides.
- **AI Chat**: docs.beel.es has a built-in AI assistant that can answer API questions interactively.
- **SDKs**: Check current SDK availability at `curl https://docs.beel.es/llms.txt | grep -i sdk`
- **Status page**: [status.beel.es](https://status.beel.es) for API uptime and incidents.
- **Support**: [it@beel.es](mailto:it@beel.es) — Developer Plan users get priority support.
