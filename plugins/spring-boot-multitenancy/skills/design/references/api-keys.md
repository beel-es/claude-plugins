# API keys and token lifecycle

## Contents

- Token format and storage
- Authentication
- Scoping
- Creation and display
- Rotation and revocation
- Abuse controls

## Token format and storage

Use a structured opaque token:

```text
pk_live_<public-id>_<secret>
```

The prefix identifies credential type and environment for routing and human safety; it is not authorization. Generate at least 256 bits of random secret material with a CSPRNG. Store:

- stable key ID and non-secret public lookup ID/prefix;
- a keyed hash/HMAC or password-style hash of the secret;
- account, environment, company policy and scopes;
- created, expiry, last-used, revoked and rotation lineage timestamps;
- creator and audit metadata.

Never store or log the plaintext after creation. A fast keyed HMAC is appropriate for high-entropy random tokens when the server-side pepper lives in a secret manager; password hashes are slower and easier to deploy without a pepper. Document the chosen threat model. Compare in constant time.

## Authentication

1. Parse `Authorization: Bearer ...`; reject duplicates and ambiguous credentials.
2. Validate shape and declared environment before database work.
3. Find by public ID using an indexed query.
4. Verify hash, active status, expiry and account status.
5. Create a machine `Actor` containing key ID, account ID, environment and maximum scopes; omit secret material.
6. Resolve requested company against the key policy.

Return a generic `401` for unknown, malformed, expired and revoked tokens. Keep detailed reason only in protected telemetry.

## Scoping

Use explicit, additive scopes (`projects:read`, `projects:write`) with least privilege. Avoid wildcard scopes unless there is a reviewed administrative use case. Company access modes:

- `SINGLE`: one immutable company ID;
- `ALLOW_LIST`: explicit join rows;
- `ACCOUNT_WIDE`: all current companies, high-risk and separately auditable.

Environment is bound into the credential record. A test key cannot select live context.

## Creation and display

Require recent strong user authentication and an account-level permission. Display plaintext exactly once. Return a fingerprint, name, scopes, company policy, expiry and last-used time for later identification. Set a maximum lifetime appropriate to risk; prefer short-lived OAuth/client credentials where ecosystem support exists.

## Rotation and revocation

Rotation is overlap, not in-place mutation:

1. Create a successor with an equal or narrower policy and `rotated_from_id`.
2. Display it once and start a bounded overlap window.
3. Observe successor use.
4. Revoke the predecessor explicitly or automatically at deadline.
5. Emit audit events for create, reveal, use anomaly, rotate and revoke.

Make revocation effective on the next request. If active-key records are cached, use short TTL plus invalidation and define measurable revocation latency. Do not embed long-lived authorization grants in self-contained tokens when immediate revocation is required.

## Abuse controls

- Rate-limit by key ID and account, not source IP alone.
- Detect impossible environment use, unusual company fan-out and repeated invalid prefixes.
- Never accept keys in URLs, form fields or cookies.
- Redact authorization headers at ingress, proxies, traces and error capture.
- Provide a leak runbook: revoke, identify requests, assess affected tenants, rotate downstream credentials and notify according to policy.

## When using OAuth/OIDC tokens

Prefer short-lived access tokens and validate signature algorithm, issuer, audience, timestamps and key ID against pinned provider configuration. Do not accept arbitrary JWK URLs from token claims. Keep tenant authorization server-side when grants need prompt revocation.

Rotate refresh tokens on every use. Store only their hashes, link them into a token family, invalidate the family when an already-consumed token is reused, and require reauthentication after detected reuse. Bind environment/account delegation explicitly; never infer company access solely from a client-supplied claim.
