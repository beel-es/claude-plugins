# Payments playbook

Covers PaymentIntents, Charges, refunds, idempotency, SCA, and amount/currency handling.

## 1. Idempotency keys on writes

Every server-initiated POST that creates or modifies money — `paymentIntents.create`, `charges.create`, `refunds.create`, `transfers.create`, `payouts.create` — must pass an idempotency key. Without it, a network retry on your end creates a duplicate.

**Grep**:

```
rg -n "paymentIntents\.(create|update|capture|confirm)|charges\.create|refunds\.create|transfers\.create|payouts\.create"
```

**Pass**:

```ts
await stripe.paymentIntents.create(
  { amount, currency, customer: customerId },
  { idempotencyKey: `order_${orderId}_pi_v1` }   // stable per logical operation
);
```

**Fail patterns — mark `high`**:

- No second argument / no `idempotencyKey` on a write.
- Key generated with `Date.now()` or `randomUUID()` at call time — defeats the point. The key must be **stable** across retries of the same logical operation (derive from the order id, the user id + intent, etc.).
- Same key reused across different logical operations (will cause `409` and confusing failures).

**Fix** — recommend a key shaped like `${entity}_${entity_id}_${operation}_v${schema_version}`.

## 2. PaymentIntents vs legacy Charges

For new code, `Charges` API is legacy. SCA (3DS) flows do not work correctly through it.

**Grep**: `charges.create`, `Stripe::Charge.create`, `stripe.Charge.create`.

If found in **new** payment flows (not just refund/lookup), mark `low` and recommend migrating to PaymentIntents. Refunds on legacy charges are fine.

## 3. SCA / `requires_action` handling

If the codebase serves European customers, the PaymentIntent will frequently land in `requires_action` after `confirm`. The frontend needs to call `stripe.handleNextAction` (or `stripe.confirmCardPayment`).

**Grep**:

```
rg -n "requires_action|handleNextAction|confirmCardPayment|next_action"
```

**Fail patterns — mark `high`**:

- Server confirms PI and returns success to the client without checking `paymentIntent.status`.
- Code branches only on `succeeded` and treats anything else as failure (drops `requires_action`, `processing`, `requires_capture` on the floor).
- Frontend never calls `handleNextAction`.

**Fix** — show the canonical flow:

```ts
// Server returns the client_secret + status
res.json({ clientSecret: pi.client_secret, status: pi.status });

// Client
if (pi.status === 'requires_action') {
  await stripe.handleNextAction({ clientSecret });
}
```

Source-of-truth for completion is **always** the `payment_intent.succeeded` webhook, not the client response.

## 4. Amount handling

Stripe uses the smallest currency unit (cents for USD/EUR, **no decimals** for JPY, KRW).

**Fail patterns — mark `high`**:

- `amount: order.total` where `order.total` is a float (`19.99`). Will be rejected or miscoerced.
- `Math.round(price * 100)` with float prices — accumulates floating-point error on totals, taxes, discounts. Recommend integer cents end-to-end or a decimal library.
- Hardcoded `* 100` for all currencies — wrong for JPY, KRW, VND, BIF, etc. Use `stripe.currencies` zero-decimal list, or compute via `Intl.NumberFormat` and Stripe's published list.

## 5. Confirming on the server, not trusting the client

**Fail — mark `critical`**: the amount of the PaymentIntent comes from the request body. Attacker sends `amount: 1`, pays $0.01 for a $100 product.

**Pass** — server looks up the price from the database / `prices` resource by id, never accepts `amount` from the client.

## 6. Capture mode and uncaptured authorizations

If the codebase uses `capture_method: 'manual'`:

- `paymentIntents.capture` must be called within 7 days, otherwise the auth expires and you lose the funds.
- Need a webhook handler for `payment_intent.amount_capturable_updated` and a job that captures or cancels.

If `capture_method: 'manual'` is used but no capture call exists in the codebase: `high`.

## 7. Refunds

- Pass an idempotency key (see §1).
- Listen to `charge.refunded` and `charge.refund.updated` — refunds can fail asynchronously on certain payment methods.
- Don't compute refund amounts from cached order totals if the order has had partial refunds; query Stripe.

## 8. Logging

Don't log full PaymentIntent or PaymentMethod objects. They include customer email, last4, billing address. Log id + status + amount + currency.

## What to record in the report

Every finding: file:line, the actual call site, the missing field or wrong shape, the corrected snippet. If the Stripe MCP is connected, also pull `list_payment_intents` filtered to recent failures or `requires_action` and cross-reference against the code paths that should handle them.
