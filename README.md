# BeeL Claude Plugins

Official [Claude Code](https://claude.ai/claude-code) plugins for the [BeeL](https://beel.es) invoicing API.

## Install

Open Claude Code in any project and run:

```
/plugin marketplace add beel-es/claude-plugins
/plugin install beel-api@beel
```

That's it. Claude will automatically activate the skill when you work with the BeeL API, or you can invoke it manually with `/beel-api`.

## Plugins

### `beel-api`

Gives Claude everything it needs to integrate the BeeL API correctly:

- Base URL, authentication, and environment setup
- Idempotency requirements (required on all POST requests)
- Response and error envelope formats
- Invoice types, statuses, and lifecycle
- How to generate typed clients from the live OpenAPI spec
- Where to fetch always-current docs (`/llms.txt`, `/llms-full.txt`, `/api/openapi`)

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
