# BeeL Node.js SDK Guide

> **Recommended option** for Node.js/TypeScript projects. The SDK is 100% auto-generated from the OpenAPI spec and provides full type safety.

## Installation

```bash
npm install @beel/sdk
```

## Quick Start

```typescript
import { BeeL } from '@beel/sdk';

const client = new BeeL({
  apiKey: process.env.BEEL_API_KEY!, // Get from https://app.beel.es
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
const customers = await client.customers.list({
  page: 1,
  pageSize: 20,
});

// Get a product
const product = await client.products.get({
  id: 'product-uuid',
});
```

## Configuration

### Basic setup

```typescript
const client = new BeeL({
  apiKey: 'your-api-key', // Required
  baseUrl: 'https://app.beel.es/api/v1', // Optional (this is the default)
});
```

### Environment-based setup

```typescript
// .env file
BEEL_API_KEY=beel_sk_test_...  # Test environment
# BEEL_API_KEY=beel_sk_live_... # Production

// app.ts
import { BeeL } from '@beel/sdk';

const client = new BeeL({
  apiKey: process.env.BEEL_API_KEY!,
});
```

The same base URL (`https://app.beel.es/api/v1`) serves both environments. The API key prefix determines the environment:
- `beel_sk_test_*` → Sandbox
- `beel_sk_live_*` → Production

## Available Services

The SDK exposes all BeeL API resources through typed service classes:

| Service | Description |
|---------|-------------|
| `client.invoices` | Create, list, get, update, delete invoices |
| `client.customers` | Manage customers (CRUD + search) |
| `client.products` | Manage product catalog |
| `client.invoiceSeries` | Configure invoice numbering series |
| `client.invoiceLifecycle` | Mark invoices as sent/paid/overdue, cancel, schedule |
| `client.invoiceDelivery` | Send invoices via email |
| `client.customerImport` | Bulk import customers (CSV, Holded) |
| `client.customerTemplates` | Manage customer templates |
| `client.configurationTax` | Tax configuration (IRPF, retention types) |
| `client.configurationPreferences` | User preferences (language, defaults) |
| `client.configurationVerifactu` | VeriFactu settings |
| `client.nif` | NIF/CIF validation |
| `client.publicBusinessProfiles` | Public business information |
| `client.publicMetrics` | Public metrics |

## Common Patterns

### Invoices

#### Create a standard invoice

```typescript
const invoice = await client.invoices.create({
  type: 'STANDARD',
  issue_date: '2025-01-27',
  recipient: {
    recipient_type: 'EXISTING',
    customer_id: 'customer-uuid',
  },
  lines: [
    {
      description: 'Web development',
      quantity: 10,
      unit: 'hours',
      unit_price: 50.00,
      tax_rate: 21, // IVA 21%
    },
  ],
  payment_method: 'TRANSFER',
  payment_deadline: 30, // Days
});
```

#### Create a corrective invoice (full cancellation)

```typescript
const corrective = await client.invoices.create({
  type: 'CORRECTIVE',
  rectification_type: 'TOTAL', // Completely voids the original
  original_invoice_id: 'invoice-uuid-to-void',
  issue_date: '2025-01-27',
  recipient: {
    recipient_type: 'EXISTING',
    customer_id: 'customer-uuid',
  },
  // Lines are optional for TOTAL rectification (auto-negates original)
});
```

#### List invoices with filters

```typescript
const issued = await client.invoices.list({
  status: 'ISSUED',
  page: 1,
  pageSize: 50,
});

console.log(`Found ${issued.total} issued invoices`);
issued.data.forEach(inv => {
  console.log(`${inv.number} - ${inv.total_amount}€`);
});
```

#### Mark invoice as paid

```typescript
await client.invoiceLifecycle.markAsPaid({
  id: 'invoice-uuid',
  payment_date: '2025-01-27',
});
```

#### Send invoice via email

```typescript
await client.invoiceDelivery.send({
  id: 'invoice-uuid',
  recipient_email: 'client@example.com',
  subject: 'Your invoice from BeeL',
  message: 'Please find attached your invoice.',
});
```

### Customers

#### Create a customer

```typescript
const customer = await client.customers.create({
  name: 'Acme Corp',
  nif: 'B12345678',
  email: 'contact@acme.com',
  phone: '+34600123456',
  address: {
    street: 'Gran Vía 123',
    city: 'Madrid',
    postal_code: '28013',
    province: 'Madrid',
    country: 'ES',
  },
});
```

#### Search customers

```typescript
const results = await client.customers.list({
  search: 'Acme',
  page: 1,
  pageSize: 20,
});
```

#### Update a customer

```typescript
await client.customers.update({
  id: 'customer-uuid',
  email: 'newemail@acme.com',
  phone: '+34600999888',
});
```

### Products

#### Create a product

```typescript
const product = await client.products.create({
  name: 'Web Development',
  description: 'Hourly rate for web development services',
  unit_price: 50.00,
  tax_rate: 21,
  unit: 'hour',
});
```

#### List products

```typescript
const products = await client.products.list({
  page: 1,
  pageSize: 100,
});
```

### VeriFactu

#### Submit invoice to VeriFactu manually

```typescript
await client.configurationVerifactu.submitInvoice({
  invoice_id: 'invoice-uuid',
});
```

#### Configure VeriFactu auto-submission

```typescript
await client.configurationVerifactu.update({
  enabled: true,
  auto_submit: true, // Submit automatically when invoice is issued
  certificate: certificateBuffer, // P12/PFX certificate
  certificate_password: 'cert-password',
});
```

## Error Handling

The SDK throws errors with structured information:

```typescript
try {
  const invoice = await client.invoices.create({ ... });
} catch (error) {
  if (error.status === 401) {
    console.error('Invalid API key');
  } else if (error.status === 422) {
    console.error('Validation error:', error.body);
    // error.body contains field-level validation errors
  } else {
    console.error('API error:', error);
  }
}
```

## Type Safety

The SDK is fully typed. TypeScript will autocomplete and validate all requests:

```typescript
// TypeScript knows all available fields and their types
const invoice = await client.invoices.create({
  type: 'STANDARD', // TypeScript suggests: 'STANDARD' | 'CORRECTIVE' | 'SIMPLIFIED'
  issue_date: '2025-01-27', // TypeScript knows this is a string (ISO date)
  lines: [
    {
      description: 'Service', // TypeScript knows all line fields
      quantity: 10, // number
      unit_price: 50.00, // number
      // TypeScript will error if you add invalid fields
    },
  ],
});

// Response is also fully typed
console.log(invoice.id); // TypeScript knows invoice has an 'id' field
console.log(invoice.number); // TypeScript knows invoice has a 'number' field
```

## Pagination

All list endpoints return paginated responses:

```typescript
const response = await client.invoices.list({
  page: 1,
  pageSize: 50,
});

console.log(response.data); // Array of invoices
console.log(response.total); // Total count
console.log(response.page); // Current page
console.log(response.total_pages); // Total pages
```

### Paginate through all results

```typescript
async function* getAllInvoices() {
  let page = 1;
  while (true) {
    const response = await client.invoices.list({
      page,
      pageSize: 100,
    });
    
    yield* response.data;
    
    if (page >= response.total_pages) break;
    page++;
  }
}

// Usage
for await (const invoice of getAllInvoices()) {
  console.log(invoice.number);
}
```

## Idempotency

The SDK **does not handle idempotency automatically**. If you need idempotency for POST/PUT requests (recommended for production), you have two options:

### Option 1: Use the REST API directly

The REST API supports `X-Idempotency-Key` headers. See [rest-api-guide.md](rest-api-guide.md#idempotency) for details.

### Option 2: Wrap SDK calls with retry logic

```typescript
import { v4 as uuidv4 } from 'uuid';

async function createInvoiceIdempotent(data: any) {
  const idempotencyKey = uuidv4();
  
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await client.invoices.create(data);
    } catch (error) {
      if (attempt === 3) throw error;
      await new Promise(r => setTimeout(r, 300 * attempt));
    }
  }
}
```

## SDK vs REST API

| Feature | SDK | REST API |
|---------|-----|----------|
| Type safety | ✅ Full TypeScript types | ⚠️ Manual types or codegen |
| Idempotency | ❌ Not automatic | ✅ Built-in via headers |
| Auto-completion | ✅ Full IDE support | ⚠️ Depends on codegen |
| Flexibility | ⚠️ Limited to generated methods | ✅ Full control |
| Bundle size | ~50KB (tree-shakeable) | Minimal (fetch only) |

**When to use SDK:**
- Node.js/TypeScript projects
- You want type safety and auto-completion
- Standard use cases covered by the API

**When to use REST API:**
- Non-Node.js environments (Python, Go, etc.)
- You need full control over requests (custom headers, retries)
- You need idempotency guarantees
- Bundle size is critical

See [rest-api-guide.md](rest-api-guide.md) for REST API implementation.

## Further Reference

- **OpenAPI spec** (source of truth): https://docs.beel.es/api/openapi
- **SDK source code**: https://github.com/beel-es/beel-node-sdk
- **REST API guide**: [rest-api-guide.md](rest-api-guide.md)
- **Endpoint reference**: [endpoints.md](endpoints.md)
- **Full documentation**: https://docs.beel.es
