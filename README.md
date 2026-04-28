# BeeL Claude Plugins

Official [Claude Code](https://claude.ai/claude-code) plugins for the [BeeL](https://beel.es) invoicing API.

## Contents

- [Install](#install)
- [Plugins](#plugins)
  - [`beel-api`](#beel-api) — BeeL invoicing API integration guide
  - [`stripe`](#stripe) — read-only Stripe integration auditor
    - [What gets audited](#what-gets-audited)
      - [Webhooks](#webhooks)
      - [Payments](#payments)
      - [Subscriptions](#subscriptions)
      - [API version &amp; secrets](#api-version--secrets)
    - [Output](#output)
    - [Hard rules](#hard-rules)
- [Auto-enable for your project](#auto-enable-for-your-project)
- [License](#license)

## Install

Open Claude Code in any project and run:

```
/plugin marketplace add beel-es/claude-plugins
/plugin install beel-api@beel
```

That's it. Claude will automatically activate the skill when you work with the BeeL API, or you can invoke it manually with `/beel-api`.

## Plugins

### `beel-api`

Gives Claude everything it needs to integrate the BeeL API correctly:

- Base URL, authentication, and environment setup
- Idempotency requirements (required on all POST requests)
- Response and error envelope formats
- Invoice types, statuses, and lifecycle
- How to generate typed clients from the live OpenAPI spec
- Where to fetch always-current docs (`/llms.txt`, `/llms-full.txt`, `/api/openapi`)

**Docs**: [docs.beel.es/docs/claude-code](https://docs.beel.es/docs/claude-code)

### `stripe`

Read-only auditor for Stripe integrations. Scans your codebase (and, optionally, your live Stripe account via the official Stripe MCP) and returns a structured report with **finding → severity → evidence → fix** for every issue.

**Install:**

```
/plugin install stripe@beel
```

**Run:**

```
/stripe:audit              # full audit
/stripe:audit webhooks     # only webhooks
/stripe:audit payments     # only PaymentIntents / charges / refunds
/stripe:audit subscriptions
/stripe:audit secrets      # API keys + version pinning
```

The plugin will detect whether the [Stripe MCP](https://docs.stripe.com/mcp) is connected and offer to install it for higher-confidence findings (live webhook endpoints, dashboard API version, recent failed events, real subscription state).

#### What gets audited

##### Webhooks

Most production incidents start here.

- **Signature verification.** Detects handlers that don't call `stripe.webhooks.constructEvent` (or its equivalent in Python/Ruby/Go/PHP).
- **Raw body parsing.** Catches the classic `app.use(express.json())` bug that silently breaks signature checks.
- **Per-endpoint secrets.** Flags a single shared secret across multiple endpoints, hardcoded secrets, or wrong env var names.
- **Swallowed signature errors.** Detects `try { constructEvent } catch { /* ignore */ }`.
- **Event-ID deduplication.** Checks that handlers store `event.id` before running side effects, so Stripe's retries don't double-fulfill.
- **Async processing.** Flags handlers that do heavy work (emails, third-party calls) before returning 2xx, which causes timeouts and retries.
- **Replay-window tolerance.** Catches custom tolerances >10min (replay attack window) or `0` (clock skew breaks legit deliveries).
- **HTTPS / method enforcement.** Flags routes that accept non-POST or non-HTTPS in production.
- **Connect handling.** For Stripe Connect codebases: checks `event.account` routing and separate Connect endpoints.
- **PII leakage.** Flags `console.log(event)` for events containing customer email, BIN, last4, billing addresses.
- **Dead routes / dead handlers** _(live only)._ With the Stripe MCP connected, cross-references registered webhook endpoints against handlers in code.

##### Payments

PaymentIntents, charges, refunds.

- **Idempotency keys on writes.** Every `paymentIntents.create`, `charges.create`, `refunds.create`, `transfers.create`, `payouts.create` must pass an `idempotencyKey`. Flags missing keys, keys generated with `Date.now()` / `randomUUID()` (defeats the point), and keys reused across different operations.
- **Stable key shape.** Recommends keys derived from logical entities (`order_${id}_pi_v1`) over per-call randomness.
- **Legacy Charges API.** Flags new code using `charges.create` instead of PaymentIntents (SCA flows don't work correctly through legacy charges).
- **SCA / `requires_action`.** Detects code that branches only on `succeeded` and silently drops `requires_action`, `processing`, `requires_capture`. Verifies the frontend calls `handleNextAction`.
- **Trusting the source of completion.** Flags codebases that mark orders paid based on the client response instead of the `payment_intent.succeeded` webhook.
- **Amount type bugs.** Catches floats passed as `amount`, `Math.round(price * 100)` accumulating rounding errors, and hardcoded `* 100` for currencies that are zero-decimal (JPY, KRW, VND, BIF, etc).
- **Server-trusted amounts.** Flags handlers that take `amount` from the request body — the canonical "$0.01 for a $100 product" attack.
- **Manual capture without capture.** If `capture_method: 'manual'` is used but no `paymentIntents.capture` exists in the codebase (auths expire after 7 days = lost funds).
- **Refund handling.** Idempotency on refund creation, plus subscriptions to `charge.refunded` and `charge.refund.updated` (refunds can fail asynchronously).
- **Object logging.** Flags logging full PaymentIntent / PaymentMethod objects (PII).
- **Recent failures cross-check** _(live only)._ With the MCP, lists recent `requires_action` and failed PIs and verifies handler coverage.

##### Subscriptions

Proration, dunning, lifecycle.

- **Explicit `proration_behavior`.** Flags `subscriptions.update` calls that change items/price without setting `proration_behavior` — defaults differ across API versions.
- **Plan-change idempotency.** Detects user-initiated plan changes without idempotency keys or in-flight locks (double-click → double charge).
- **Dunning coverage.** Verifies handlers exist for the four critical events:
  - `invoice.payment_failed` (notify the user)
  - `customer.subscription.updated` → `past_due` / `unpaid` (restrict access)
  - `customer.subscription.deleted` (revoke access)
  - `invoice.payment_succeeded` (restore access)
- **Trial logic.** Flags trials implemented in app code instead of via `trial_period_days` / `trial_end`. Catches missing `customer.subscription.trial_will_end` handlers.
- **Cancel flow.** Detects code that revokes access immediately when using `cancel_at_period_end: true` (customer paid through end of period and lost access early).
- **Metered / usage-based billing.** Flags `usage_records.create` calls without idempotency on the upstream event (double-reporting aggregates).
- **Automatic tax misconfiguration.** If `automatic_tax` is enabled, verifies the code collects the customer address and tax IDs; otherwise invoices fail to finalize.
- **Live dunning state** _(live only)._ With the MCP, lists subs in `past_due` / `unpaid` and cross-references handler coverage.

##### API version & secrets

- **API version pinning.** Flags Stripe SDK initialization without `apiVersion` (you inherit the dashboard default, which can change under you).
- **Stale pinned versions.** Versions 6–18 months old → `medium`; >18 months → `high` (SCA defaults and webhook payload shapes have shifted).
- **Version drift across services.** Flags different services in the same monorepo pinning different API versions (webhook payload shapes will differ).
- **Code vs dashboard version mismatch** _(live only)._ Compares the pinned version against the account's dashboard default.
- **Live keys in source.** Greps for `sk_live_…`, `rk_live_…`, `sk_test_…`, `rk_test_…` across the working tree and **git history** (`git log -S`) — keys leaked in old commits are still leaked, even after force-pushes. Surfaces as `critical` with a "rotate now in dashboard" callout. The auditor never rotates keys itself.
- **Secret keys in client bundles.** Scans `client/`, `web/`, `app/`, `frontend/` for any `sk_` / `rk_` strings that would ship to a browser.
- **Restricted-key hygiene.** Flags server-to-server jobs using the global secret when a restricted key would do.
- **Webhook secret handling.** Same rules as the secret key — never client-side, never committed, one per endpoint.
- **Error logging quality.** Flags catches that drop `requestId` / `code` / `type` from `Stripe.errors.StripeError` (debugging with Stripe support requires the request id).
- **Custom retry layers.** Flags hand-rolled retries on top of the SDK without idempotency-key forwarding (re-creates instead of retrying).

#### Output

A single Markdown report with:

- A summary table of findings by severity (`critical` / `high` / `medium` / `low` / `info`).
- An "Action required immediately" callout if any `critical` items exist.
- One section per finding: file:line, the actual snippet (secrets redacted), why it matters in concrete terms, and the fix snippet.
- A "What looked fine" section for areas that passed.
- An optional, brief "Invoicing & compliance" section for Spanish projects.

#### Hard rules

The auditor is **read-only**. It will never edit code, call any Stripe write API (`create_*`, `update_*`, `cancel_*`, `create_refund`), or rotate keys — even if it finds a leaked one.

## Auto-enable for your project

Add this to your project's `.claude/settings.json` to suggest the marketplace automatically when the project is opened:

```json
{
  "extraKnownMarketplaces": {
    "beel": {
      "source": {
        "source": "github",
        "repo": "beel-es/claude-plugins"
      }
    }
  }
}
```

## License

MIT
