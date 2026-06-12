# Recipe: BeeL CLI (`@beel_es/cli`)

Agent-first CLI for the BeeL API. Use it to **run real API calls** — verify a flow against sandbox, inspect live data, test an endpoint before writing integration code. No install needed:

```bash
npx @beel_es/cli --help
```

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
| Verify a flow works against sandbox | CLI |
| Inspect existing data (invoices, customers) | CLI |
| Reproduce/debug an API error | CLI (`request` + exit codes) |
| One-off operations the user asks for | CLI |
| The project's production integration | Code (SDK/typed client — see `typed-client.md`) |

The CLI is for **operating and verifying**; the SDK/typed client is for the integration the project ships.
