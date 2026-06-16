# Recipe: BeeL CLI (`@beel_es/cli`)

Agent-first CLI for the BeeL API. Two jobs: **search the docs cheaply** (no API key) and **run real API calls** (verify a flow against sandbox, inspect live data, test an endpoint before writing code). No install needed:

```bash
npx @beel_es/cli --help
```

## Docs search — the token-cheap way to verify against the docs

Prefer this over fetching `llms.txt` / `llms-full.txt` over HTTP. It downloads `llms-full.txt` once (cached 15 min in tmpdir), filters locally (search terms never leave the machine), and prints only the matching sections (~2KB) as markdown. **No API key needed.**

```bash
npx @beel_es/cli docs search create invoice     # matching sections only
npx @beel_es/cli docs search idempotency key
npx @beel_es/cli docs list                       # all pages (JSON) — discover what exists
npx @beel_es/cli docs get glossary               # one full page by title
```

Propose this to the user and let them confirm before running it, rather than silently pulling the full docs into context.

Node 20+. Commands are derived from the embedded OpenAPI spec at startup, so the CLI's own `--help` is always the source of truth for what it can do — **discover, don't guess**:

```bash
npx @beel_es/cli --help                    # top-level resources
npx @beel_es/cli invoices --help           # actions for a resource
npx @beel_es/cli invoices create --help    # flags, enums, defaults (from the spec)
```

## Auth & environments

```bash
export BEEL_API_KEY=beel_sk_test_...   # recommended for agent/CI use
```

**Sandbox is the default.** Every command uses the test key unless `--live` is passed explicitly. A live key without `--live` is an error, not a silent upgrade — so it's safe to experiment. Never pass `--live` unless the user explicitly asks for production.

## Usage shape

```bash
npx @beel_es/cli invoices list --status PAID --limit 5
npx @beel_es/cli invoices get <invoice_id>
npx @beel_es/cli invoices create --data @invoice.json
npx @beel_es/cli invoices issue <invoice_id> --wait-for-pdf
npx @beel_es/cli customers create --data '{"fiscal_name":"ACME SL", ...}'
npx @beel_es/cli nif validate --data '{"nif":"B12345678"}'
npx @beel_es/cli invoices export-excel --output invoices.xlsx
```

- `--data` accepts inline JSON, `@file.json`, or `-` for stdin
- Binary responses (PDF, ZIP, Excel) require `--output <path>`
- POST requests get an automatic `Idempotency-Key`

## Escape hatch — any endpoint

If a command doesn't exist in the installed CLI version, hit the endpoint directly:

```bash
npx @beel_es/cli request GET /v1/invoices --query status=PAID
npx @beel_es/cli request POST /v1/customers --data @customer.json
```

## Output contract (built for agents)

- **stdout**: response JSON, pretty-printed. Nothing else — pipe straight into `jq`.
- **stderr**: errors as JSON: `{"error": {"code", "message", "status", "details", "request_id"}}`
- **Exit codes**: `0` ok · `1` unexpected · `2` usage/config · `3` auth · `4` not found · `5` validation · `6` rate limit · `7` server

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
