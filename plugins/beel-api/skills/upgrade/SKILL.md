---
name: upgrade
description: >
  Check an existing BeeL integration against the live API reference: detect
  breaking changes that affect the project, deprecated patterns in use, new
  features worth adopting, and outdated SDK versions. Use when asked if a
  BeeL integration is up to date, after BeeL announces changes, or
  periodically as maintenance.
argument-hint: "[area to check, defaults to everything]"
---

# BeeL Integration Upgrade Check

Compare what the project actually uses against what the BeeL API currently offers, and report what must change and what could improve. **Report first — only modify code if the user asks.**

## Procedure

### 1. Inventory the project's BeeL surface

Find every touchpoint (same search terms as `/beel-api:audit` step 2) and build a concrete inventory:

- Endpoints called (method + path)
- SDK: `@beel_es/sdk` version pinned in `package.json` / lockfile
- Webhook events handled
- Patterns in use (raw fetch vs SDK, polling loops, manual exports, single calls in loops)

### 2. Fetch the live state of the API

- **OpenAPI spec**: `https://docs.beel.es/api/openapi` — the most reliable source: confirm every endpoint the project calls still exists with the same shape, headers and required fields
- **Changelog**: try the changelog doc page — note it may render client-side and return no entries; if so, say so in the report and lean on the OpenAPI diff instead of skipping silently
- **SDK latest**: `npm view @beel_es/sdk version` (compare against installed; check release notes on npm/GitHub for breaking changes)
- **Docs index**: `https://docs.beel.es/llms.txt` — scan for capability areas the project reimplements by hand
- **Auth and idempotency guides** — header names have changed before (`X-API-Key` → `Authorization: Bearer`, `X-Idempotency-Key` → `Idempotency-Key`); verify the project sends the currently documented ones

### 3. Cross-reference

Three buckets, in order of urgency:

**Required — will break or is broken:**
- Endpoints/fields the project uses that changed, were deprecated or removed
- Anything the project calls that no longer appears in the OpenAPI spec
- Legacy header names the server may no longer honor
- SDK major versions behind with breaking release notes

**Recommended — outdated patterns:**
- Polling where webhook events now exist for the same signal
- Hand-rolled loops where bulk endpoints exist
- Raw HTTP in Node where the official SDK applies
- Manual CSV/Excel handling where import/export endpoints exist

**Opportunities — new since the integration was written:**
- New capabilities relevant to what the project does (e.g. recurring invoices, scheduling, new export formats, Stripe integration) that would delete project code

### 4. Report

For each item: what the project does today (`file:line`), what changed or now exists (docs reference), and the concrete migration step. Skip empty buckets without padding. If everything is current, say exactly that — a clean bill of health is a valid result.

Offer to apply the **Required** bucket; leave Recommended/Opportunities as the user's call.
