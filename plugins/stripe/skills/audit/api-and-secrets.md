# API version & secrets playbook

## 1. API version pinning

Stripe pins the version per request. If you don't pin, you inherit the account default — and your code may silently break the day Stripe (or someone else on the team) bumps the dashboard default.

**Grep**:

```
rg -n "apiVersion|api_version|Stripe\(" --type-add 'web:*.{js,ts,py,rb,go,php}' -t web
```

**Pass — Node**:

```ts
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.preview',  // pinned
});
```

**Fail patterns**:

- No `apiVersion` passed (`high`) — you're at the mercy of the account default.
- Hardcoded version > 18 months old (`high`) — many breaking changes since, including SCA defaults and webhook payloads.
- Hardcoded version 6–18 months old (`medium`) — behind, plan an upgrade.
- Different services pinning different versions (`medium`) — webhook payload shapes will differ between services and the deduper / tax / dispute flows can drift.

If the Stripe MCP is connected, also run `get_stripe_account_info` and report the dashboard default. Code version ≠ dashboard version is fine in itself (request-level pin wins), but flag if the dashboard default is much older than the code version (events sent without `api_version_override` will use the dashboard default — affects webhook payloads).

## 2. Secret key handling

**Critical fails** (mark `critical` and stop everything):

- A real `sk_live_…` or `rk_live_…` key in committed code or in `.env` files tracked by git. Redact in the report. Tell the user to **rotate the key in the dashboard immediately** — the audit must not rotate it.
- Secret key in client bundle (search `client/`, `web/`, `app/`, `frontend/`, anything served to a browser, for `sk_live_`, `sk_test_`, `rk_`).

**Grep**:

```
rg -n "sk_live_|sk_test_|rk_live_|rk_test_" --hidden -g '!.git'
rg -n "STRIPE_SECRET_KEY|STRIPE_RESTRICTED_KEY" --hidden -g '!.git'
git log --all -p -S 'sk_live_' -S 'sk_test_' -- 2>/dev/null | head -50
```

(Last command checks history — keys leaked in old commits are still leaked, even after a force-push.)

## 3. Restricted keys

Server-to-server jobs that only need a few resources should use **restricted keys**, not the full secret key.

**Fail — `medium`**: a worker that only refunds disputed charges uses the global secret. Recommend a restricted key with the minimum scopes (`charges:write`, `disputes:read`).

If the Stripe MCP is connected, the user can audit live key scopes via the dashboard — but the MCP itself doesn't expose key listings.

## 4. Publishable key handling

`pk_live_…` is meant to be public, that's fine. But:

**Fail — `medium`**: the same publishable key is hardcoded across multiple environments instead of read from env. Annoying when rotating.

## 5. Webhook secrets

Same rules as the secret key: never client-side, never committed, one per endpoint. See [webhooks.md](webhooks.md) §1.

## 6. Logging

`stripe-node` and most SDKs include the request id in errors. Surface it.

**Pass**:

```ts
catch (err) {
  if (err instanceof Stripe.errors.StripeError) {
    logger.error({ requestId: err.requestId, code: err.code, type: err.type }, 'stripe error');
  }
}
```

**Fail — `low`**: catching Stripe errors and logging only `err.message` — debugging with Stripe support requires the request id.

## 7. Network resilience

- The official SDKs auto-retry 5xx. Don't add a second retry layer on top — you'll multiply the request rate during incidents.
- If you wrap calls in your own retry, **propagate the idempotency key**, otherwise you re-create instead of retrying. Mark `high` if a custom retry exists without idempotency forwarding.

## What to record in the report

For leaked keys: file:line redacted, plus a separate **"Action required immediately"** callout at the top of the report. For version drift: code version vs dashboard version (if MCP), and the upgrade path (changelog URL).
