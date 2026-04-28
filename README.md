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

**Install** (skip the first line if you've already added the marketplace):

```
/plugin marketplace add beel-es/claude-plugins
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

Each area can be run on its own. `/stripe:audit` (no scope) runs all of them.

##### Webhooks

```
/stripe:audit webhooks
```

The most common source of production incidents: forged events, double-fulfillment on retries, dropped deliveries.

- Signature verification + raw-body parsing
- Per-endpoint secret hygiene
- Event-ID deduplication
- Async processing (return 2xx fast)
- Replay-window tolerance
- HTTPS / method enforcement
- Stripe Connect routing
- PII in logs
- Dead routes vs handlers _(live, with MCP)_

##### Payments

```
/stripe:audit payments
```

PaymentIntents, charges and refunds — idempotency, SCA, amount handling.

- Idempotency keys on every write (`paymentIntents.create`, `refunds.create`, etc.)
- Stable key shape (no `Date.now()` / `randomUUID()`)
- SCA / `requires_action` flow not dropped
- Amount type bugs (floats, zero-decimal currencies)
- Server-trusted amounts (the `$0.01 for $100` attack)
- Manual capture without a capture call
- Refund async handling
- PII in logs
- Recent failed PIs cross-check _(live, with MCP)_

##### Subscriptions

```
/stripe:audit subscriptions
```

Proration, dunning and lifecycle — most subscription bugs only show up at month-end.

- Explicit `proration_behavior` on plan changes
- Idempotency / in-flight lock on plan changes
- Dunning handlers for the four critical events (`invoice.payment_failed`, `subscription.updated → past_due`, `subscription.deleted`, `invoice.payment_succeeded`)
- Trial logic uses Stripe state, not app state
- Cancel flow respects `cancel_at_period_end`
- Metered billing idempotency
- `automatic_tax` requirements
- Live `past_due` / `unpaid` cross-check _(live, with MCP)_

##### API version & secrets

```
/stripe:audit secrets
```

Version pinning and key hygiene — leaked keys, drift, missing pins.

- API version pinned in code
- Stale or drifting versions across services
- Code vs dashboard version mismatch _(live, with MCP)_
- Live keys in source **and git history**
- Secret keys in client bundles
- Restricted-key hygiene for server-to-server jobs
- Webhook secret handling
- Error logging captures `requestId` / `code` / `type`
- Custom retry layers without idempotency forwarding

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
