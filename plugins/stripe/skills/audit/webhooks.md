# Webhook security playbook

Most Stripe production incidents start here. Run every check.

## 1. Signature verification

**Grep for** webhook handlers:

```
rg -n "stripe.*webhook|/webhook|stripe-signature|STRIPE_WEBHOOK_SECRET" --type-add 'web:*.{js,ts,py,rb,go,php,java}' -t web
```

**Pass** — verifies signature with the raw body and a per-endpoint secret:

```ts
// Node + Express
app.post('/webhooks/stripe',
  express.raw({ type: 'application/json' }),     // raw body, not JSON
  (req, res) => {
    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(
      req.body,                                   // Buffer, not parsed
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    // ...
  }
);
```

**Fail patterns — mark `critical`**:

- Handler reads `req.body` as parsed JSON (e.g. `app.use(express.json())` is global with no raw override). Signature check will silently fail or be skipped.
- No call to `stripe.webhooks.constructEvent` (or the equivalent `Webhook::constructEvent` in PHP, `stripe.Webhook.construct_event` in Python).
- Secret hardcoded or read from a `WEBHOOK_SECRET` env that's not the Stripe one.
- Single shared secret across multiple endpoints (each endpoint should have its own, especially Connect vs. account).
- `try { constructEvent } catch { /* swallow */ }` — silently ignoring signature errors.

**Fix** — show the snippet above. Always restate that the secret comes from the Stripe dashboard per endpoint, not invented.

## 2. Event-ID deduplication (idempotent handler)

Stripe **will** retry events. Without dedup, you double-fulfill orders.

**Pass** — handler checks `event.id` against a store before acting:

```ts
const seen = await db.processedEvents.findUnique({ where: { id: event.id } });
if (seen) return res.sendStatus(200);
await db.processedEvents.create({ data: { id: event.id } });
// ... do the work
```

**Fail** — handler runs side effects (DB writes, emails, fulfillment) on every delivery with no idempotency key on those side effects and no event-ID table. Mark `high`.

**Fix** — recommend a `processed_stripe_events(id PRIMARY KEY, received_at)` table and an upsert-then-act pattern, or store the event id alongside the resource being updated and use a unique constraint.

## 3. Return 2xx fast, work asynchronously

Stripe times out webhook deliveries after a few seconds and retries.

**Fail patterns — mark `medium`**:

- Handler does heavy work (sending emails, calling third-party APIs, running migrations) **before** returning the response.
- Handler awaits multiple network calls in series before `res.send`.

**Fix** — enqueue a job (BullMQ, SQS, Cloud Tasks), return 200 immediately, do the work in the worker. The worker also needs to be idempotent on `event.id`.

## 4. Replay-window tolerance

`constructEvent` defaults to a 5-minute tolerance. If the user passes a custom tolerance, flag anything > 10 minutes (`medium`) — that's the replay-attack window. Tolerance of `0` is also wrong (clock skew breaks legit deliveries).

## 5. HTTPS only and method check

**Fail** — webhook route accepts non-POST or non-HTTPS in production. Mark `medium`. Stripe will only deliver to HTTPS, but a misconfigured proxy may downgrade.

## 6. Multiple Stripe accounts / Connect

If the codebase uses Stripe Connect:

- Each connected account has its own webhook secret context (`account` events vs `Connect` events).
- Handler must check `event.account` and route to the right tenant.
- Connect webhooks should use a separate endpoint and a separate secret.

Flag any handler that uses Connect events (`account.*`, `capability.*`, `application_fee.*`) without a `event.account` lookup as `high`.

## 7. Logging that leaks PII

**Fail** — `console.log(event)` or `logger.info(event.data.object)` for `payment_method`, `customer`, `charge` events. These contain BIN, last4, billing address, email. Mark `medium`.

**Fix** — log `event.id`, `event.type`, `event.data.object.id`, and `event.livemode` only.

## What to record in the report

For each finding: file path, line numbers, the actual snippet (redact secrets), the failing condition, the fix snippet. If the Stripe MCP is connected, also list the real registered endpoints from `search_stripe_resources` for `webhook_endpoint` and compare against what the code handles — endpoints in the dashboard with no matching handler are dead routes (`info`); handlers in the code with no registered endpoint are dead code (`info`).
