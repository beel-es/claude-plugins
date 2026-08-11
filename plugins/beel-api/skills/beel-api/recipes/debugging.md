# Debugging: Common Errors

## Error Reference

| Error | Likely Cause | Solution |
|---|---|---|
| `401 Unauthorized` | Wrong API key, wrong env, expired key | Check key prefix (`test_` vs `live_`) |
| `403 Forbidden` | Key lacks permissions | Check key scopes in dashboard |
| `404 Not Found` | Wrong resource ID or endpoint | Verify endpoint in OpenAPI spec |
| `409 Conflict` | Duplicate or business rule violation | Check `Idempotency-Key`, check invoice status |
| `422 Unprocessable Entity` | Invalid fields or missing required fields | Fetch OpenAPI spec, verify field names and types |
| `429 Too Many Requests` | Rate limit exceeded | Implement exponential backoff, check rate limit headers (see docs) |
| Can't edit invoice | Invoice is ISSUED (immutable) | Create a corrective invoice |
| Can't delete invoice | Invoice is ISSUED (immutable) | Void it (`POST /v1/companies/{company_id}/invoices/{invoice_id}/void`) |
| Can't delete customer | Customer has associated invoices (`409 CLIENT_HAS_INVOICES`) | The customer is left untouched — update it with `active: false` (not `is_active`) to stop using it |

## Debugging Workflow

1. **Check the status code** — see table above
2. **Read the error body** — BeeL returns `{ success: false, error: { code, message, details } }` plus the RFC 9457 fields `type`, `title`, `detail` and `instance`. `type` is a stable URI to that error's documentation page (e.g. `https://docs.beel.es/errors/INVOICE_NO_LINES`)
3. **Verify against OpenAPI spec** — field names, types, required fields
4. **Check idempotency** — if 409, you may be reusing a key with different data

## Rate Limits

For current rate limit tiers and backoff strategies:
```bash
curl https://docs.beel.es/llms.txt | grep -i rate
```

**`RateLimit-*` headers only come with the `429`.** Successful responses carry none, so a client cannot track its remaining budget ahead of time: retry on `429`, honouring `Retry-After`. As of writing the `429` carries `Retry-After`, `RateLimit-Limit`, `RateLimit-Remaining` and `RateLimit-Reset` — check the live docs before hardcoding those names.
