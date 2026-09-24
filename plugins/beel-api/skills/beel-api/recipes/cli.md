# Recipe: BeeL CLI (`@beel_es/cli`)

Agent-first CLI for the BeeL API. Two jobs: **search the docs cheaply** (no API key) and **run real API calls** (verify a flow against sandbox, inspect live data, test an endpoint before writing code). No install needed:

```bash
npx @beel_es/cli --help
```

## Docs search — the token-cheap way to verify against the docs

Prefer this over fetching `llms-full.txt` over HTTP. It downloads the machine-readable docs once (cached 15 min), filters locally (search terms never leave the machine), and prints only the matching sections as markdown. **No API key needed.**

```bash
npx @beel_es/cli docs search create invoice     # matching sections only
npx @beel_es/cli docs search idempotency key
npx @beel_es/cli docs list                       # all pages (JSON) — discover what exists
npx @beel_es/cli docs get glossary               # one full page by title
```

Propose this to the user and let them confirm before running it, rather than silently pulling the full docs into context.

Commands are derived from the OpenAPI spec bundled with the installed version, so the CLI's own `--help` and `commands` are the source of truth for what it can do — **discover, don't guess**:

```bash
npx @beel_es/cli --help                    # top-level resources
npx @beel_es/cli commands                  # every command as JSON: command, signature, method, path
npx @beel_es/cli invoices --help           # actions for a resource
npx @beel_es/cli invoices create --help    # flags, enums, defaults and body fields (from the spec)
```

Since 0.3.0 the CLI calls only the routes that name the company or the account. Scripts written for 0.2.x use old command names (`companies list-invoices <company_id>` is now `invoices list`); an old name exits with code `2` and prints the new one.

## Auth & environments

```bash
export BEEL_API_KEY=beel_sk_test_...   # recommended for agent/CI use
```

**Which company a command acts on:** `--company <company_id>`, else `BEEL_COMPANY_ID`, else the account's only company (found with the `companies:list` scope). With several companies and none chosen, the CLI exits with code `2` and lists them. Account-level commands take `--account` / `BEEL_ACCOUNT_ID`.

**Sandbox is the default.** Every command uses the test key unless `--live` is passed explicitly. A live key without `--live` is an error, not a silent upgrade — so it's safe to experiment. Never pass `--live` unless the user explicitly asks for production.

`--live` is a global flag and goes before the resource:

```bash
npx @beel_es/cli --live invoices list
```

## Usage shape

```bash
npx @beel_es/cli invoices list --status PAID --limit 5
npx @beel_es/cli invoices get <invoice_id>
npx @beel_es/cli invoices create --data @invoice.json
npx @beel_es/cli invoices issue <invoice_id> --wait-for-pdf
npx @beel_es/cli invoices set-status <invoice_id> --status PAID
npx @beel_es/cli customers create --data @customer.json
npx @beel_es/cli customers patch <customer_id> --data '{"email":null}'   # fields left out don't change
npx @beel_es/cli nif validate --nif B12345678
npx @beel_es/cli invoices create-export --format SUMMARY --output invoices.xlsx
```

- IDs in the path are positional arguments; query parameters and top-level scalar body fields are flags named after the API field
- `--data` takes the whole body: inline JSON, `@file.json`, or `-` for stdin; flags override its keys
- Binary responses (PDF, ZIP, Excel) require `--output <path>`
- POST requests get an automatic `Idempotency-Key`

## Escape hatch — any endpoint

If a command doesn't exist in the installed CLI version, hit the endpoint directly:

```bash
npx @beel_es/cli request GET /v1/companies/{company_id}/invoices --query status=PAID
npx @beel_es/cli request POST /v1/companies/{company_id}/customers --data @customer.json
```

`{company_id}` and `{account_id}` are filled in the same way as for regular commands. The flat equivalents (`/v1/invoices`, `/v1/customers`, …) are deprecated and retire on 9 December 2026.

## Output contract (built for agents)

- **stdout**: response JSON, compact on one line (`--pretty` indents it). Nothing else — pipe straight into `jq`.
- **stderr**: errors as JSON: `{"error": {"code", "message", "status", "details", "request_id"}}`
- **Exit codes**: `0` ok · `1` unexpected · `2` usage/config · `3` auth (401/403) · `4` not found · `5` validation (400/409/422) · `6` rate limit · `7` server

## When to use CLI vs writing code

| Task | Tool |
|------|------|
| Look something up in the docs | CLI (`docs search`) — cheaper than fetching llms files |
| Verify a flow works against sandbox | CLI |
| Inspect existing data (invoices, customers) | CLI |
| Reproduce/debug an API error | CLI (`request` + exit codes) |
| One-off operations the user asks for | CLI |
| The project's production integration | Code (SDK/typed client — see `typed-client.md`) |

The CLI is for **looking up docs, operating and verifying**; the SDK/typed client is for the integration the project ships.
