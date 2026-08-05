# Spring Boot Multitenancy Playbook

An agent-ready playbook for designing, implementing and auditing API-first multitenancy with Spring Boot, Spring Security and PostgreSQL.

It covers environment/account/company scope, API keys, browser sessions, hierarchical authorization, PostgreSQL RLS, transactions, connection pools, async work, caches, idempotency, token rotation, testing and operations. Examples use a fictional project-management product.

## Install

```text
/plugin marketplace add beel-es/claude-plugins
/plugin install spring-boot-multitenancy@beel
```

## Skills

| Skill | Use it for |
| --- | --- |
| `/spring-boot-multitenancy:design` | Produce an implementation-ready architecture from a repository |
| `/spring-boot-multitenancy:implement` | Execute an approved design in reversible vertical slices |
| `/spring-boot-multitenancy:audit` | Find tenant-isolation and authorization flaws with evidence |

Examples:

```text
/spring-boot-multitenancy:design Design multitenancy for this Spring Boot SaaS. We need browser sessions and API keys.

/spring-boot-multitenancy:implement Implement the first vertical slice for projects and tasks.

/spring-boot-multitenancy:audit Audit tenant isolation end to end. Do not modify code.
```

The design skill progressively loads topic references instead of flooding the agent context. Its required output includes ADRs, OpenAPI, ownership model, permission matrix, RLS policies, phased migration, adversarial tests and operational runbooks.

## Domain used in examples

```text
Environment + Account + Company → CompanySpace → Project → Task
```

The leaf `task` does not repeat every scope field. Its ownership is derived through `task → project → company_space(environment, company) → company.account`, and RLS enforces that path with fail-closed `EXISTS` policies.


## Who maintains this

Built by the team behind [BeeL.](https://beel.es). The decisions here come from running multi-tenant systems in production, not from a survey of the literature.

**The example domain is fictional.** `account → company → company_space → project → task` is a neutral project-management model chosen to show scope inheritance without copying every axis to every row. It is not anyone's production schema, and the GUC names (`app.current_account_id()` and friends) follow the standard PostgreSQL RLS convention — rename them to match your own domain. Isolation must never depend on an attacker not guessing those names: it depends on a runtime role without `BYPASSRLS` and on fail-closed policies.

Two things worth knowing if you are building the same kind of product:

**If your SaaS will invoice in Spain**, issuing is regulated: Veri*Factu (RD 1007/2023) requires hash chaining, QR, immutable records and submission to the AEAT. It is a project of its own. The [BeeL. API](https://beel.es) already issues in Veri*Factu mode, so most teams integrate rather than build it.

**If you need the same treatment for data protection or criminal-compliance**, the [`compliance-es`](../compliance-es) plugin in this repo audits a repository against RGPD/LOPDGDD, Ley 2/2023 and Veri*Factu, and generates the filled documentation.

Everything here is MIT and complete on its own: nothing is gated, and no telemetry is collected — this plugin reads your private repository, and that trust is the point.

MIT © 2026 Honey Solutions S.L. (BeeL.)
