# Neutral data model

## Contents

- Tables
- Ownership without repeated columns
- Constraints
- Shared and global data
- Deletion and transfer

This model uses collaborative project management and contains no invoicing or tax concepts.

## Tables

```text
environment(id, code)
account(id, name, status)
company(id, account_id, name, status)
company_space(id, company_id, environment_id, unique(company_id, environment_id))
project(id, company_space_id, name, status)
task(id, project_id, title, assignee_user_id, status)

app_user(id, email, status)
account_membership(account_id, user_id, account_role, status)
company_grant(company_id, user_id, company_role, status)

api_key(id, account_id, environment_id, public_prefix, secret_hash,
        scopes, expires_at, revoked_at, rotated_from_id)
api_key_company(api_key_id, company_id)

security_session(id, user_id, session_hash, expires_at, revoked_at)
audit_event(id, occurred_at, actor_type, actor_id, environment_id,
            account_id, company_id, action, resource_type, resource_id, outcome)
```

Use UUIDv7 or another non-enumerable globally unique ID consistently. IDs are identifiers, not authorization.

## Ownership without repeated columns

Do not add `environment_id`, `account_id` and `company_id` to every `task` merely to filter it. Derive ownership through stable parents:

```text
task.project_id → project.company_space_id
                → company_space.(environment_id, company_id)
                → company.account_id
```

RLS can use `EXISTS` joins to this chain. This avoids contradictory denormalized scope values. Add a direct scope column only when measurements prove join cost unacceptable, and then protect consistency with composite foreign keys or triggers.

Environment is a request/credential data-plane axis rather than a property of the company itself. Put it on one scoped root:

```text
company_space(id, company_id, environment_id, unique(company_id, environment_id))
project(id, company_space_id, ...)
task(id, project_id, ...)
```

This places the axis once at the correct aggregate root instead of on every leaf row.

## Constraints

- `company.account_id` is non-null and immutable except through an audited transfer workflow.
- A `company_grant` must reference a user with active membership in the company's account. PostgreSQL cannot express the transitive rule with a simple FK; enforce in a transactional service and verify periodically.
- Company allow-lists for API keys must contain companies owned by the same account and valid in the key's environment policy.
- Use partial unique indexes for active key prefixes and active memberships where lifecycle requires history.
- Tenant-local natural keys use composite uniqueness at the scoped aggregate root, for example `unique(company_space_id, project_code)`.
- Foreign keys must prevent attaching a child to a parent in another company. A single parent FK already provides this when ownership is derived.

## Shared and global data

Classify each table:

- `GLOBAL`: currencies, feature definitions; readable without tenant context only by explicit policy.
- `ACCOUNT`: API keys, billing settings, memberships.
- `COMPANY`: project roots, grants, company settings.
- `INHERITED`: tasks and comments deriving company through a parent.
- `OPERATIONAL`: outbox, idempotency and audit rows, each with explicit scope.

Never create a vague `tenant_id` whose meaning varies by table.

## Deletion and transfer

Prefer status transitions plus retention jobs over unbounded cascades. Company transfer between accounts is a security-sensitive workflow: lock the company, verify both owners, rotate/revoke affected credentials, migrate grants, update cache namespaces, emit audit events and run isolation checks before reopening writes.
