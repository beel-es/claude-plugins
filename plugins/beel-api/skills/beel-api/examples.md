# BeeL API — Implementation Patterns

> For exact request/response schemas, always fetch the live OpenAPI spec:
> `https://docs.beel.es/api/openapi`

---

## API-First: Generate Types from the Spec

Instead of writing types manually, generate them directly from the OpenAPI spec.

### TypeScript — openapi-typescript + openapi-fetch

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
    'X-API-Key': process.env.BEEL_API_KEY!,
  },
});

// Fully typed — request body and response inferred from spec
const { data, error } = await beel.POST('/invoices', {
  headers: { 'Idempotency-Key': crypto.randomUUID() },
  body: { ... }, // TypeScript will tell you exactly what goes here
});
```

Re-run the codegen whenever the API is updated:
```bash
npx openapi-typescript https://docs.beel.es/api/openapi -o src/beel-api.d.ts
```

### Python — openapi-python-client

```bash
pip install openapi-python-client
openapi-python-client generate --url https://docs.beel.es/api/openapi
```

This generates a fully-typed Python client with models for all requests and responses.

---

## Core Patterns

### Auth + Idempotency wrapper (TypeScript)

```typescript
async function beelPost<T>(path: string, body: T): Promise<unknown> {
  const res = await fetch(`https://app.beel.es/api/v1${path}`, {
    method: 'POST',
    headers: {
      'X-API-Key': process.env.BEEL_API_KEY!,
      'Idempotency-Key': crypto.randomUUID(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.success) throw new Error(`${json.error.code}: ${json.error.message}`);
  return json.data;
}
```

### Safe retry — same idempotency key across retries

```typescript
async function beelPostWithRetry<T>(path: string, body: T, retries = 3) {
  const idempotencyKey = crypto.randomUUID(); // generate once, reuse on retry

  for (let i = 1; i <= retries; i++) {
    try {
      const res = await fetch(`https://app.beel.es/api/v1${path}`, {
        method: 'POST',
        headers: {
          'X-API-Key': process.env.BEEL_API_KEY!,
          'Idempotency-Key': idempotencyKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error.code);
      return json.data;
    } catch (err) {
      if (i === retries) throw err;
      await new Promise(r => setTimeout(r, 300 * i));
    }
  }
}
```

### Error handling

```typescript
const json = await res.json();
if (!json.success) {
  const { code, message, details } = json.error;
  // code: 'UNAUTHORIZED' | 'VALIDATION_ERROR' | 'CONFLICT' | 'NOT_FOUND' | ...
  // details: field-level errors for VALIDATION_ERROR
  throw Object.assign(new Error(message), { code, details });
}
```

### Detect idempotency replay

```typescript
const isReplay = res.headers.get('X-Idempotency-Replay') === 'true';
// true = response is cached from a previous identical request
```

### Paginate all results

```typescript
async function* beelPaginate(path: string, params: Record<string, string> = {}) {
  let page = 1;
  while (true) {
    const url = new URL(`https://app.beel.es/api/v1${path}`);
    Object.entries({ ...params, page: String(page), per_page: '100' })
      .forEach(([k, v]) => url.searchParams.set(k, v));

    const res = await fetch(url, { headers: { 'X-API-Key': process.env.BEEL_API_KEY! } });
    const json = await res.json();
    if (!json.success) throw new Error(json.error.code);

    yield* json.data;
    if (page >= json.meta.total_pages) break;
    page++;
  }
}

// Usage
for await (const invoice of beelPaginate('/invoices', { status: 'ISSUED' })) {
  console.log(invoice.id);
}
```
