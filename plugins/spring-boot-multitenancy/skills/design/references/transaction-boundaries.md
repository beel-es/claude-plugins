# Transactions, connection pools and asynchronous work

## Contents

- JDBC transaction seam
- Pool safety
- Nested transactions
- Async and messaging
- Caches and idempotency

## JDBC transaction seam

RLS context and tenant SQL must use the same physical connection and transaction. Setting context in a servlet filter before Spring opens a transaction is unsafe: the repository may acquire a different pooled connection.

Use a transaction-aware component invoked after transaction begin, for example a service interceptor/aspect ordered inside `@Transactional`, a custom transaction template, or a repository gateway that obtains the bound `EntityManager`/connection and executes `set_config(..., true)` before domain SQL.

Add a guard query or datasource proxy in tests to prove context is set before the first tenant statement.

## Pool safety

Transaction-local settings reset at transaction end, including rollback. Still test pool reuse:

1. request A sets company A and commits;
2. request B with missing context reuses the connection;
3. B must see zero rows/fail, never A's rows.

Avoid session-level `SET app.company_id = ...`. If unavoidable for a special tool, `RESET ALL` on every return path is mandatory but weaker than transaction-local settings.

Use `autoCommit=false` within the managed transaction. Verify read-only transactions also initialize context.

## Nested transactions

`REQUIRED` shares context. `REQUIRES_NEW` may acquire another connection and must initialize the same trusted context independently. Reject attempts to change tenant inside an existing transaction. Cross-tenant fan-out should execute one isolated transaction per tenant rather than mutating context mid-transaction.

## Async and messaging

Never rely on request `ThreadLocal` in `@Async`, schedulers or consumers. Persist a trusted envelope:

```text
job_id, actor_type, actor_id, environment_id, account_id, company_id,
requested_action, authorization_version, created_at
```

Consumers load the job, revalidate current authorization when acting on behalf of a user, create a fresh context and transaction, and make side effects idempotent. Sign external message envelopes or resolve scope from server-owned identifiers. Never trust arbitrary tenant headers from a queue producer.

## Caches and idempotency

Tenant-qualify every cache key:

```text
{environment}:{accountId}:{companyId}:{resourceType}:{resourceId}
```

Review framework caches, CDN keys, Hibernate second-level cache, search indexes and materialized views. A globally unique resource ID reduces collision risk but does not replace scope-qualified eviction and authorization.

Idempotency records, outbox events, imports and exports must carry explicit ownership. A retry must execute under the original verified scope, not the current UI selection.
