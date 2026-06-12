# BeeL Integration Audit — Checklist

Each check lists what to look for and the pass criteria. Severities are defaults — escalate when production (live key) is involved.

## 1. API Key Security

- [ ] **No hardcoded keys** (CRITICAL for `beel_sk_live_`, HIGH for `beel_sk_test_`)
  Grep source (not `.env*`, not lockfiles) for `beel_sk_`. Pass: zero hits in tracked source files. If a key literal is found in a tracked file, flag that **rotation is needed**, not just removal — deleting the line does not un-leak it.
- [ ] **Keys read from environment** (HIGH)
  API key reaches the client via `process.env` / `os.environ` or a secrets manager — not config files committed to the repo.
- [ ] **Environment separation** (MEDIUM)
  Production code paths cannot run with a `beel_sk_test_` key and vice versa, or at minimum the key is injected per environment, not shared.
- [ ] **Key never logged** (HIGH)
  No logging of request headers or client config objects that include the key.

## 2. Idempotency

- [ ] **`Idempotency-Key` on every POST and PUT** (HIGH)
  Every raw POST/PUT to `app.beel.es` sends the header. SDK calls pass automatically (the SDK injects it) — mark as pass via SDK.
- [ ] **Current header names, not legacy ones** (HIGH)
  The documented headers are `Authorization: Bearer <key>` and `Idempotency-Key`. Code sending legacy `X-API-Key` or `X-Idempotency-Key` may be silently unauthenticated or silently non-idempotent if the server no longer honors them — verify the current names against the live auth and idempotency docs before reporting. If behavior is ambiguous and a sandbox key is available, test directly with the BeeL CLI (`npx @beel_es/cli request ...` — see the beel-api skill's `recipes/cli.md`).
- [ ] **Key generated once per logical operation, reused across retries** (HIGH)
  The most common subtle bug: `uuid()` called *inside* the retry loop or inside the request helper for each attempt. The key must be created before the loop and reused; otherwise retries create duplicates (duplicate invoices = real money).
- [ ] **Key is deterministic where it should be** (MEDIUM)
  If the operation derives from an external entity (order, subscription period), a composite key like `invoice-order-${orderId}` is safer than a random UUID stored nowhere. Max 255 chars.
- [ ] **Replay awareness** (LOW)
  Code distinguishes a replayed response (`Idempotency-Replay: true`) where it matters (e.g. not double-counting metrics).

## 3. Error Handling

- [ ] **Envelope parsed, not just HTTP status** (MEDIUM)
  Responses are checked via `json.success` and `json.error.code` / `error.details` — not only `res.ok`. With the SDK: typed errors (`BeeLValidationError`, …) are caught, not a bare catch-all that swallows everything.
- [ ] **Validation details surfaced** (LOW)
  `error.details` (field-level errors) reaches logs or the user on `VALIDATION_ERROR`, instead of a generic message.
- [ ] **`request_id` preserved in error logs** (LOW)
  `meta.request_id` is logged on failures — it's what BeeL support needs.

## 4. Rate Limits & Retries

- [ ] **429 handled** (HIGH)
  On 429, the code waits (respecting `Retry-After` if present) and retries — it does not fail the operation or hammer immediately. SDK handles this; mark pass via SDK.
- [ ] **Backoff, not tight loops** (MEDIUM)
  Retries use increasing delays. No `while` retry without delay. Client errors (4xx other than 429) are not retried.
- [ ] **Bulk endpoints over loops** (MEDIUM)
  Code that loops creating/updating many resources one-by-one should use the bulk endpoints (customers bulk, products bulk, invoice bulk status, bulk email/PDF). Check the live docs for the current bulk surface before flagging.

## 5. Webhooks (skip if no receiver exists)

- [ ] **Signature verified** (CRITICAL)
  Every webhook request is verified against `BeeL-Signature` (`t=<ts>,v1=<hex HMAC-SHA256 of "timestamp.rawBody">`) before processing. Unverified processing = anyone can forge "invoice paid" events.
- [ ] **Raw body used for verification** (HIGH)
  The HMAC is computed over the **raw request bytes**. Framework JSON middleware (e.g. `express.json()` without raw capture) re-serializes and breaks verification silently or, worse, leads devs to disable it.
- [ ] **Timing-safe comparison with length guard** (HIGH)
  `crypto.timingSafeEqual` or equivalent — not `===` on the digest. Buffers of different lengths make `timingSafeEqual` throw, so the length must be checked first (or the comparison wrapped).
- [ ] **Timestamp window enforced** (MEDIUM)
  Reject when `|now - t| > 300s` (verify current tolerance in live docs).
- [ ] **Deduplication via `BeeL-Event-Id`** (HIGH)
  Deliveries can repeat; the handler must be idempotent, keyed on the event id (persistent store, not in-memory only, if the process restarts).
- [ ] **Fast 2xx, async processing** (MEDIUM)
  The endpoint acknowledges quickly and defers heavy work; slow handlers trigger BeeL's retry policy and amplify load.
- [ ] **Webhook secret in env** (HIGH)
  Same standard as API keys.

## 6. Invoice Lifecycle (legal correctness)

- [ ] **Only drafts are edited/deleted** (CRITICAL)
  No code path calls update or delete on invoices that may be beyond DRAFT. Fixing an issued invoice must go through a corrective invoice (TOTAL or PARTIAL); cancelling means voiding.
- [ ] **No assumption that issuing is reversible** (HIGH)
  Issuing assigns the legal number and may submit to VeriFactu. Code must not "issue then fix" — validation belongs before issuing (use the draft PDF preview, not issue-and-check).
- [ ] **Status transitions follow the documented state machine** (MEDIUM)
  Fetch the current invoice docs and verify the transitions the code performs exist. Flag invented transitions.

## 7. Pagination & Data Completeness

- [ ] **All pages consumed** (MEDIUM)
  List calls used for sync/export iterate to `pagination.total_pages`. A bare list call processed once is a partial-data bug.
- [ ] **Filters pushed to the API** (LOW)
  Filtering client-side over full listings where a documented query filter exists.

## 8. Freshness

- [ ] **Official SDK where it fits** (LOW)
  Node/TS projects doing raw `fetch` against `app.beel.es` should consider `@beel_es/sdk` (retries, idempotency and webhook verification built in). Verify it's still the documented SDK via the live SDK docs.
- [ ] **SDK version current** (LOW)
  Compare installed `@beel_es/sdk` version against `npm view @beel_es/sdk version`.
- [ ] **No removed/deprecated endpoints in use** (HIGH if found)
  Cross-check called endpoints against the live OpenAPI spec; anything the code calls that no longer exists in the spec is an incident waiting for deploy.
