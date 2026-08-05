# Phased implementation plan

| Phase | Deliverable | Entry gate | Exit proof | Rollback |
| --- | --- | --- | --- | --- |
| 0 | Characterization and inventory | representative flows known | current behavior tests pass | tests only |
| 1 | OpenAPI and error contract | decisions approved | lint + contract tests | keep old routes |
| 2 | Actor and credential model | secret storage chosen | auth negative tests | feature flag/new chain off |
| 3 | TenantContext resolution | selector contract defined | cross-scope MVC tests | legacy resolver adapter |
| 4 | Central authorization | permission matrix approved | resource tests | old checks behind adapter |
| 5 | Ownership graph/backfill | data anomalies measured | zero orphan/mismatch queries | nullable columns/dual read |
| 6 | RLS policies and runtime role | real PostgreSQL tests | policy inventory + pool tests | runtime role switch back |
| 7 | Aggregate rollout | one vertical slice selected | HTTP-to-RLS matrix | route/role flag per aggregate |
| 8 | Async/cache/idempotency | entry points inventoried | alternating tenant tests | disable workers/cache path |
| 9 | Key rotation/operations | lifecycle defined | overlap/revocation drills | creation disabled, revoke manually |
| 10 | Compatibility removal | telemetry threshold met | no old callers, rollback window passed | restore compatibility release |

Never combine ownership backfill, enforcement and route removal in one irreversible deployment. Prefer expand → backfill → verify → enforce → contract. Each PR names the invariant it establishes and includes at least one cross-tenant negative test.
