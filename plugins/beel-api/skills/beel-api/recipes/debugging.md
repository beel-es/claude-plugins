# Debugging: Common Errors

## Error Reference

| Error | Likely Cause | Solution |
|---|---|---|
| `401 Unauthorized` | Wrong API key, wrong env, expired key | Check key prefix (`test_` vs `live_`) |
| `403 Forbidden` | Key lacks a scope, or the `{company_id}` / `{account_id}` in the path is not yours to reach | `error.details.missing_scopes` names missing scopes; check the ids in the path |
| `404 Not Found` | Wrong resource ID or endpoint | Verify endpoint in OpenAPI spec |
| `409 Conflict` | Duplicate or business rule violation | Check `Idempotency-Key`, check invoice status |
| `422 Unprocessable Entity` | Invalid fields or missing required fields | Verify field names and types in the operation's page |
| `429 Too Many Requests` | Rate limit exceeded | Implement exponential backoff, check rate limit headers (see docs) |
| Can't edit or delete an invoice (`STATUS_NOT_MODIFIABLE`, `STATUS_NOT_DELETABLE`) | It is issued: never edited or deleted (LIF-001) | Wrong data → corrective invoice (COR-001); should never have been issued → void it (VOI-001) |
| Can't delete customer | Customer has associated invoices (`409 CLIENT_HAS_INVOICES`) | The customer is left untouched — update it with `active: false` (not `is_active`) to stop using it |

## Debugging Workflow

1. **Check the status code** — see table above
2. **Read the error body** — BeeL. returns `{ success: false, error: { code, message, details } }` plus the RFC 9457 fields `type`, `title`, `detail` and `instance`. `type` is a stable URI to that error's documentation page (e.g. `https://docs.beel.es/errors/INVOICE_NO_LINES`). Messages are in English unless you send `Accept-Language`, so **branch on `code`, never on the message**
3. **Find the rule behind the code** — `/beel-api:rules` maps error codes to the fiscal rules that produce them
4. **Verify against the OpenAPI spec** — field names, types, required fields
5. **Check idempotency** — `409 IDEMPOTENCY_KEY_MISMATCH` means a key reused with a different body or path

## Rate Limits

For current rate limit tiers and backoff strategies:
```bash
curl -s https://docs.beel.es/guides/rate-limits.md
```

**`RateLimit-*` headers only come with the `429`.** Successful responses carry none, so a client cannot track its remaining budget ahead of time: retry on `429`, honouring `Retry-After`. As of writing the `429` carries `Retry-After`, `RateLimit-Limit`, `RateLimit-Remaining` and `RateLimit-Reset` — check the live docs before hardcoding those names.
