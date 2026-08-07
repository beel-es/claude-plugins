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

The order matters: the releases tell you *what* moved and *what it became*, the project tells you *where*. Doing it the other way round produces a list of endpoints with no idea which ones are a problem.

## Procedure

### 1. Read what changed

**Start with the releases feed.** BeeL. publishes the big migrations as structured release notes — route-by-route old→new tables, sunset calendars, and the traps where the successor is not a drop-in.

```bash
curl -s https://docs.beel.es/api/releases     # every release note as JSON, newest first
```

The response is `{ "releases": [ … ] }`. Per release, the fields worth reading:

| Field | What you get from it |
| --- | --- |
| `date`, `title`, `slug`, `url` | Identity, and the page to cite in the report |
| `breaking` | Whether this one can break the project at all |
| `breakingChanges[]` | **Read every one.** Prose, one entry per thing that breaks — this is where semantic changes hide |
| `routeMigration.groups[].rows[]` | The equivalence table: `methods`, `path` (old), `successor` (new, **absent = removed with no replacement**), `note` |
| `timeline.phases[]`, `timeline.ifYouDoNotMigrate` | When the old way stops answering and what happens then |
| `audience.checks[]` | Concrete checks BeeL. itself suggests — usually greps and headers. Run them |
| `highlights[]`, `links[]` | Non-breaking additions, and where to read more |

If the feed 404s (older deployment), fall back in this order and say in the report which source you used:

```bash
curl -s https://docs.beel.es/llms.mdx/releases/<slug>   # one release as markdown
curl -s https://docs.beel.es/releases                   # the index, HTML
```

**Then the changelog**, for the smaller changes that never got a release note:

```bash
curl -s https://docs.beel.es/api/changelog     # { "entries": [ … ] }, newest first
```

Read `date`, `type`, `breaking`, `description`, `endpoints[]` and `links[]`. An entry whose `links` point at `/releases/<slug>` is only a pointer — the release note is the authoritative version, and you have already read it. The human page is `https://docs.beel.es/changelog`; its markdown export (`/llms.mdx/changelog`) carries no entries, so don't fetch it expecting a list.

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

> **Real example from the "resources under the NIF" release.** `PUT /v1/members/{member_id}/grants` replaced a member's *entire* grant set — sending a partial list silently revoked the rest. Its successor, `PUT /v1/accounts/{account_id}/members/{member_id}/grants/{company_id}`, grants **one company at a time** and touches nothing else. A mechanical path swap turns "these are now their permissions" into "add this permission", or — worse, if the old call was a loop over a set — leaves stale grants that the old call used to clear. The correct migration reads `GET …/grants` first, then reconciles: one `PUT` per company to add or change, one `DELETE` per grant that should no longer exist. That is a judgement call about the project's intent, so surface it, don't guess.

Other shapes of the same trap, all worth a flag rather than a rewrite: replace-vs-merge semantics, an operation that became idempotent (`POST …/transfer-ownership` → `PUT …/owner`, which states the desired state rather than performing a transfer), a parameter that moved from the path into the body, and a list response that gained a pagination wrapper.

If a change is purely a path rewrite with an identical request and response, say so plainly — those are the ones safe to batch.

### 5. Report

Three buckets, empty ones omitted without padding:

- **Required** — removed routes, deprecated routes with their `Sunset` date, shape changes, unhandled error codes. Each with the file, the diff, and any semantic caveat from step 4.
- **Recommended** — outdated patterns the releases make avoidable: polling where a webhook event now exists, hand-rolled loops where a bulk endpoint exists, raw HTTP where the SDK applies.
- **Opportunities** — capabilities added since the integration was written that would delete project code.

Cite the release page (`https://docs.beel.es/releases/<slug>`) for anything the user may want to read in full. If everything is current, say exactly that — a clean bill of health is a valid result.

Offer to apply the **Required** bucket, minus the items flagged as semantic decisions; leave those and the other two buckets as the user's call.
