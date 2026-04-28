# Stripe MCP setup

The official Stripe MCP server lets the auditor read **live** account state — registered webhook endpoints, the dashboard's default API version, recent failed PaymentIntents, current subscription statuses. Without it the audit is static-only (codebase + docs).

## Detecting whether it's already configured

Run:

```bash
claude mcp list
```

You're looking for an entry like:

```
stripe   https://mcp.stripe.com/   http   ✓
```

If absent, propose installing it (see below). If present, confirm authentication with `claude /mcp` — OAuth must show as `connected` for `stripe`.

## Install (Claude Code)

```bash
claude mcp add --transport http stripe https://mcp.stripe.com/
```

Then in Claude Code:

```
/mcp
```

Pick `stripe`, complete OAuth in the browser. The token is per-user; restricted-API-key bearer auth is also supported but not recommended for interactive auditing — stick to OAuth.

## Read-only audit posture

For the auditor we **only** use read tools. Never invoke any of the write tools, even if the user asks "while you're there, can you also...":

- ✅ Allowed: `get_stripe_account_info`, `retrieve_balance`, `list_*` tools, `search_stripe_resources`, `fetch_stripe_resources`, `search_stripe_documentation`.
- ❌ Disallowed during audit: `create_*`, `update_*`, `cancel_*`, `finalize_invoice`, `create_refund`. If the user wants to change account state, that's a separate task, not part of the audit.

## What live data unlocks

| Check                                          | Tool                                     | What you learn                                                                 |
|------------------------------------------------|------------------------------------------|--------------------------------------------------------------------------------|
| Account default API version                    | `get_stripe_account_info`                | Compare against the version pinned in code.                                    |
| Registered webhook endpoints + enabled events  | `search_stripe_resources` + `webhook_endpoint` | Endpoints in the dashboard with no handler in code (dead routes), and missing event subscriptions for handlers that exist. |
| Recent SCA-required PaymentIntents             | `list_payment_intents` (filter)          | Concrete proof that `requires_action` is reaching the system — handler must cope. |
| Subs in past_due / unpaid                      | `list_subscriptions` (filter)            | Real dunning state — confirms whether `invoice.payment_failed` handling matters now or hypothetically. |
| Disputes / refunds                             | `list_disputes`, refund listing via search | Volume + recency — informs whether handlers for those flows are exercised.    |

## If the user declines to install the MCP

That's fine. Proceed in **static-only** mode. In the report, add a top-level note:

> _Run in static-only mode. Live account checks (webhook endpoint registry, dashboard API version, recent failure data) were not available. Re-run with the Stripe MCP attached for higher-confidence findings on these items._

## Removing the MCP after the audit

```bash
claude mcp remove stripe
```

Tokens stay on Stripe's side — revoke them from Dashboard → User settings → OAuth sessions.
