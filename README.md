# BeeL Claude Plugins

Official [Claude Code](https://claude.ai/claude-code) plugins for the [BeeL](https://beel.es) invoicing API.

## Install

Open Claude Code in any project and run:

```
/plugin marketplace add beel-es/claude-plugins
/plugin install beel-api@beel
```

That's it. Claude activates the right skill automatically when you work with the BeeL API, or you can invoke them manually.

## Plugins

### `beel-api`

A docs-first toolkit for building and maintaining BeeL integrations. It keeps only stable invariants locally (auth, idempotency, envelope, invoice lifecycle) and fetches everything else — endpoints, schemas, events — from the live docs, so it never goes stale.

| Skill | What it does |
|-------|--------------|
| `/beel-api:beel-api` | Integration guide: golden rules, auth, doc lookup strategy, plus recipes (typed client / official SDK, webhook handler, invoice flow, fiscal context, debugging) |
| `/beel-api:implement` | Guided integration: detects your stack (official `@beel_es/sdk` for Node/TS, codegen for Python, raw HTTP otherwise) and implements the flows you need |
| `/beel-api:audit` | Audits your integration code against the BeeL rules — idempotency, key security, error handling, rate limits, webhook verification, invoice lifecycle — and reports findings with severity and fixes |
| `/beel-api:webhooks` | Builds a correct webhook receiver: HMAC-SHA256 signature verification, raw-body handling, deduplication, retry-aware processing |
| `/beel-api:upgrade` | Checks your integration against the live OpenAPI spec and SDK releases: breaking changes, deprecated patterns, new features worth adopting |

**Docs**: [docs.beel.es/docs/claude-code](https://docs.beel.es/docs/claude-code)

## Auto-enable for your project

Add this to your project's `.claude/settings.json` to suggest the marketplace automatically when the project is opened:

```json
{
  "extraKnownMarketplaces": {
    "beel": {
      "source": {
        "source": "github",
        "repo": "beel-es/claude-plugins"
      }
    }
  }
}
```

## License

MIT
