# Architecture and invariants

## Contents

- System model
- Trust boundaries
- Request pipeline
- Design choices
- Invariants

## System model

Use three independent scope axes:

```text
Account ──owns──> Company
   │                │
   └── API key      ├── CompanySpace(TEST) ──> Project ──> Task
       bound to     └── CompanySpace(LIVE) ──> Project ──> Task
       environment
```

`Environment` is not a display filter. It prevents test data, keys and side effects from crossing into live operations. `CompanySpace(company, environment)` is the environment-specific aggregate root. An account may own many companies. A user may belong to many accounts and receive different company grants in each. Machine keys belong to an account and environment and receive an explicit company policy: one company, a finite allow-list, or all current companies when deliberately allowed.

Keep two values distinct:

- **Actor**: who/what authenticated (`USER`, `API_KEY`, `JOB`, `SUPPORT_SESSION`).
- **TenantContext**: where the operation executes (`environmentId`, `accountId`, `companyId`).

Authentication establishes the actor. Scope resolution establishes the context. Authorization evaluates `actor × context × action × resource`.

## Trust boundaries

Treat headers, path IDs, cookies and message payloads as untrusted selectors. They become authoritative only after credential verification and membership/grant evaluation. Never deserialize a client-provided `TenantContext` directly.

Administrative access must be explicit, time-bounded, reason-bearing and audited. Do not implement a magic role that disables tenant checks. Prefer a separate workflow and database role with narrowly scoped functions.

## Request pipeline

```text
HTTP request
  → choose security chain
  → authenticate credential
  → create immutable Actor
  → parse requested environment/company selector
  → resolve and authorize TenantContext
  → coarse endpoint authorization
  → begin transaction
  → set transaction-local PostgreSQL context
  → resource-aware service authorization
  → repository SQL protected by RLS
  → audit/metrics with IDs, never secrets
```

Errors must stop the pipeline. Missing context cannot mean unrestricted access. Invalid or unauthorized scope should not fall back to a default unless the API contract explicitly defines a safe default and the actor is authorized for it.

## Design choices

### Shared schema with RLS

Recommended when tenants share one product model and operational simplicity matters. It provides strong defense in depth but requires disciplined connection roles, transactions and policy tests.

### Schema per tenant

Useful for stronger operational separation or tenant-specific extensions. It increases migration, pooling and observability complexity. Search-path manipulation is security-sensitive and is not a substitute for authorization.

### Database per tenant

Useful for regulatory or blast-radius isolation. It increases provisioning, migrations, backups, fan-out queries and cost. The application still needs actor, scope and authorization design.

Do not mix strategies accidentally. Record why the selected boundary matches threat model, tenant count, noisy-neighbor requirements, restore granularity and operations capacity.

## Invariants

- Every tenant-owned aggregate has one unambiguous ownership path to company and environment.
- Account/company membership changes invalidate or re-evaluate cached authorization promptly.
- A transaction observes one immutable tenant context.
- Runtime application roles neither own protected tables nor have `BYPASSRLS`.
- Background operations carry an explicit persisted scope; they never depend on ambient request state.
- Global resources are declared as global. Absence of tenant ownership is never accidental.
- Cross-tenant operations are separate use cases with explicit fan-out, limits and audit trails.
- Idempotency and tenant-local uniqueness include the owning boundary.
