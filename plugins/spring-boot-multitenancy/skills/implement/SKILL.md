---
name: implement
description: Implement or migrate API-first multitenancy in an existing Spring Boot and PostgreSQL codebase. Use when adding tenant context, API-key or session authentication, hierarchical permissions, Flyway RLS policies, tenant-safe repositories, token rotation, isolation tests, or executing an approved multitenancy design in reversible phases.
---

# Implement Spring Boot Multitenancy

Implement the smallest vertical slice that proves isolation from HTTP request to PostgreSQL. Preserve existing behavior unless the approved contract changes it.

## Required inputs

Find or produce the architecture package defined by `../design/references/output-contract.md`. If decisions are missing, invoke `/spring-boot-multitenancy:design` before changing production code.

## Execution order

1. **Characterize**: add tests around current authentication, representative reads/writes, transactions, jobs and error responses.
2. **Contract**: update OpenAPI first. Add scope-selection and error semantics without silently changing old routes.
3. **Identity**: implement credential parsing and verification. Store only hashes for API-key secrets. Keep browser and API filter chains explicit.
4. **Context**: introduce immutable `Actor` and `TenantContext` values. Resolve environment/account/company once; reject unauthorized or ambiguous selection.
5. **Authorization**: centralize permission evaluation. Use coarse route checks plus resource-aware service checks; do not scatter role strings.
6. **Data model**: add parent ownership links and constraints. Backfill and verify before making them non-null.
7. **RLS shadow mode**: create policies, a non-owner runtime role and integration tests before switching application traffic.
8. **Enforce**: set transaction-local context on the same connection, enable and force RLS, then move one aggregate at a time.
9. **Async and caches**: use explicit trusted scope envelopes and tenant-qualified keys. Never copy a request `ThreadLocal` into a pool.
10. **Credentials**: add creation, overlap rotation, revocation, audit events and operational metrics.
11. **Retire compatibility**: remove fallbacks only after telemetry proves no callers remain.

Read the exact topic references under `../design/references/` before editing that seam. Use [implementation-plan.md](references/implementation-plan.md) for migration gates and rollback criteria.

## Coding rules

- Keep controllers thin; resolve context in security/boundary components and authorize business intent in services.
- Do not accept `account_id`, `company_id`, roles or scopes from JSON bodies as authority.
- Do not use Hibernate filters as the only isolation boundary.
- Do not call `SET` on a pooled connection outside a transaction. Use transaction-local PostgreSQL settings.
- Do not build RLS policies with `current_setting(..., true) IS NULL OR ...`.
- Do not catch an RLS denial and retry with an elevated role.
- Include tenant scope in idempotency, cache and uniqueness keys where semantics are tenant-local.
- Redact secrets; log key IDs or fingerprints, never key material or session IDs.

## Verification gate per phase

Run unit tests, repository tests against real PostgreSQL, HTTP security tests and the negative matrix from `../design/references/testing.md`. Prove rollback before advancing. Report changed files, verified guarantees, residual risks and the next safe phase.
