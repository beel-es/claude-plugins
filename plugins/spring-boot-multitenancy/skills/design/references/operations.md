# Operations and observability

## Contents

- Logs, traces and metrics
- Credential operations
- Tenant incidents
- Backups and migrations

## Logs, traces and metrics

Record actor type/ID, credential ID or fingerprint, environment, account, company, action, decision, policy version and trace ID. Never record API-key secrets, Authorization headers, session IDs or full sensitive payloads.

Tenant IDs can create high-cardinality metrics. Keep them in structured logs/traces and use bounded dimensions for metrics. Useful measures:

- authentication failures by credential type/reason class;
- tenant-resolution failures and selector mismatches;
- authorization denials by permission;
- RLS/context initialization failures;
- key creation, rotation, expiry and revocation lag;
- cross-company fan-out duration/size;
- jobs rejected for stale authorization.

Audit events should be append-only, time-ordered, access-controlled and retained according to policy. Separate audit records from debug logs.

## Credential operations

Runbooks must cover create, one-time reveal, rotate with overlap, revoke, expire, list last use, compromise response and pepper rotation. Pepper rotation can support versioned peppers and lazy rehash on successful verification; never require plaintext recovery.

Alert on old predecessor keys used near/after overlap deadline, broad keys touching unusual companies and repeated invalid credentials.

## Tenant incidents

For suspected cross-tenant access:

1. preserve logs/audit and stop risky paths;
2. revoke implicated credentials/sessions;
3. identify actor, context, queries, rows and time window;
4. verify whether exposure or mutation occurred;
5. patch the invariant and add a regression test;
6. assess notification obligations under applicable policy/law;
7. document root cause across application and database layers.

## Backups and migrations

RLS does not automatically provide tenant-scoped restore. Define whether restores are whole database or logical tenant exports. Backup roles are privileged and must be isolated from application credentials.

DDL migrations run with an owner role; their validation runs again as runtime role. A migration that adds a tenant table must add ownership, indexes, RLS, policies and tests in the same deployable sequence. Monitor lock duration and provide rollback/roll-forward plans for policy changes.
