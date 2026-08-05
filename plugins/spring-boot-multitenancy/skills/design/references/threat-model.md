# Threat model

## Contents

- Assets and adversaries
- Abuse cases
- Seam checklist
- Administrative access

## Assets and adversaries

Protect tenant data, credentials, authorization grants, audit integrity, live/test separation and availability. Consider malicious tenant users, leaked machine keys, compromised browsers, buggy internal services, support staff, stale workers and accidental operator misuse.

## Abuse cases

| Abuse case | Required control | Proof |
| --- | --- | --- |
| Change `companyId` in path/header | membership/grant resolution + RLS | foreign-company HTTP tests |
| Guess a globally unique resource ID | resource authorization + RLS | invisible resource returns chosen 403/404 |
| Omit tenant context | fail-closed resolver and policy | zero rows/denial on pooled connection |
| Send live selector with test key | environment bound to key | authentication/scope test |
| Reuse idempotency key across tenants | scoped unique key | two-tenant concurrency test |
| Revoke membership during a write | in-transaction check/version/lock | revocation race test |
| Leak API key through logs | ingress/application redaction | captured-log test |
| Reuse a connection carrying old scope | transaction-local settings | pool reuse test |
| Execute job under ambient request scope | persisted trusted envelope | worker integration test |
| Poison cache across companies | scope-qualified keys | alternating tenant cache test |
| Move child to foreign parent | FK + `WITH CHECK` policy | cross-company update test |
| Bypass RLS as table owner | separate runtime role + FORCE RLS | runtime-role database test |
| Support role reads arbitrary rows | time-bound explicit elevation | approval and audit test |

## Seam checklist

Inspect every boundary where identity or ownership can be lost:

- reverse proxy and forwarded headers;
- CORS/CSRF and cookie scope;
- multiple Spring Security filter chains;
- method calls that bypass proxies/self-invocation;
- transaction propagation and read-only paths;
- native queries, JDBC templates and stored functions;
- entity references accepted from request bodies;
- cache keys, second-level caches and search indexes;
- file/object paths, signed URLs and export downloads;
- outbox/inbox rows, queue headers, retries and dead-letter queues;
- scheduled maintenance and analytics fan-out;
- logs, traces, metrics labels and error reporting;
- backups, migrations, consoles and operational scripts.

## Administrative access

Support access should be opt-in, time-limited and attributable. Require ticket/reason, strong reauthentication, target tenant, allowed actions and expiry. Display an unmistakable elevated mode, prohibit key creation/ownership transfer by default, and write append-only audit events. Database emergency access should use a separate credential and runbook, not a hidden application role.
