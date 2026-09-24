---
name: webhooks
description: >
  Implement a correct BeeL webhook receiver: HMAC-SHA256 signature
  verification, raw-body handling, event deduplication, retry-aware
  processing and subscription management. Use when receiving BeeL events
  (invoice issued, voided, VeriFactu status, etc.) or debugging webhook
  delivery/signature issues.
argument-hint: "[events to handle, e.g. 'invoice.issued']"
---

# BeeL Webhook Receiver

Build or fix a webhook receiver that BeeL can deliver to safely. An unverified or non-idempotent receiver is worse than polling — it can be fed a fake `invoice.issued` from anyone, or double-process events.

The base pattern (Express example) lives in `../beel-api/recipes/webhook-handler.md`. This skill adds the full procedure around it: live event catalog, framework gotchas, subscription management and end-to-end verification.

## Procedure

### 1. Fetch the current event catalog

Event types and payload schemas change — discover and fetch the webhook doc pages before writing handlers:

```bash
curl -s https://docs.beel.es/webhooks/events.md    # types + payloads
curl -s https://docs.beel.es/webhooks.md           # subscriptions, headers, limits
```

If anything below fails, fetch the signatures, deduplication and retries pages (`/webhooks/signatures.md`, `/webhooks/deduplication.md`, `/webhooks/retries.md`).

### 2. Implement verification (non-negotiable, first middleware)

Stable invariants (re-verify against the live signature docs if anything fails):

- Header: `BeeL-Signature: t=<unix_ts>,v1=<hex_digest>`
- Digest: HMAC-SHA256 over the string `"<timestamp>.<raw_body>"`, hex-encoded, keyed with the webhook secret (provided at subscription creation; store in an env var)
- Reject when `|now - t| > 300` seconds (replay window)
- Compare with a **constant-time** function (`crypto.timingSafeEqual`), never `===` — and guard buffer lengths first, since `timingSafeEqual` throws on mismatched lengths
- Return **401** on verification failure, before touching the payload

**In Node, check whether the official SDK (`@beel_es/sdk`) verification helper fits before hand-rolling** — fetch the live SDK docs for its current API.

**The #1 pitfall — raw body.** The HMAC covers the raw bytes. JSON middleware that parses before verification breaks it:

- Express: use `express.raw({ type: 'application/json' })` on the webhook route, parse JSON only after verifying (and keep any global `express.json()` off this route)
- Next.js (App Router): use `await req.text()` for verification, then `JSON.parse`
- Fastify: use a content-type parser that preserves the raw buffer

### 3. Deduplicate

Deliveries can arrive more than once (retries, redeliveries). Key idempotent processing on the **`BeeL-Event-Id`** header:

- Persist processed ids (DB table / Redis with TTL) — in-memory sets don't survive restarts
- On duplicate: return 200 immediately without reprocessing

### 4. Acknowledge fast, process async

Return 2xx as soon as the event is verified, deduplicated and durably accepted (queued or stored) — within 10 seconds. Slow handlers hit BeeL's delivery timeout and trigger retries, amplifying load.

**Not every failure is retried.** Only network errors, timeouts, `408`, `429` and `5xx` are treated as transient. They are retried on a fixed schedule: 7 attempts in total, the last about 3 days after the first (the sandbox stops after 3 attempts, about 10 minutes). Any other 4xx is a permanent client error — the delivery is not retried. A handler that answers `400` on a payload it does not recognise silently loses the event. Every attempt is signed afresh and carries the same `BeeL-Event-Id`; for longer outages, retry from the delivery log or reconcile from the resources.

### 5. Subscription management

Subscriptions are managed via the API (discover the `webhooks/*` endpoints via `llms.txt`): create (HTTPS URLs only; **at most 10 active subscriptions per account** — paused or turned-off ones do not count, but turning one back on when 10 are active is rejected with `400 WEBHOOK_ACTIVE_SUBSCRIPTION_LIMIT_REACHED`; pausing, turning off or deleting a subscription drops its pending retries), update, rotate secret (**the old secret invalidates immediately** — deploy the new secret first, then rotate), list deliveries and retry failed ones for debugging.

There is also a test endpoint, `POST /v1/accounts/{account_id}/webhooks/{webhook_id}/test`: it sends a synthetic, fully signed payload (`"test": true`) to the subscription URL immediately, outside the delivery queue. It answers `200` whenever the test ran, so branch on `delivery_success` in the response, not on the status. It is not retried and does not appear in the delivery history — it is the cheapest way to prove the endpoint is reachable and the signature check works.

### 6. Verify end-to-end

If a sandbox key is available: create a subscription pointing at the dev endpoint (a public HTTPS tunnel for a local server: `https://localhost` and private addresses are rejected), then either fire the test endpoint above — enough to prove reachability and signature — or trigger a real event when the payload shape matters, and confirm: signature passes, duplicate delivery is ignored, handler completes. The **BeeL CLI** (see `../beel-api/recipes/cli.md`) does all of this without throwaway scripts — discover the exact commands with `npx @beel_es/cli --help`:

```bash
npx @beel_es/cli webhooks --help                          # subscription commands
npx @beel_es/cli invoices create --data @test.json        # then issue it to trigger the event
```

Check the webhook deliveries endpoint for the delivery record. If no key is available, unit-test the verifier with a synthetic signed payload and document the manual steps.
