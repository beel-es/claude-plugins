# Subscriptions playbook

Subscription bugs are usually quiet and only show up at month-end or on plan changes. Be thorough.

## 1. Proration set explicitly

`subscriptions.update` with a new price has different defaults across API versions and across Billing/Subscriptions modes. Don't rely on the default — pass `proration_behavior` explicitly.

**Grep**:

```
rg -n "subscriptions\.update|Subscription\.update|subscription_items\.update"
```

**Fail — `medium`**: `subscriptions.update` changing `items[].price` without `proration_behavior` set. The customer ends up with a charge they didn't expect, or no charge when one was due.

**Pass**:

```ts
await stripe.subscriptions.update(subId, {
  items: [{ id: itemId, price: newPriceId }],
  proration_behavior: 'create_prorations', // or 'none' / 'always_invoice', explicit
});
```

## 2. Plan-change idempotency and race conditions

Double-clicking "upgrade" → two updates → two prorations → angry customer.

**Fail — `high`**:

- `subscriptions.update` calls without an idempotency key on user-initiated plan changes.
- Plan-change endpoints with no in-flight lock (`UPDATE subs SET status='changing' WHERE id=? AND status='active'`).

**Fix** — idempotency key per `(subscription_id, target_price_id, customer_request_id)` or a DB-level lock.

## 3. Dunning — failed payments

Card declines on renewal are routine. The integration must handle them.

**Grep**:

```
rg -n "invoice\.payment_failed|customer\.subscription\.updated|customer\.subscription\.deleted|past_due|unpaid"
```

**Required webhook handlers**:

- `invoice.payment_failed` → notify the user, no service downgrade yet.
- `customer.subscription.updated` with `status` transitions to `past_due` or `unpaid` → restrict access according to plan.
- `customer.subscription.deleted` → revoke access.
- `invoice.payment_succeeded` → restore access if previously restricted.

If any of those four are missing handlers, mark `high` (`payment_failed`, `subscription.deleted`) or `medium` (the others).

Verify the Stripe **smart retries** / **revenue recovery** settings in the dashboard match the code's expectations. If the MCP is connected, list webhook endpoints and their `enabled_events` to confirm these events are actually subscribed.

## 4. Trials

**Fail — `medium`**:

- Trial logic implemented in app code instead of via `trial_period_days` / `trial_end` on the subscription. Easy to drift from Stripe state.
- No handler for `customer.subscription.trial_will_end` → users hit a charge they didn't expect.

## 5. Cancel flow

**Pass**:

```ts
// "Cancel at end of period" — preferred
await stripe.subscriptions.update(subId, { cancel_at_period_end: true });

// "Cancel now" — only if you're refunding
await stripe.subscriptions.cancel(subId, { /* invoice_now, prorate */ });
```

**Fail — `medium`**: app revokes access immediately when the user clicks cancel but uses `cancel_at_period_end: true`. Customer paid through end of period and lost access early.

## 6. Quantity / metered billing

If the integration uses `usage_records.create` or quantity-based seats:

- Must be idempotent on the upstream event (e.g. seat-add request id).
- Watch out for double-reporting on retries — usage records aggregate.

Mark `high` if usage reporting has no idempotency key.

## 7. Tax behavior

If `automatic_tax` is enabled, the customer needs a complete address (and a VAT/tax ID for EU B2B). If automatic tax is on but the code doesn't collect or set `customer.address` / `customer.tax_id_data`, mark `medium` — invoices will fail to finalize.

## What to record in the report

Per finding: subscription endpoint, the call site, the missing flag or handler, the fix. With Stripe MCP, also run `list_subscriptions` filtered by `status=past_due` and `status=unpaid` and cross-reference against handler coverage — if there are 50 subs in `past_due` and no `invoice.payment_failed` handler, that's a concrete `high` with live evidence.
