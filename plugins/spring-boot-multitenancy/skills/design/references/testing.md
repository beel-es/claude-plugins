# Isolation testing strategy

## Contents

- Fixture matrix
- Layers
- Adversarial cases
- Property and concurrency tests
- CI gates

## Fixture matrix

Create fixtures that cannot pass through accidental overlap:

```text
TEST: account A → company A1, A2; account B → company B1
LIVE: account A → company A1-live

user ownerA, memberA1, memberA2, viewerA1, userB
keyA1-read, keyA-all-write, keyB, expiredKey, revokedKey
```

Give each tenant distinctive values. Never reuse emails, names or external IDs that could hide a missing predicate.

## Layers

- Unit: token parsing, permission intersection, role mapping, selector precedence.
- MVC/security: filter-chain selection, CSRF, 401/403/404 semantics, conflicting selectors.
- PostgreSQL integration: real migrations, runtime role, RLS reads/writes and missing context.
- End-to-end: HTTP to database with real transaction manager and pool.
- Operational: rotation, revocation, metrics and audit records.

H2 cannot validate PostgreSQL RLS. Use Testcontainers or an equivalent real PostgreSQL instance.

## Adversarial cases

For every protected aggregate test:

- same company allowed read/write;
- sibling company denied;
- other account denied;
- same company in other environment denied;
- no context denied/zero rows;
- malformed and unknown selectors rejected;
- path/header mismatch rejected;
- foreign parent assignment rejected;
- bulk update/delete cannot affect invisible rows;
- native query remains isolated;
- API key missing scope denied;
- expired/revoked key denied immediately;
- session request without/with invalid CSRF rejected;
- revoked membership invalidates cached authorization;
- table owner and migration role are not runtime credentials.

## Property and concurrency tests

Generate arbitrary pairs of actors, contexts and resources. Assert access only when account, environment, company and permission predicates all hold. Mutation properties must prove no rows outside the selected company change.

Race tests:

- revoke grant while update waits on a lock;
- rotate key while requests use old/new credentials;
- two tenants reuse the same idempotency key;
- connection pool alternates A, missing context, B;
- concurrent company transfer and resource mutation.

## CI gates

- OpenAPI lint and breaking-change checks fail hard.
- Flyway migration runs from empty database and representative prior version.
- RLS policy inventory equals protected-table inventory.
- Each protected table has `ENABLE`, `FORCE`, applicable runtime policies and negative tests.
- Tests connect as runtime role, never superuser.
- No secret pattern appears in fixtures, snapshots or captured logs.
- Query-plan regression checks cover inherited ownership joins at realistic scale.
