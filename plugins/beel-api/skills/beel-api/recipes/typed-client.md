# Recipe: Typed API Client

Never write API calls by hand against remembered schemas. Two options, in order of preference for Node.js:

## Option A — Official SDK (Node.js / TypeScript)

```bash
npm install @beel_es/sdk
```

```typescript
import { BeeL } from '@beel_es/sdk';

const beel = new BeeL({ apiKey: process.env.BEEL_API_KEY });
```

The official SDK ships full TypeScript types plus automatic retries (429/5xx with backoff), automatic `Idempotency-Key` injection on POST, typed errors, and webhook signature verification. **Fetch the live SDK docs for the current method surface before writing code** — find them via:

```bash
curl -s https://docs.beel.es/sdks/node.md
```

Verify the installed version is current: `npm view @beel_es/sdk version`.

## Option B — Generate a client from the OpenAPI spec

Use when the SDK doesn't fit (non-Node stacks, or constraints against the dependency).

### TypeScript (openapi-typescript + openapi-fetch)

```bash
npx openapi-typescript https://docs.beel.es/api/openapi -o src/beel-api.d.ts
npm install openapi-fetch
```

```typescript
import createClient from 'openapi-fetch';
import type { paths } from './beel-api.d.ts';

const beel = createClient<paths>({
  baseUrl: 'https://app.beel.es/api',
  headers: {
    Authorization: `Bearer ${process.env.BEEL_API_KEY}`,
  },
});

// Fully typed — autocomplete and compile-time validation.
// Paths include the /v1 prefix; company-scoped is the canonical form.
const { data, error } = await beel.GET('/v1/companies/{company_id}/invoices', {
  params: {
    path: { company_id: process.env.BEEL_COMPANY_ID! },
    query: { status: 'ISSUED', limit: 10 },
  },
});
```

Build only on paths under `/v1/companies/{company_id}/…` or `/v1/accounts/{account_id}/…`. The flat `/v1/invoices`-style routes are deprecated (`x-successor` names their replacement) and stop answering on their `Sunset` date.

Re-run codegen whenever the API updates:
```bash
npx openapi-typescript https://docs.beel.es/api/openapi -o src/beel-api.d.ts
```

### Python

```bash
pip install openapi-python-client
openapi-python-client generate --url https://docs.beel.es/api/openapi
```

## Why typed clients

- Types are always in sync with the actual API
- No risk of wrong field names or types
- IDE autocomplete works out of the box
- Breaking changes caught at compile time
- No dependency on unofficial/nonexistent npm packages — `@beel_es/sdk` is the only official package; verify anything else against the live docs
