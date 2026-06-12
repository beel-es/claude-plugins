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
curl -s https://docs.beel.es/llms.txt | grep -i sdk
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

## Why typed clients

- Types are always in sync with the actual API
- No risk of wrong field names or types
- IDE autocomplete works out of the box
- Breaking changes caught at compile time
- No dependency on unofficial/nonexistent npm packages — `@beel_es/sdk` is the only official package; verify anything else against the live docs
