# Recipe: Generate a Typed API Client

Instead of writing API calls by hand, generate a fully-typed client from the live OpenAPI spec.

## TypeScript (openapi-typescript + openapi-fetch)

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

## Python

```bash
pip install openapi-python-client
openapi-python-client generate --url https://docs.beel.es/api/openapi
```

## Why this approach

- Types are always in sync with the actual API
- No risk of wrong field names or types
- IDE autocomplete works out of the box
- Breaking changes caught at compile time
- No dependency on unofficial/nonexistent npm packages
