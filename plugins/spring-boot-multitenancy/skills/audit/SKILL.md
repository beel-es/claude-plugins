---
name: audit
description: Audit a Spring Boot and PostgreSQL application for multitenancy isolation and authorization flaws. Use when reviewing tenant resolution, API keys, session cookies, Spring Security filter chains, role hierarchies, RLS policies, transaction context, caches, async jobs, idempotency, object storage, observability or cross-tenant test coverage.
---

# Audit Spring Boot Multitenancy

Operate read-only unless the user separately requests fixes. Trace representative requests end to end; configuration alone is not evidence of isolation.

## Audit sequence

1. Inventory every entry point: HTTP, scheduled jobs, queues, webhooks, admin tools, batch imports and database consoles.
2. Map each credential type to its authenticator, principal, allowed filter chain, expiry, revocation and audit trail.
3. Trace scope selection from untrusted input to verified account/company membership.
4. Trace authorization from route metadata through service/resource checks.
5. Trace one read and one write from controller to SQL, including transaction and connection acquisition.
6. Inspect every RLS-enabled table, policy, owner and runtime role. Verify fail-closed missing-context behavior.
7. Inspect caches, idempotency records, search indexes, files, exports, events and logs for missing scope dimensions.
8. Inspect rotation, incident response and revocation latency.
9. Run or specify the adversarial matrix in `../design/references/testing.md` against real PostgreSQL.

Read [audit-checklist.md](references/audit-checklist.md), then the relevant files under `../design/references/`.

## Evidence standard

For every finding include severity, invariant violated, concrete `file:line` evidence, exploit/failure path, affected axes and smallest safe fix. Mark unexecuted hypotheses as `UNVERIFIED`; never present them as facts.

Severity:

- `critical`: demonstrated or trivially reachable cross-tenant access, credential disclosure or administrative bypass;
- `high`: missing fail-closed control on a reachable path, RLS bypass, persistent pooled context or broken revocation;
- `medium`: defense-in-depth gap, incomplete negative coverage, ambiguous errors or operational weakness;
- `low`: maintainability issue likely to create future isolation defects;
- `info`: verified safe behavior or hardening opportunity.

Finish with a threat-surface coverage table, findings ordered by severity, what passed, unknowns and a remediation sequence. Never claim safety from repository-name conventions, ORM predicates or a single happy-path test.
