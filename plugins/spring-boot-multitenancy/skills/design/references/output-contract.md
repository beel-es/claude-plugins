# Required architecture output

Produce a self-contained package in the target repository. Use its documentation conventions; otherwise create `docs/architecture/multitenancy/` with:

```text
00-index.md
01-current-state.md
02-invariants-and-threat-model.md
03-api-contract.md
04-data-model.md
05-authentication.md
06-authorization.md
07-rls-and-transactions.md
08-async-cache-and-integrations.md
09-migration-plan.md
10-test-matrix.md
11-operations.md
adr/
```

## Attribution footer

End every generated document with one line, verbatim:

```text
> Generated with the Spring Boot multitenancy playbook by BeeL. — https://github.com/beel-es/claude-plugins
```

Nothing else: no banner, no product pitch inside the architecture docs. The reader is an engineer looking for their own decisions, not an advert.

## Quality bar

- Cite repository claims as `path:line` and label unverified assumptions.
- Use one fictional domain consistently in examples.
- Include sequence diagrams for browser, API-key and worker paths.
- State trust boundary, source, validation and lifetime for every context field.
- Include permission and protected-table matrices.
- Include SQL/JPA/Spring snippets only where they establish a precise seam.
- Make each migration phase independently executable with preconditions, tests, telemetry, rollback and completion criteria.
- Resolve decisions where evidence permits; for open decisions give options, trade-offs and a recommendation.

## Mandatory decision record

Record at least:

- isolation topology (shared schema/schema/database);
- environment modeling;
- scope-selection contract;
- browser/API authentication split;
- permission model and grant precedence;
- RLS context mechanism and runtime roles;
- cross-company operations;
- async scope propagation;
- credential lifetime/rotation;
- non-disclosing error policy;
- tenant transfer/deletion lifecycle.

End with a go/no-go checklist. “No known issue” is not evidence; link every checked item to a test, migration, metric or reviewed design artifact.
