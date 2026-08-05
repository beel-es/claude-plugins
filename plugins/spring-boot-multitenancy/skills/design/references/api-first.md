# API-first contract

## Contents

- Resource shape
- Scope selection
- Authentication alternatives
- Errors
- Idempotency and concurrency
- OpenAPI rules

## Resource shape

Make ownership visible in collections:

```text
GET  /v1/companies/{companyId}/projects
POST /v1/companies/{companyId}/projects
GET  /v1/projects/{projectId}
POST /v1/projects/{projectId}/tasks
GET  /v1/tasks/{taskId}
```

Nested collections answer “which company are we listing or creating under?” Short item routes are acceptable when IDs are globally unique and both service authorization and RLS verify their ownership. Never infer permission from knowing an ID.

Account-wide operations belong under `/v1/account/...`. Cross-company reporting gets an explicit endpoint and permission rather than overloading “missing company”.

## Scope selection

The path is authoritative for a company-scoped collection. A header such as `X-Active-Company` may be used for legacy or company-implicit endpoints, but define exact precedence:

1. If path and header both exist, require equality or reject `400 scope_mismatch`.
2. Verify the selected company belongs to the authenticated account.
3. Verify the actor has access to the environment and company.
4. Build immutable context.

Never silently ignore an unauthorized selector and fall back to a primary company; that converts a caller error into a confused-deputy write.

## Authentication alternatives

Declare alternatives, not a combined requirement:

```yaml
security:
  - apiKeyAuth: []
  - sessionCookie: []
```

Use separate routes/filter chains if browser and machine behavior differs materially. Do not accept API keys in query parameters. Document the credential prefix and environment mismatch response without exposing secret structure.

## Errors

Use one machine-readable envelope, for example RFC 9457 Problem Details:

```json
{
  "type": "https://example.dev/problems/tenant-forbidden",
  "title": "Tenant access denied",
  "status": 403,
  "code": "tenant_forbidden",
  "traceId": "01J..."
}
```

- `401`: credential missing, invalid, expired or revoked.
- `403`: authenticated actor lacks action/scope.
- `404`: resource not visible; use when existence must not leak.
- `409`: idempotency conflict, version conflict or lifecycle conflict.
- `422`: syntactically valid request violates domain rules.

Choose and test a consistent `403` versus non-disclosing `404` policy.

## Idempotency and concurrency

Scope idempotency by authenticated account/environment and operation, not only by the client key:

```text
unique(account_id, environment_id, operation, idempotency_key)
```

Persist request fingerprint, status and response reference atomically with the write or via a transactional outbox. Reject key reuse with a different payload. Use `ETag`/`If-Match` or explicit versions for concurrent mutation where lost updates matter.

## OpenAPI rules

- Every operation declares security and required permission/scopes.
- Path/header scope parameters share reusable components.
- Examples use fictional IDs and names.
- Contract tests fail CI; never neutralize lint failures.
- Deprecation includes replacement, telemetry and removal criteria.
- Rate-limit dimensions include credential and tenant; expensive cross-company fan-out has stricter budgets.
