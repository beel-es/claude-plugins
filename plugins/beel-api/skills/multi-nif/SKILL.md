---
name: multi-nif
description: >
  Integrate BeeL's multi-NIF model: one account holding many companies (fiscal
  identities), targeting a specific company per request, members and grants, and
  managed accounts (agencies / gestorías / fleets that invoice on behalf of
  others). Use when the integration deals with several NIFs/CIFs under one API
  key, the `Beel-Active-Company` header, managing companies, or provisioning
  accounts for third parties.
argument-hint: "[what you're building, e.g. 'invoice across all my companies']"
---

# BeeL Multi-NIF — Integration Guide

BeeL's multi-NIF model lets **one account** (one API key) hold **many companies**,
each a Spanish tax ID (NIF/CIF) with its own fully isolated invoices, customers,
products and series. Built for professionals with several NIFs, agencies
(*gestorías*) and fleets that invoice on behalf of the businesses they manage.

The golden rules in the `beel-api` skill apply throughout — especially: **never
invent endpoints, fields or scopes; verify against the live docs.**

## The model (know this before writing code)

| Concept | What it is |
| --- | --- |
| **Account** | The tenant you authenticate as. **One API key = one account.** Owns billing/auth and holds **1..N companies**. |
| **Company** | One fiscal identity (NIF/CIF). Isolated space: its own invoices, customers, products, series — per environment (`TEST`/`PROD`). |
| **Member** | A person with access to the account. Account role `OWNER`/`ADMIN` (reach every company) or `MEMBER` (only companies granted to it, as `VIEWER`/`EDITOR`). |
| **Managed account** | Another account a **provisioner** (agency/fleet) creates and operates **on behalf of** its holder, at an access level it controls: `BILLING_ONLY`, `READ_ONLY`, `OPERATE`. |

### Members vs managed accounts — pick the right one

Both give access to operate a business, but point in opposite directions. Don't
require both scopes — an integration uses one model:

- **Members** (`members:*`) — a person joins an **account that already exists**. The
  owner, billing and NIF stay with that account; the invitee only needs a **login**
  (not an account of their own) and does **no** fiscal onboarding. Use when *the
  client signed up and pays themselves* and invites you in.
- **Managed accounts** (`accounts:write`) — you **create and run a third party's
  account** (its own NIF, its own billing) and they can later **claim** it. Use when
  *you onboard them by API and you pay* (fleets, mass onboarding, platform gestorías
  whose clients aren't on BeeL yet).

## The one mechanic that matters: `Beel-Active-Company`

By default every request operates as the **API key owner's primary company**. To
act on a *different* company you own, send that company's UUID in the
**`Beel-Active-Company`** header — one master key covers every company you own:

```bash
curl https://app.beel.es/api/v1/invoices \
  -H "Authorization: Bearer beel_sk_live_xxx" \
  -H "Beel-Active-Company: 550e8400-e29b-41d4-a716-446655440000"
```

Rules enforced by the API:

- The key needs the **`companies:read`** scope, or the header is **silently
  ignored** (request runs on the primary company).
- The target company must be **owned by the key owner** (or belong to an account
  you manage with `OPERATE`), else **`403 Forbidden`**.
- Without the header → the **key owner's** company.
- Switch the header value per request to change which company you act on.

> **`X-Active-Profile` is deprecated.** Still accepted (identical behaviour) but
> returns a `Deprecation: true` header. Use `Beel-Active-Company` — same UUID value.

### Discover your company UUIDs

```bash
curl https://app.beel.es/api/v1/companies \
  -H "Authorization: Bearer beel_sk_live_xxx"
```

Each item has `id` (UUID → use as the header value) and `nif`.

## Scopes (only what gates the endpoints you call)

| Area | Read | Write |
|------|------|-------|
| Companies | `companies:read` (one), `companies:list` (list & stats) | `companies:write` |
| Members, grants & invitations | `members:read` | `members:write` |
| Managed accounts (provisioning) | `accounts:write` | `accounts:write` |
| Payment connections (Stripe per NIF) | `payment-connections:read` | `payment-connections:write` |

Canonical table: fetch the `auth/scopes` page from the docs (below).

## Connect Stripe per NIF (auto-invoice payments)

Payment connections link **Stripe** to a **company (NIF)** so its charges
auto-generate VeriFactu invoices under that NIF. Per-company, under `/companies`:

- `GET /v1/companies/{company_id}/payment-connections` — list (`payment-connections:read`)
- `POST /v1/companies/{company_id}/payment-connections` — start OAuth, returns an
  `authorization_url` (`payment-connections:write`; white-label for **managed** NIFs)
- `DELETE /v1/companies/{company_id}/payment-connections/{provider}` — disconnect

`{provider}` is a **lowercase slug** — currently only **`stripe`** (unsupported → `422`).
Works for a NIF you **own or manage**; `start` requires you **manage** it. Fetch
`multi-nif/payment-connections` for the flow; `/stripe` for what a payment produces.

## 📚 Look up the live docs for depth

Concepts above are enough to start; for exact fields, flows and edge cases fetch
the multi-NIF pages — **don't invent**. Preferred (token-efficient), propose the
CLI to the user first, then run:

```bash
npx @beel_es/cli docs search multi-nif           # matching sections only (~2KB)
npx @beel_es/cli docs search managed accounts
npx @beel_es/cli docs list                        # discover pages
```

Fallback over HTTP (lightest first):

```bash
curl -s https://docs.beel.es/llms.txt | grep -i "multi-nif\|companies\|managed"
curl -s https://docs.beel.es/multi-nif/companies.mdx        # + members-and-grants, invitations, managed-accounts, payment-connections
curl -s https://docs.beel.es/multi-nif/managed-accounts.mdx
```

## Common flows

- **Invoice across all your companies** — `GET /companies` → for each `id`, call the
  invoicing endpoints with `Beel-Active-Company: <id>`. Reuse the invoice lifecycle
  from `../beel-api/recipes/invoice-flow.md`; the only delta is the header.
- **Onboard a company (new NIF)** — `POST /companies` (`companies:write`); then
  operate on it via the header. Fetch `multi-nif/companies` for the fiscal profile
  fields and the TEST→PROD flow.
- **Give a teammate access** — invitations + per-company grants (`members:write`).
  Fetch `multi-nif/members-and-grants` and `multi-nif/invitations`.
- **Agency/fleet operating clients** — provisioning + managed accounts
  (`accounts:write`, `OPERATE` access). Fetch `multi-nif/managed-accounts`.

## 🛠 Companion skills

- `/beel-api:implement` — wire the flows into a project (add the header to the client)
- `/beel-api:webhooks` — react to events across companies
- `/beel-api:audit` — check an existing integration (incl. correct scope/header use)
