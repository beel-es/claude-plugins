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
| Can't delete invoice | Invoice is ISSUED (immutable) | Void it (POST `/invoices/{id}/void`) |
| Can't delete customer | Customer has associated invoices | Deactivate instead (soft delete) |

## Debugging Workflow

1. **Check the status code** — see table above
2. **Read the error body** — BeeL returns `{ success: false, error: { code, message } }`
3. **Verify against OpenAPI spec** — field names, types, required fields
4. **Check idempotency** — if 409, you may be reusing a key with different data

## Rate Limits

For current rate limit tiers and backoff strategies:
```bash
curl https://docs.beel.es/llms.txt | grep -i rate
```

⚠️ **Don't hardcode rate limit header names.** Check the live docs for the exact headers — they may change. As of writing, the documented headers are `RateLimit-Limit`, `RateLimit-Remaining`, and `RateLimit-Reset`.
