# BeeL.

Skills and a hosted MCP server for building on the [BeeL](https://beel.es) invoicing API: Spanish e-invoicing with VeriFactu (AEAT), customers, products, series, recurring invoices and webhooks.

The plugin keeps only the API's stable invariants locally (authentication, idempotency, the response envelope, the invoice lifecycle) and reads everything else, such as endpoints, schemas and events, from the live documentation at [docs.beel.es](https://docs.beel.es), so it does not go stale.

## Install

In Claude Code:

```
/plugin install beel-api --marketplace beel-es/claude-plugins
```

Once it is listed in the Claude directory, it can also be added from claude.ai, Claude Desktop and Cowork.

## Skills

| Skill | What it does |
| ----- | ------------ |
| `beel-api` | Integration guide: rules, authentication, how to look up the docs, and recipes for a typed client, a webhook handler, the invoice flow, fiscal context, debugging and the BeeL CLI |
| `implement` | Detects the project's stack and implements the flows it needs: client setup, environments, invoices, customers, products, recurring invoices and exports |
| `audit` | Reviews an existing integration against the API's rules (idempotency, key handling, error handling, rate limits, webhook verification, invoice lifecycle) and reports findings with severity and a fix |
| `webhooks` | Builds a webhook receiver: HMAC-SHA256 signature verification, raw-body handling, deduplication and retry-aware processing |
| `upgrade` | Compares an integration with the live OpenAPI contract and changelog: breaking changes, deprecated patterns and new features |
| `multi-nif` | Explains and implements the multi-company model: the company in the path, accounts, members and managed companies |

## MCP server

The plugin connects the hosted BeeL MCP server at `https://mcp.beel.es/mcp` (Streamable HTTP). It signs in with OAuth in the browser, so no API key is stored in the plugin. Its tools issue and correct invoices, manage customers, products and series, validate NIFs, and search the BeeL docs. Each tool declares whether it only reads or also writes, so Claude can ask before a write.

## What the plugin sends and fetches

- **docs.beel.es**: the skills fetch public documentation pages, the OpenAPI contract and the changelog.
- **mcp.beel.es**: the MCP server receives the tool calls Claude makes, with the account you signed in to.
- **app.beel.es**: shown only in code examples for your own integration; the plugin does not call it itself.

The plugin runs no hooks, scripts or local servers of its own. Some skills offer to run the BeeL CLI (`npx @beel_es/cli`) to search the docs or try a request in the Test environment; Claude asks before running it, and the CLI uses the BeeL credentials you signed it in with. The code examples read the API key from your project's environment variables, which is how your own integration should load it; the plugin does not read or send them.

## Requirements

A BeeL account. Its Test environment (sandbox) is available, so you can try every flow without issuing real invoices.

## Support and privacy

- Documentation: [docs.beel.es/docs/claude-code](https://docs.beel.es/docs/claude-code)
- Support: [hola@beel.es](mailto:hola@beel.es)
- Privacy policy: [beel.es/privacidad](https://beel.es/privacidad)

## License

MIT
