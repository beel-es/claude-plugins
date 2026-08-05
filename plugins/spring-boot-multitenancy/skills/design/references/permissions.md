# Hierarchical authorization

## Contents

- Layers
- Roles and permissions
- Evaluation algorithm
- Resource attributes
- Revocation and caching

## Layers

Keep four concepts separate:

1. **Credential scopes**: maximum capabilities delegated to an API key, such as `projects:read`.
2. **Account role**: relationship of a user to an account, such as `OWNER`, `ADMIN`, `MEMBER`.
3. **Company grant**: relationship within one company, such as `COMPANY_ADMIN`, `EDITOR`, `VIEWER`.
4. **Resource rule**: attributes such as project membership, ownership, status or classification.

Roles bundle permissions; services authorize permissions. Avoid `if (role == ...)` throughout domain code.

## Example permission catalogue

```text
account:manage
members:read
members:write
companies:read
companies:manage
projects:read
projects:write
projects:delete
tasks:read
tasks:write
audit:read
cross_company:read
```

Example hierarchy:

- `OWNER`: all account permissions, cannot be removed by lower roles.
- `ADMIN`: account operations except ownership transfer/destructive billing actions.
- `MEMBER`: no implicit company data access.
- `COMPANY_ADMIN`: all ordinary permissions in one company.
- `EDITOR`: read/write projects and tasks in one company.
- `VIEWER`: read only in one company.

Do not rely blindly on Spring's `RoleHierarchy` for company-specific grants; the hierarchy lacks the resource dimension. Represent resolved permissions alongside the company ID.

## Evaluation algorithm

Evaluate deny by default:

```text
authenticated(actor)
AND credential_active(actor)
AND actor.environment allows context.environment
AND actor.account == context.account
AND actor has company access in context.account
AND actor/credential permission set contains action
AND resource belongs to context.company
AND resource attributes allow action
```

For API keys, effective permissions are the intersection of key scopes, account policy and company allow-list. For users, effective permissions derive from active account membership plus account role/company grant. Never union permissions across accounts or companies.

Use coarse request rules (`requestMatchers`, method security) as an early rejection layer. Perform resource-aware checks inside the transaction, close to mutation, to reduce time-of-check/time-of-use gaps.

## Resource attributes

RBAC alone is insufficient for rules such as “edit tasks only while the project is open” or “support may read metadata but not content.” Model an authorization service returning a typed decision with reason, policy version and obligations such as redaction.

## Revocation and caching

Cache authorization only with a versioned key such as:

```text
authz:{actorId}:{accountId}:{companyId}:{grantVersion}
```

Increment versions or evict on membership, role, company ownership, key-scope or status changes. Define maximum revocation latency. Sensitive writes should read current authorization from the database inside the transaction.
