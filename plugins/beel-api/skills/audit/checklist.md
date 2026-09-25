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

- [ ] **`Idempotency-Key` on every write that creates, issues, corrects or voids** (HIGH — LIF-004)
  Every raw POST to `app.beel.es` sends the header. SDK calls pass automatically (the SDK injects it) — mark as pass via SDK. `POST` always honours it; a `PUT`/`PATCH`/`DELETE` only where the API reference lists the header for that operation, so its absence elsewhere is not a finding. Check the operation's doc page before flagging a non-POST call. Bulk imports require it (`400 IDEMPOTENCY_KEY_REQUIRED`).
- [ ] **Current header names, not legacy ones** (HIGH)
  The only auth header is `Authorization: Bearer <key>`; the only idempotency header is `Idempotency-Key`. The two legacy forms fail differently, so report them differently: a request sending `X-API-Key` carries **no authentication at all** — that header has never been part of BeeL's auth and the call will be rejected as unauthenticated. A request sending `X-Idempotency-Key` is accepted, but the header is **silently ignored**, so the call is simply not idempotent and a retry duplicates the resource. If a sandbox key is available, confirm either directly with the BeeL CLI (`npx @beel_es/cli request ...` — see the beel-api skill's `recipes/cli.md`).
- [ ] **Key generated once per logical operation, reused across retries** (HIGH)
  The most common subtle bug: `uuid()` called *inside* the retry loop or inside the request helper for each attempt. The key must be created before the loop and reused; otherwise retries create duplicates (duplicate invoices = real money).
- [ ] **Key is deterministic where it should be** (MEDIUM)
  If the operation derives from an external entity (order, subscription period), a composite key like `invoice-order-${orderId}` is safer than a random UUID stored nowhere. The key must be a UUID or a string of `[A-Za-z0-9_-]`, max 255 chars — anything else (a colon, a slash, an email) is rejected with `INVALID_IDEMPOTENCY_KEY`.
- [ ] **Retry semantics match what the key stores** (MEDIUM)
  A `2xx` or a `5xx` is stored and replayed for 24 hours with the same key; a `4xx` frees the key. So retrying a `5xx` with the same key returns the same `5xx`: the code has to check the resource, then use a new key. `409 IDEMPOTENCY_KEY_PROCESSING` means wait and retry with the same key; `409 IDEMPOTENCY_KEY_MISMATCH` means a new key.
- [ ] **Replay awareness** (LOW)
  Code distinguishes a replayed response (`Idempotency-Replay: true`) where it matters (e.g. not double-counting metrics).

## 3. Error Handling

- [ ] **Envelope parsed, not just HTTP status** (MEDIUM)
  Responses are checked via `error.code` (or the RFC 9457 `title`, which carries the same value) and `error.details` — not only `res.ok`, and never by matching `error.message`, whose language follows `Accept-Language` (English by default). With the SDK: whatever error types the live SDK docs document are caught individually, not a bare catch-all that swallows everything — read the SDK's error reference for the names before asserting any, they are not something to recall.
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
  Code that loops over many resources one-by-one should use the bulk operations under `/v1/companies/{company_id}`: `POST …/invoices/batches` (issue, mark sent or paid), `POST …/invoices/pdf-archive`, `POST …/invoices/deliveries`, `POST …/invoices/exports`, and `POST`/`DELETE …/customers/bulk` and `…/products/bulk`. The flat `/v1/invoices/bulk/*` routes are deprecated — never recommend them. A bulk call can answer `2xx` with failed rows: the code must read the per-row report. Check the bulk operations guide before flagging.

## 5. Webhooks (skip if no receiver exists)

- [ ] **Signature verified** (CRITICAL)
  Every webhook request is verified against `BeeL-Signature` (`t=<ts>,v1=<hex HMAC-SHA256 of "timestamp.rawBody">`) before processing. Unverified processing = anyone can forge `invoice.issued` events.
- [ ] **Raw body used for verification** (HIGH)
  The HMAC is computed over the **raw request bytes**. Framework JSON middleware (e.g. `express.json()` without raw capture) re-serializes and breaks verification silently or, worse, leads devs to disable it.
- [ ] **Timing-safe comparison with length guard** (HIGH)
  `crypto.timingSafeEqual` or equivalent — not `===` on the digest. Buffers of different lengths make `timingSafeEqual` throw, so the length must be checked first (or the comparison wrapped).
- [ ] **Timestamp window enforced** (MEDIUM)
  Reject when `|now - t| > 300s` (verify current tolerance in live docs).
- [ ] **Deduplication via `BeeL-Event-Id`** (HIGH)
  Deliveries can repeat — a failed one is retried up to 7 times over about 3 days, and a slow endpoint can get an event it already processed; the handler must be idempotent, keyed on the event id (persistent store that outlives those 3 days, not in-memory only).
- [ ] **Fast 2xx, async processing** (MEDIUM)
  The endpoint acknowledges within 10 seconds and defers heavy work; slow handlers trigger BeeL's retry policy and amplify load. A `4xx` for an unknown event type loses it for good: only network errors, timeouts, `408`, `429` and `5xx` are retried.
- [ ] **Webhook secret in env** (HIGH)
  Same standard as API keys.

## 6. Invoice Lifecycle and fiscal rules (legal correctness)

Cite the rule id in each finding. Look rules up with the MCP (`beel_rules_get`, also by `error_code`) or at `https://docs.beel.es/rules/<ID>.md`; the critical ones are in the `rules` skill. Rules whose `enforced_by` is `integrator` or `issuer` are **not** checked by the API — they are the ones this audit exists for.

- [ ] **Only drafts are edited/deleted** (CRITICAL — LIF-001)
  No code path calls update or delete on invoices that may be beyond DRAFT. Fixing an issued invoice must go through a corrective invoice (TOTAL or PARTIAL).
- [ ] **Void only what should never have been issued** (HIGH — VOI-001)
  A void is for an invoice issued by mistake (the operation never happened, a test, a duplicate). Code that voids to fix amounts or data should issue a corrective instead, with the right `rectification_code` (COR-002: R1–R4, R5 only for simplified).
- [ ] **No test invoices with a live key** (CRITICAL — LIF-003)
  Tests, fixtures and seed scripts run with `beel_sk_test_` only.
- [ ] **No invoice number or issue date sent** (MEDIUM — NUM-001, DAT-001)
  The number is assigned on issue and read from the issue response; the date is the issue day, `operation_date` records when the sale happened.
- [ ] **Amounts in euros, no zero or negative non-corrective invoices** (HIGH — TAX-013, CNT-019)
- [ ] **Simplified invoices capped and not used for identified customers** (HIGH — SIM-001, SIM-006)
  A SIMPLIFIED invoice whose recipient carries `nif` or `alternative_id` answers `422 SIMPLIFIED_INVOICE_FORBIDS_IDENTIFIED_RECIPIENT` on create, edit and issue, at any amount: code that picks the type has to send STANDARD whenever the customer is identified.
- [ ] **QR before distribution; submission status followed** (HIGH — QRC-002, REC-008)
  The PDF is not sent before `invoice.pdf.generated` / `verifactu.qr_url`; `verifactu.status.updated` (or a reconciliation) is handled, and `REJECTED` is surfaced, not ignored.
- [ ] **Series created with `document_type`** (HIGH if the code creates series)
  Creating a series without it answers `422`; `UNASSIGNED` is not accepted for a new series.
- [ ] **Addresses send `country_code`** (MEDIUM)
  The ISO code decides the country; a free-text `country` that is not an ISO code or an official name (`UK`) answers `422 COUNTRY_CODE_REQUIRED`.
- [ ] **No assumption that issuing is reversible** (HIGH)
  Issuing assigns the legal number and may submit to VeriFactu. Code must not "issue then fix" — validation belongs before issuing (use the draft PDF preview, not issue-and-check).
- [ ] **Status transitions follow the documented state machine** (MEDIUM)
  Fetch the current invoice docs and verify the transitions the code performs exist. Flag invented transitions.

## 7. Pagination & Data Completeness

- [ ] **All pages consumed** (MEDIUM)
  List calls used for sync/export iterate to `pagination.total_pages` (or follow `has_next`). A bare list call processed once is a partial-data bug: without `limit` a list returns 20 items. Collections travel under a named key inside `data`, next to `data.pagination`; a few lists use a cursor instead — read the operation's response schema rather than assuming one shape.
- [ ] **Filters pushed to the API** (LOW)
  Filtering client-side over full listings where a documented query filter exists.

## 8. Freshness

- [ ] **Official SDK where it fits** (LOW)
  Node/TS projects doing raw `fetch` against `app.beel.es` should consider `@beel_es/sdk` (retries, idempotency and webhook verification built in). Verify it's still the documented SDK via the live SDK docs.
- [ ] **SDK version current** (LOW)
  Compare the version the project pins against the current one stated in the live SDK docs. Only report a gap you can point at a source for.
- [ ] **No removed/deprecated endpoints in use** (HIGH if found)
  Cross-check called endpoints against the live OpenAPI spec; anything the code calls that no longer exists in the spec is an incident waiting for deploy.
