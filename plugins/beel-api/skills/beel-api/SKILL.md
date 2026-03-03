---
name: beel-api
description: >
  BeeL invoicing API integration guide for Spanish autonomous workers.
  Use when implementing BeeL API calls, creating invoices, managing customers
  or products, or troubleshooting BeeL API responses.
argument-hint: "[resource or task]"
---

# BeeL API Integration Guide

BeeL is a SaaS invoicing platform for Spanish autonomous workers (autónomos) with VeriFactu compliance.

## Integration Options

Choose between two integration methods:

### Option 1: Node.js SDK (Recommended for Node.js/TypeScript)

**When to use:**
- Node.js or TypeScript projects
- You want full type safety and IDE auto-completion
- Standard use cases covered by the API

**Documentation:** [sdk-guide.md](sdk-guide.md)

---

### Option 2: Direct REST API

**When to use:**
- Non-Node.js environments (Python, Go, PHP, etc.)
- You need full control over requests (custom headers, retries)
- You need idempotency guarantees
- Bundle size is critical

**Documentation:** [rest-api-guide.md](rest-api-guide.md)

---

## Quick Reference

**Base URL:** `https://app.beel.es/api/v1`

**Authentication:** Include API key in `X-API-Key` header

```
X-API-Key: beel_sk_test_*    # Sandbox
X-API-Key: beel_sk_live_*    # Production
```

**Always fetch live documentation from:**

1. **Documentation index** (start here): `https://docs.beel.es/llms.txt`
2. **Node.js SDK docs**: `https://docs.beel.es/docs/node-sdk.mdx` (when published)
3. **OpenAPI spec**: `https://docs.beel.es/api/openapi`
4. **Specific endpoint docs**: `https://docs.beel.es/docs/<section>/<endpoint>.mdx`

**Never use static/cached docs** - always fetch from docs.beel.es for latest updates.

---

## Response Format

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-01-15T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

## Error Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": { "field": "error description" }
  }
}
```

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | OK |
| `201` | Created |
| `401` | Unauthorized |
| `404` | Not Found |
| `409` | Conflict (idempotency) |
| `422` | Validation Error |
| `500` | Internal Server Error |

---

## Resources

### In this skill folder:

- **[sdk-guide.md](sdk-guide.md)** - Node.js SDK integration (how to search docs + quick start)
- **[rest-api-guide.md](rest-api-guide.md)** - REST API integration (how to search docs + key concepts)
- **[endpoints.md](endpoints.md)** - Quick reference of all endpoints
- **[examples.md](examples.md)** - Code examples

### Always fetch live from docs.beel.es:

1. Start with index: `https://docs.beel.es/llms.txt`
2. Find the relevant page URL
3. Fetch that specific `.mdx` file
4. For schemas: `https://docs.beel.es/api/openapi`

**Never duplicate docs** - the skill teaches you where to find the latest info, not a static copy.

---

## Comparison: SDK vs REST API

| Feature | SDK | REST API |
|---------|-----|----------|
| Platform | Node.js/TypeScript only | Any language |
| Type safety | ✅ Full TypeScript types | ⚠️ Manual types or codegen |
| Idempotency | ❌ Not automatic | ✅ Built-in via headers |
| Auto-completion | ✅ Full IDE support | ⚠️ Depends on codegen |
| Bundle size | ~50KB (tree-shakeable) | Minimal (fetch only) |

**Choose SDK if:** Node.js/TypeScript + want type safety

**Choose REST API if:** Other languages, need idempotency control, or minimal bundle size

---

**Need help?** Load the relevant guide:
- For SDK: read [sdk-guide.md](sdk-guide.md)
- For REST API: read [rest-api-guide.md](rest-api-guide.md)
- For endpoints: read [endpoints.md](endpoints.md)
- For examples: read [examples.md](examples.md)

**Then fetch the live docs from docs.beel.es** for the most up-to-date information.
