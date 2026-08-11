---
name: multi-nif
description: >
  Integrate BeeL's multi-NIF model: one account holding many companies (fiscal
  identities), targeting a specific company per request, members and grants, and
  managed accounts (agencies / gestorías / fleets that invoice on behalf of
  others). Use when the integration deals with several NIFs/CIFs under one API
  key, the `BeeL-Active-Company` header, managing companies, or provisioning
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
| **Member** | A person with access to the account. Account role `OWNER`/`ADMIN` (reach every company) or `MEMBER` (only companies granted to it, at access level `VIEW` or `OPERATE`). |
| **Managed account** | Another account a **provisioner** (agency/fleet) creates and operates **on behalf of** its holder, at an access level it controls: `NONE`, `VIEW` or `OPERATE`. |

`access_level` is **one single vocabulary** — `NONE` (no visibility), `VIEW`
(read-only), `OPERATE` (read and write) — used both for a member's grant over a
company and for a provisioner's access over a managed account. It never decides
who pays: billing follows the provisioning relationship, not the access level.

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

## The one mechanic that matters: `BeeL-Active-Company`

Company-scoped routes take the company in the path. On the flat legacy routes,
send the company's UUID in the **`BeeL-Active-Company`** header — one master key
covers every company you own:

```bash
curl https://app.beel.es/api/v1/invoices \
  -H "Authorization: Bearer beel_sk_live_xxx" \
  -H "BeeL-Active-Company: 550e8400-e29b-41d4-a716-446655440000"
```

Rules enforced by the API:

- The key needs the **`companies:read`** scope, or the header is **silently
  ignored** (no error).
- The target company must be **owned by the key owner** (or belong to an account
  you manage with `VIEW`/`OPERATE`), else **`403 Forbidden`**
  (`ACTIVE_COMPANY_NOT_ACCESSIBLE`).
- A value that isn't a valid UUID is **rejected**, not ignored.
- Without the header: an account holding **one** company uses that company. An
  account holding **several** gets **`403 ACTIVE_COMPANY_REQUIRED`** — there, the
  header is not optional.
- Switch the header value per request to change which company you act on.

### Discover your company UUIDs

```bash
curl "https://app.beel.es/api/v1/accounts/{account_id}/companies?limit=100" \
  -H "Authorization: Bearer beel_sk_live_xxx"
```

Requires the **`companies:list`** scope. `{account_id}` is your own account, or
an account you provisioned. The response is always paginated. Each item has `id`
(UUID → use it in the path or the header) and `nif`.

## Scopes (only what gates the endpoints you call)

| Area | Read | Write |
|------|------|-------|
| Companies | `companies:read` (operate on one), `companies:list` (list an account's NIFs) | `companies:write` (create a NIF) |
| Members, grants & invitations | `members:read` | `members:write` |
| Managed accounts (provisioning) | `accounts:read` (list the accounts you provisioned) | `accounts:write` (provision, change access level, end management) |
| Payment connections (Stripe per NIF) | `payment-connections:read` | `payment-connections:write` |

`account:admin` exists but is a **meta-permission** over your own account's keys
and billing — it can never be granted to an API key, so don't ask for it.

Canonical table: fetch the `auth/scopes` page from the docs (below).

## Connect Stripe per NIF (auto-invoice payments)

Payment connections link **Stripe** to a **company (NIF)** so its charges
auto-generate VeriFactu invoices under that NIF. Per-company, under `/companies`:

- `GET /v1/companies/{company_id}/payment-connections` — list (`payment-connections:read`)
- `POST /v1/companies/{company_id}/payment-connections/authorizations` — start OAuth,
  returns an `authorization_url` (`payment-connections:write`; white-label for
  **managed** NIFs)
- `DELETE /v1/companies/{company_id}/payment-connections/{provider}` — disconnect
  (`payment-connections:write`)

`{provider}` is a **lowercase slug**. Only **`stripe`** is operative today; any
other value → `422`. Works for a NIF you **own or manage**; starting the
authorization requires you **manage** it. Fetch `multi-nif/payment-connections`
for the flow; `/stripe` for what a payment produces.

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

- **Invoice across all your companies** — `GET /v1/accounts/{account_id}/companies`
  → for each `id`, call `/v1/companies/{id}/invoices`, the **canonical**
  company-scoped route. The flat `/v1/invoices` is a **deprecated alias**: it still
  works with the `BeeL-Active-Company` header until the date in its `Sunset`
  response header. Reuse the invoice lifecycle from
  `../beel-api/recipes/invoice-flow.md`.
- **Onboard a company (new NIF)** — `POST /v1/accounts/{account_id}/companies`
  (`companies:write`); then operate on it through the company-scoped routes. Fetch
  `multi-nif/companies` for the fiscal profile fields and the TEST→PROD flow.
- **Give a teammate access** — invitations + per-company grants (`members:write`),
  at access level `VIEW` or `OPERATE`. Fetch `multi-nif/members-and-grants` and
  `multi-nif/invitations`.
- **Agency/fleet operating clients** — `POST /v1/accounts` to provision
  (`accounts:write`), `GET /v1/accounts` to list what you manage (`accounts:read`),
  with `access_level: OPERATE` to invoice on their behalf — which additionally
  requires a signed fiscal representation per NIF. Fetch `multi-nif/managed-accounts`.

## 🛠 Companion skills

- `/beel-api:implement` — wire the flows into a project (add the header to the client)
- `/beel-api:webhooks` — react to events across companies
- `/beel-api:audit` — check an existing integration (incl. correct scope/header use)
