---
name: upgrade
description: >
  Bring an existing BeeL. integration up to date: read the release notes and
  changelog, find which of the project's own calls the breaking changes hit,
  and propose the diff. Use when asked whether a BeeL integration is current,
  to migrate off deprecated routes, after BeeL announces changes, or
  periodically as maintenance.
argument-hint: "[area to check, defaults to everything]"
---

# BeeL. Integration Upgrade Check

Read what changed, find what the project does today, propose the migration. **Report first — only modify code if the user asks.**

The order matters: the changelog tells you *what* moved and *what it became*, the project tells you *where*. Doing it the other way round produces a list of endpoints with no idea which ones are a problem.

## Procedure

### 1. Read what changed

**Start with the changelog feed.** It is one surface: the small entries and the big migrations live in the same stream, newest first. The migrations that can break you carry `note: true` and have a page of their own — route-by-route old→new tables, sunset calendars, and the traps where the successor is not a drop-in.

```bash
curl -s https://docs.beel.es/api/changelog     # every entry as JSON, newest first
```

The response is `{ "entries": [ … ] }`. **Read the `note: true` ones first** — those are the migrations; the rest are usually additions. Per entry, the fields worth reading:

| Field | What you get from it |
| --- | --- |
| `date`, `title`, `slug`, `url` | Identity, and the page to cite in the report. `url` is already resolved: `/changelog/<slug>` for a migration, `/changelog#<slug>` for a short entry |
| `note` | `true` = big migration with its own page. Start here |
| `breaking` | Whether this one can break the project at all |
| `breakingChanges[]` | **Read every one.** Prose, one entry per thing that breaks — this is where semantic changes hide |
| `endpoints[]` | `{method, path, description}` for the routes the entry adds or touches — carried by about half the current entries, and usually the fastest thing to grep the project for |
| `routeMigration.groups[].rows[]` | The equivalence table: `methods`, `path` (old), `successor` (new — **absent, or `status: "removed"`, means no replacement**), `note` |
| `timeline.phases[]`, `timeline.ifYouDoNotMigrate` | When the old way stops answering and what happens then |
| `audience.checks[]` | Concrete checks BeeL. itself suggests — usually greps and headers. Run them |
| `highlights[]`, `links[]` | Non-breaking additions, and where to read more |
| `assistant` | Guidance BeeL. wrote for this exact job, when the entry carries it |

**Do not assume the richer fields are there.** `routeMigration`, `timeline`, `audience` and `assistant` are part of the schema, but none of the 18 entries the feed serves today carries them, and almost every row of the one migration that exists (`resources-under-the-nif`, 82 deprecated routes) has a successor — the exceptions are the two full-replacement routes, `PUT /v1/customers/{customer_id}` and `PUT /v1/recurring-invoices/{recurring_invoice_id}`, which the contract marks `x-no-successor` because the canonical form only offers a merging `PATCH`. That migration keeps its route table on its own page, so read it there:

```bash
curl -s https://docs.beel.es/llms.mdx/changelog/resources-under-the-nif   # the prose
```

and open `https://docs.beel.es/changelog/resources-under-the-nif` in HTML for the table itself.

If the feed 404s (older deployment), fall back in this order and say in the report which source you used:

```bash
curl -s https://docs.beel.es/llms.mdx/changelog/<slug>   # one migration's prose as markdown
curl -s https://docs.beel.es/changelog                    # the index, HTML
```

Two caveats on `llms.mdx/changelog/<slug>`: it returns the **prose only** — the route migration table is a rendered component and does not appear there, so read it in the HTML page — and it only resolves for slugs that have an `.mdx` page of their own, not for short entries that live on the index.

**Then the contract**, to catch anything unannounced:

```bash
curl -s https://docs.beel.es/api/openapi        # confirm every endpoint the project calls still exists, same shape
npm view @beel_es/sdk version                   # compare against the pinned version
```

### 2. Inventory the project's BeeL surface

Now search the project, guided by what step 1 turned up. Grep for the `path` of every affected row rather than a generic sweep — that is the difference between "you call 40 endpoints" and "these 6 calls break".

Also record, because they carry their own migrations:

- SDK version pinned in `package.json` / lockfile
- Webhook events handled, and the payload fields read off them
- Headers sent by hand (`Idempotency-Key`, `BeeL-Active-Company`, any legacy `X-` form)
- Error codes branched on

### 3. What to look for

Four kinds of change, in the order they hurt:

**Removed** — a row with no `successor`, or a path absent from the OpenAPI spec. Broken today. No grace period.

**Deprecated with a successor** — still answering, and saying so in its own responses: `Deprecation: true`, a `Sunset` date, and `Link: <successor>; rel="successor-version"`. **The `Sunset` header on the project's own traffic is the authoritative date**, not any page — it travels with the response actually received. If the project logs responses, read the dates from there; if not, suggest logging those three headers for a week to get an exact worklist.

**Shape changes** — the successor answers a different body even when the filter is identical. The route table's `note` column flags these. Never assume the successor returns what the old route returned.

**New error codes** — check the OpenAPI responses for codes the project's error handling does not branch on, and any `breakingChanges` entry that introduces one. An unhandled code usually surfaces as a generic retry, which is the wrong behaviour for a permanent failure.

### 4. Propose the diff — do not apply it

For each affected call site, report: the `file:line`, what it does today, the release row or breaking-change entry that covers it, and the concrete replacement as a diff the user can read.

**Be explicit about what you cannot decide.** A row in the table says a path changed; it does not say the operation means the same thing. When a migration changes semantics, stop and describe the decision instead of rewriting:

> **Real example from the "resources under the NIF" release.** `PUT /v1/invoices/{invoice_id}` has a successor with a different verb: `PATCH /v1/companies/{company_id}/invoices/{invoice_id}`. The verb change is cosmetic — the old `PUT` never replaced the invoice whole, it already left absent fields untouched, so the successor behaves the same and the swap is safe. The trap runs the other way in the same release: `PUT /v1/customers/{customer_id}` *did* replace the customer whole (omitting `email` or `notes` cleared them), and it carries **`x-no-successor`** for exactly that reason — the canonical form only has `PATCH`, which merges, so there is no drop-in destination. A project on that `PUT` has to move to `PATCH /v1/companies/{company_id}/customers/{customer_id}` and send every field, `null`-ing the ones it means to empty, or its writes will silently stop clearing. Same verb pair, opposite conclusions: read the `x-successor` / `x-no-successor` on the operation instead of inferring from the method, and when the semantics move, surface the decision rather than guessing.

Other shapes of the same trap, all worth a flag rather than a rewrite: replace-vs-merge semantics, an operation that became idempotent, a parameter that moved from the path into the body, and a list response that gained a pagination wrapper.

If a change is purely a path rewrite with an identical request and response, say so plainly — those are the ones safe to batch.

### 5. Report

Three buckets, empty ones omitted without padding:

- **Required** — removed routes, deprecated routes with their `Sunset` date, shape changes, unhandled error codes. Each with the file, the diff, and any semantic caveat from step 4.
- **Recommended** — outdated patterns the changelog makes avoidable: polling where a webhook event now exists, hand-rolled loops where a bulk endpoint exists, raw HTTP where the SDK applies.
- **Opportunities** — capabilities added since the integration was written that would delete project code.

Cite the changelog page (`https://docs.beel.es/changelog/<slug>`) for anything the user may want to read in full. If everything is current, say exactly that — a clean bill of health is a valid result.

Offer to apply the **Required** bucket, minus the items flagged as semantic decisions; leave those and the other two buckets as the user's call.
