# Audit checklist

Mark each item `PASS`, `FAIL`, `UNVERIFIED` or `NOT_APPLICABLE` with evidence.

## Identity and credentials

- All security chains and route matchers are exhaustive and correctly ordered.
- API keys are high entropy, hashed, environment-bound, scoped, expiring and revocable.
- Browser cookies use secure attributes; session fixation and CSRF are handled.
- Revocation latency is defined and tested.

## Context and authorization

- Actor and tenant context are separate immutable concepts.
- Selectors are validated against authenticated account/company access.
- Missing/invalid selectors fail closed without fallback.
- Permissions combine scopes, account role, company grant and resource rules.
- Check and mutation do not have an exploitable TOCTOU gap.

## Persistence

- Every tenant table has a single ownership path and classification.
- Runtime role is not owner/superuser/`BYPASSRLS`.
- Protected tables have enabled and forced RLS with `USING` and `WITH CHECK`.
- Context is transaction-local on the same connection as tenant SQL.
- Native/bulk/stored-function paths remain isolated.

## Non-HTTP seams

- Jobs/messages persist a trusted explicit scope and revalidate authority.
- Cache, idempotency, search, files and exports include scope.
- Logs and traces redact credentials and sensitive payloads.
- Admin/support access is explicit, time-bounded and audited.

## Tests and operations

- Tests use real PostgreSQL and the runtime role.
- Cross-company, cross-account, cross-environment and missing-context cases exist.
- Pool reuse, concurrency, rotation and revocation are tested.
- Migration, incident and credential runbooks exist and are exercised.
