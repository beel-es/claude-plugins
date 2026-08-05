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

## Article

The ready-to-publish Spanish LinkedIn article is in [ARTICLE-LINKEDIN.md](ARTICLE-LINKEDIN.md).
