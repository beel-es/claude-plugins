---
name: design
description: Design a production-grade, API-first multitenant Spring Boot and PostgreSQL architecture. Use when starting a SaaS, adding tenant isolation, defining environment/account/company boundaries, choosing tenant resolution, designing API keys or browser sessions, modeling hierarchical permissions, planning PostgreSQL RLS, or producing an implementation-ready architecture package.
---

# Design Spring Boot Multitenancy

Design from verified repository evidence. Treat tenant isolation as an end-to-end security invariant, not as a repository naming convention.

## Non-negotiable properties

1. Derive identity from a verified credential; never trust tenant or permission claims sent as ordinary request data.
2. Resolve the active scope once at the request boundary and carry an immutable context through authorization, transactions and observability.
3. Keep the public API explicit about resource ownership while avoiding repeated scope columns on every leaf table.
4. Enforce access twice: application authorization for intent and PostgreSQL RLS for row isolation.
5. Fail closed when any required context axis is absent, malformed, unauthorized or stale.
6. Set database context transaction-locally on the same connection that executes tenant SQL.
7. Test negative space: cross-tenant reads, writes, identifiers, caches, jobs, exports and retries.

## Workflow

### 1. Inspect before proposing

Read build files, Spring Security configuration, controllers/OpenAPI, persistence mappings, migrations, async jobs, caches and tests. Record every claim as `VERIFIED`, `INFERRED` or `OPEN`. Do not invent repository facts.

### 2. Model the axes

Use the neutral project-management domain in [data-model.md](references/data-model.md):

- `environment`: immutable data plane such as `TEST` or `LIVE`;
- `account`: authentication, billing and credential-ownership boundary;
- `company`: business and data-ownership boundary beneath an account;
- `project` and `task`: ordinary aggregates proving scope inheritance without copying every axis to every row.

Read [architecture.md](references/architecture.md). Produce the ownership graph, cardinalities, lifecycle rules and invariants before choosing annotations or filters.

### 3. Design the API first

Read [api-first.md](references/api-first.md). Define OpenAPI paths, authentication alternatives, scope selection, error semantics, idempotency, pagination and deprecation before persistence details. Prefer nested collection paths for explicit ownership. Opaque globally unique item IDs may use short paths only when authorization and RLS validate ownership.

### 4. Separate authentication from authorization

Read:

- [api-keys.md](references/api-keys.md) for machine credentials, hashing, lookup prefixes, scopes, expiry, overlap rotation and revocation;
- [browser-sessions.md](references/browser-sessions.md) for session cookies, CSRF, fixation, concurrency and logout;
- [permissions.md](references/permissions.md) for account roles, company grants, scopes and deny-by-default evaluation;
- [spring-security.md](references/spring-security.md) for filter-chain placement and principal/context types.

Never let an API key impersonate a browser session or let a transport credential become the authorization model.

### 5. Design database isolation

Read [postgresql-rls.md](references/postgresql-rls.md) and [transaction-boundaries.md](references/transaction-boundaries.md). Specify table ownership, runtime roles, `ENABLE` plus `FORCE ROW LEVEL SECURITY`, fail-closed policies, transaction-local settings and safe behavior for connection pools, nested transactions, async work and migrations.

### 6. Threat-model every seam

Read [threat-model.md](references/threat-model.md). Cover confused deputy attacks, IDOR, missing context, stale grants, key disclosure, cache bleed, background jobs, event consumers, file storage and logs.

### 7. Produce the implementation package

Use [output-contract.md](references/output-contract.md). Build the adversarial matrix from [testing.md](references/testing.md), define production controls from [operations.md](references/operations.md), and verify version-sensitive claims against [sources.md](references/sources.md). The result must include verified inventory, target architecture, ADRs, OpenAPI, logical model, migration plan, filter chains, authorization matrix, RLS, credential lifecycle, rollback points and an executable isolation matrix.

Copy and adapt the templates under `assets/`; resolve every placeholder.

## Stop conditions

Do not call the design complete if a request can reach tenant data without all required axes, if a pooled connection can retain context across requests, if background work has no trusted scope envelope, or if only positive-path tests exist.
