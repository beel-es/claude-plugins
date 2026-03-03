# BeeL Node.js SDK - Integration Guide

> **Official SDK for Node.js/TypeScript projects.** 100% auto-generated from the OpenAPI spec.

## How to Find SDK Documentation

**Primary source (always use this):**

```
https://docs.beel.es/docs/node-sdk.mdx
```

**Workflow:**

1. **Check if the page exists:**
   ```bash
   curl https://docs.beel.es/docs/node-sdk.mdx
   ```

2. **If 404, check the index:**
   ```bash
   curl https://docs.beel.es/llms.txt | grep -i sdk
   ```

3. **Find the correct URL** and fetch that page

**Never use static/cached docs** - always fetch live from docs.beel.es.

---

## Quick Start (Minimal)

### Installation

```bash
npm install @beel/sdk
```

### Basic Setup

```typescript
import { BeeL } from '@beel/sdk';

const client = new BeeL({
  apiKey: process.env.BEEL_API_KEY!, // beel_sk_test_* or beel_sk_live_*
});

// Create an invoice
const invoice = await client.invoices.create({
  type: 'STANDARD',
  issue_date: '2025-01-27',
  recipient: {
    recipient_type: 'EXISTING',
    customer_id: 'customer-uuid',
  },
  lines: [
    {
      description: 'Web development services',
      quantity: 10,
      unit: 'hours',
      unit_price: 50.00,
    },
  ],
});

// List customers
const customers = await client.customers.list({ page: 1, pageSize: 20 });
```

---

## Available Services

The SDK provides typed access to all BeeL API resources:

```typescript
client.invoices            // Invoice CRUD + lifecycle
client.customers           // Customer management
client.products            // Product catalog
client.invoiceSeries       // Invoice numbering series
client.invoiceLifecycle    // Mark as paid/sent/overdue
client.invoiceDelivery     // Send invoices via email
client.customerImport      // Bulk import (CSV, Holded)
client.configurationTax    // Tax settings
client.configurationPreferences
client.configurationVerifactu
client.nif                 // NIF/CIF validation
```

**For detailed usage of each service:**

1. Fetch `https://docs.beel.es/docs/node-sdk.mdx`
2. Or use the OpenAPI spec: `https://docs.beel.es/api/openapi`

---

## Type Safety

The SDK is fully typed. TypeScript will autocomplete and validate all requests:

```typescript
const invoice = await client.invoices.create({
  type: 'STANDARD', // TypeScript suggests: 'STANDARD' | 'CORRECTIVE' | 'SIMPLIFIED'
  lines: [{
    description: 'Service',
    quantity: 10, // TypeScript enforces number
    // TypeScript errors on invalid fields
  }],
});

// Response is fully typed
console.log(invoice.id);     // ✅ TypeScript knows this exists
console.log(invoice.number); // ✅ TypeScript knows this exists
```

---

## Error Handling

```typescript
try {
  const invoice = await client.invoices.create({ ... });
} catch (error) {
  if (error.status === 401) {
    console.error('Invalid API key');
  } else if (error.status === 422) {
    console.error('Validation error:', error.body);
  }
}
```

---

## Idempotency

⚠️ **The SDK does NOT handle idempotency automatically.**

If you need idempotency for POST/PUT requests (recommended for production):

**Option 1:** Use the REST API directly (supports `X-Idempotency-Key` headers)

**Option 2:** Implement retry logic with SDK calls

For idempotency details, see [rest-api-guide.md](rest-api-guide.md#idempotency).

---

## Further Reference

**Always fetch live docs:**

- **SDK docs**: `https://docs.beel.es/docs/node-sdk.mdx`
- **OpenAPI spec** (source of truth): `https://docs.beel.es/api/openapi`
- **SDK source code**: `https://github.com/beel-es/beel-node-sdk`

**Local guides (how to search, not full docs):**

- [rest-api-guide.md](rest-api-guide.md) - REST API alternative
- [endpoints.md](endpoints.md) - Endpoint quick reference
- [examples.md](examples.md) - Code examples

**Never use static docs** - always fetch from docs.beel.es for latest updates.
