# Debugging: Common Errors

## Error Reference

| Error | Likely Cause | Solution |
|---|---|---|
| `401 Unauthorized` | Wrong API key, wrong env, expired key | Check key prefix (`test_` vs `live_`) |
| `403 Forbidden` | Scope missing (`INSUFFICIENT_SCOPE`, `error.details.missing_scopes` names it), plan feature, locked account, or a company you do not reach | Add the scope to the key; retrying changes nothing. A missing scope answers `403` **before** the body or parameters are validated, so fix the scope first — a `422` may be waiting behind it |
| `404 Not Found` | Wrong resource ID or endpoint | Verify endpoint in OpenAPI spec |
| `409 Conflict` | Idempotency key in flight or reused with another body, a concurrent change, or a conflicting resource (e.g. `SERIES_FORMAT_OVERLAPS`) | Read `error.code`; see the idempotency guide |
| `422 Unprocessable Entity` | Invalid or missing fields, or a fiscal rule (`error.code` names it) | Fix the payload; `error.details` has the per-field breakdown. `beel_rules_get` with the `error_code` (MCP) names the rule behind it |
| `429 Too Many Requests` | Rate limit or monthly quota | Wait `Retry-After`, then back off with jitter; same `Idempotency-Key` |
| Can't edit invoice | Invoice is ISSUED (immutable) | Create a corrective invoice |
| Can't delete invoice | Invoice is ISSUED (immutable) | Correct it; void it (`POST /v1/companies/{company_id}/invoices/{invoice_id}/void`) only if it should never have been issued (VOI-001) |
| Can't delete customer | Customer has invoices (`409 CLIENT_HAS_INVOICES`) or an `ACTIVE`/`PAUSED` recurring invoice uses it | The customer is left untouched — `PATCH` it with `active: false` to stop using it |

## Debugging Workflow

1. **Check the status code** — see table above
2. **Read the error body** — BeeL returns the RFC 9457 fields `type`, `title` (= `error.code`), `detail` and `instance`, plus the legacy `{ success: false, error: { code, message, details }, meta }`. Branch on the code, never on the message (its language follows `Accept-Language`; English by default). `type` is a stable URI to that error's documentation page (e.g. `https://docs.beel.es/errors/INVOICE_NO_LINES`); `meta.request_id` is what support needs
3. **Verify against OpenAPI spec** — field names, types, required fields
4. **Check idempotency** — if 409, you may be reusing a key with different data

## Rate Limits

For current rate limit tiers and backoff strategies:
```bash
curl -s https://docs.beel.es/guides/rate-limits.md
curl -s https://docs.beel.es/guides/handling-errors.md
```

**`RateLimit-*` headers only come with the `429`.** Successful responses carry none, so a client cannot track its remaining budget ahead of time: retry on `429`, honouring `Retry-After`. As of writing the `429` carries `Retry-After`, `RateLimit-Limit`, `RateLimit-Remaining` and `RateLimit-Reset` — check the live docs before hardcoding those names.
