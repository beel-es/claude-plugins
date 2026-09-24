# BeeL Integration Audit — Checklist

Each check lists what to look for and the pass criteria. Severities are defaults — escalate when production (live key) is involved.

Contents: [1. API key security](#1-api-key-security) · [2. Idempotency](#2-idempotency) · [3. Error handling](#3-error-handling) · [4. Rate limits & retries](#4-rate-limits--retries) · [5. Webhooks](#5-webhooks-skip-if-no-receiver-exists) · [6. Invoice lifecycle](#6-invoice-lifecycle-legal-correctness) · [7. Pagination](#7-pagination--data-completeness) · [8. Freshness](#8-freshness) · [9. Fiscal rules catalogue](#9-fiscal-rules-catalogue)

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

- [ ] **`Idempotency-Key` on every POST** (HIGH, LIF-004)
  Every raw POST to `app.beel.es` that creates, issues, corrects or voids sends the header. SDK calls pass automatically (the SDK injects it) — mark as pass via SDK. Some PUT/PATCH/DELETE operations honour the header too, but only those whose reference lists it, so its absence on another non-POST call is not a finding. Check the operation's doc page before flagging one.
- [ ] **Current header names, not legacy ones** (HIGH)
  The only auth header is `Authorization: Bearer <key>`; the only idempotency header is `Idempotency-Key`. The two legacy forms fail differently, so report them differently: a request sending `X-API-Key` carries **no authentication at all** — that header has never been part of BeeL's auth and the call will be rejected as unauthenticated. A request sending `X-Idempotency-Key` is accepted, but the header is **silently ignored**, so the call is simply not idempotent and a retry duplicates the resource. If a sandbox key is available, confirm either directly with the BeeL CLI (`npx @beel_es/cli request ...` — see the beel-api skill's `recipes/cli.md`).
- [ ] **Key generated once per logical operation, reused across retries** (HIGH)
  The most common subtle bug: `uuid()` called *inside* the retry loop or inside the request helper for each attempt. The key must be created before the loop and reused; otherwise retries create duplicates (duplicate invoices = real money).
- [ ] **Key is deterministic where it should be** (MEDIUM)
  If the operation derives from an external entity (order, subscription period), a composite key like `invoice-order-${orderId}` is safer than a random UUID stored nowhere. The key must be a UUID or a string of `[A-Za-z0-9_-]`, max 255 chars — anything else (a colon, a slash, an email) is rejected with `INVALID_IDEMPOTENCY_KEY`.
- [ ] **Retry policy matches what is replayed** (HIGH)
  `2xx` and `5xx` are stored under the key and replayed; a `4xx` frees it. So: a network error (no response) is retried with the **same** key; a `5xx` is **not** retried blindly with the same key (it replays the same `5xx`), the code checks whether the operation happened, for example by `external_ref`, and only then retries with a **new** key. A loop that retries a `5xx` with the same key never gets through; one that makes a new key on network errors can duplicate invoices.
- [ ] **Replay awareness** (LOW)
  Code distinguishes a replayed response (`Idempotency-Replay: true`) where it matters (e.g. not double-counting metrics).

## 3. Error Handling

- [ ] **Envelope parsed, not just HTTP status** (MEDIUM)
  Responses are checked via `json.success` and `json.error.code` / `error.details` — not only `res.ok`. With the SDK: whatever error types the live SDK docs document are caught individually, not a bare catch-all that swallows everything — read the SDK's error reference for the names before asserting any, they are not something to recall.
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
  Code that loops creating/updating many resources one-by-one should use the bulk endpoints, all under the company: `…/customers/bulk`, `…/products/bulk`, `POST /v1/companies/{company_id}/invoices/batches` for status changes and issuing, `…/invoices/pdf-archive` for PDFs and `…/invoices/deliveries` for email. The flat `/v1/invoices/bulk/*` routes are all deprecated, so never recommend them. Check the live docs for the current bulk surface before flagging.

## 5. Webhooks (skip if no receiver exists)

- [ ] **Signature verified** (CRITICAL)
  Every webhook request is verified against `BeeL-Signature` (`t=<ts>,v1=<hex HMAC-SHA256 of "timestamp.rawBody">`) before processing. Unverified processing = anyone can forge `invoice.issued` events.
- [ ] **Raw body used for verification** (HIGH)
  The HMAC is computed over the **raw request bytes**. Framework JSON middleware (e.g. `express.json()` without raw capture) re-serializes and breaks verification silently or, worse, leads devs to disable it.
- [ ] **Timing-safe comparison with length guard** (HIGH)
  `crypto.timingSafeEqual` or equivalent — not `===` on the digest. Buffers of different lengths make `timingSafeEqual` throw, so the length must be checked first (or the comparison wrapped).
- [ ] **Timestamp window enforced** (MEDIUM)
  Reject when `|now - t| > 300s` (verify current tolerance in live docs).
- [ ] **Retries not hardcoded** (LOW)
  Code or runbooks that assume a retry count or window should read it from `https://docs.beel.es/webhooks/retries.md`. Only `5xx`, `408`, `429` and network errors are retried; answering another `4xx` to a payload the handler does not recognise drops the event.
- [ ] **Deduplication via `BeeL-Event-Id`** (HIGH)
  Deliveries can repeat; the handler must be idempotent, keyed on the event id (persistent store, not in-memory only, if the process restarts).
- [ ] **Fast 2xx, async processing** (MEDIUM)
  The endpoint acknowledges quickly and defers heavy work; slow handlers trigger BeeL's retry policy and amplify load.
- [ ] **Webhook secret in env** (HIGH)
  Same standard as API keys.

## 6. Invoice Lifecycle (legal correctness)

- [ ] **Only drafts are edited/deleted** (CRITICAL, LIF-001)
  No code path calls update or delete on invoices that may be beyond `DRAFT`/`SCHEDULED`. Wrong data on an issued invoice goes through a corrective invoice (COR-001).
- [ ] **Void only what should never have been issued** (CRITICAL, VOI-001)
  A void path exists only for invoices issued by mistake (the operation never happened, a test, a duplicate). "Void and reissue" to fix amounts, tax or customer data is a finding: that is a corrective. Voids go through the void operation, never a status change (VOI-002).
- [ ] **Corrective reason code chosen, not hardcoded** (HIGH, COR-002)
  R1–R4 for a standard invoice, R5 for a simplified one. A single hardcoded code for every correction is a finding.
- [ ] **No assumption that issuing is reversible** (HIGH, LIF-002, NUM-001, NUM-002)
  Issuing assigns the legal number and may submit to VeriFactu. Code must not "issue then fix": validation belongs before issuing (use the draft PDF preview). No code invents, sends or reuses invoice numbers, and none sends an issue date (DAT-001).
- [ ] **Sandbox for tests** (CRITICAL, LIF-003)
  Tests, fixtures and seed scripts run with a `beel_sk_test_` key. A test that can issue with a live key issues a real invoice.
- [ ] **PDF distributed only once it has the QR, and AEAT outcome followed** (HIGH, QRC-002, REC-008)
  Code that emails or renders the PDF right after issuing, or that never reads `submission_status`, is a finding.
- [ ] **Status transitions follow the documented state machine** (MEDIUM)
  Fetch `https://docs.beel.es/guides/invoice-lifecycle.md` and verify the transitions the code performs exist. Flag invented transitions.

## 7. Pagination & Data Completeness

- [ ] **All pages consumed** (MEDIUM)
  List calls used for sync/export iterate to `pagination.total_pages`. A bare list call processed once is a partial-data bug. **Where `pagination` sits varies**: almost every listing nests it inside `data` (`data.pagination`), but the email endpoints put it top-level, alongside `data`. Code that hardcodes one shape reads `undefined` on the other and stops after page one.
- [ ] **Filters pushed to the API** (LOW)
  Filtering client-side over full listings where a documented query filter exists.

## 8. Freshness

- [ ] **Official SDK where it fits** (LOW)
  Node/TS projects doing raw `fetch` against `app.beel.es` should consider `@beel_es/sdk` (retries, idempotency and webhook verification built in). Verify it's still the documented SDK via the live SDK docs.
- [ ] **SDK version current** (LOW)
  Compare the version the project pins against the current one stated in the live SDK docs. Only report a gap you can point at a source for.
- [ ] **No removed/deprecated endpoints in use** (HIGH if found)
  Cross-check called endpoints against the live OpenAPI spec; anything the code calls that no longer exists in the spec is an incident waiting for deploy.
- [ ] **The company in the path, no `BeeL-Active-Company`** (MEDIUM; HIGH once the `Sunset` date is near)
  Calls to flat routes (`/v1/invoices`, `/v1/customers`, `/v1/products`, `/v1/configuration/…`, `/v1/webhooks`, …) or a `BeeL-Active-Company` header mean the integration still depends on the deprecated routes, which stop answering on the date in their `Sunset` response header. The fix is `/v1/companies/{company_id}/…` (or `/v1/accounts/{account_id}/…`); `/beel-api:upgrade` has the route table.
- [ ] **Agent instructions current** (LOW)
  If the repo's `AGENTS.md`/`CLAUDE.md` carries BeeL.'s rules block, it matches the one published at `https://docs.beel.es/ai-agents` (see the beel-api skill's `recipes/agents-md.md`).

## 9. Fiscal rules catalogue

- [ ] **Every rule BeeL. does not enforce is accounted for** (severity from the rule's impact: critical → CRITICAL, high → HIGH, else MEDIUM)
  List the rule domains the code touches (issuing → lifecycle, numbering, contents, dates; corrections → corrective, void; simplified invoices → simplified; tax lines → taxes, surcharge; PDF and email → qr; AEAT status → records). For each, take the rules enforced by `integrator` or `issuer` (`node scripts/lookup.mjs --yours <domain>` in the `beel-api:rules` skill). Each one needs a place in the code, or a documented business decision, that handles it. Report the gaps with the rule ID.
- [ ] **Error codes of API-enforced rules handled as permanent** (MEDIUM)
  For rules enforced by `api`, the error codes they list are surfaced to the user or logged with the rule ID, not retried.
