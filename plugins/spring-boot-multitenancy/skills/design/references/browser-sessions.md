# Browser sessions and cookies

## Contents

- Session model
- Cookie policy
- CSRF
- Fixation and concurrency
- Tenant switching
- Logout and revocation

## Session model

Use an opaque random session identifier in the browser and server-side state in a database or Spring Session store. Store only a hash of the session identifier when practical. Session state identifies the user and authentication strength; authorization and current company access must remain re-evaluable.

Do not reuse API keys as cookies. Browser sessions and API clients have different CSRF, rotation, lifetime and interaction models.

## Cookie policy

Use a host-only cookie where possible:

```text
__Host-session=<opaque>; Path=/; Secure; HttpOnly; SameSite=Lax
```

`__Host-` requires `Secure`, `Path=/` and no `Domain`. Choose `SameSite=Strict`, `Lax` or `None` from real cross-site flows; `None` requires `Secure`. Do not treat SameSite as the sole CSRF defense.

Keep access lifetime short, enforce absolute and idle expiry server-side and avoid placing tenant IDs or permissions in mutable cookies.

## CSRF

Cookie-authenticated state-changing requests require CSRF protection. Use Spring Security's CSRF support and a token strategy compatible with the frontend. Do not globally disable CSRF merely because some endpoints are JSON. It is safe to ignore CSRF only for a separate stateless API-key chain that cannot authenticate with cookies.

Validate `Origin`/`Referer` as defense in depth. CORS is not CSRF protection.

## Fixation and concurrency

Rotate the session ID on authentication and privilege elevation. Spring Security's default session-fixation protection should remain enabled. Define concurrent-session behavior deliberately; account takeover response may require terminating other sessions.

On password change, MFA reset, account disable or high-risk role change, revoke relevant sessions. Record authentication time and strength for step-up checks.

## Tenant switching

A company switch is an authorization operation, not a UI preference:

1. receive desired company ID;
2. verify active account membership and company grant;
3. update server-side preference or request context;
4. rotate/renew CSRF state if the application design requires it;
5. audit the switch for sensitive contexts.

Always revalidate company access per request or against a versioned authorization cache. Never trust a company ID stored in local storage as authority.

## Logout and revocation

Logout invalidates server-side state and expires the cookie with matching attributes. Support “log out all sessions,” administrative revocation and incident response. Do not log session IDs. Use an irreversible fingerprint for correlation if necessary.
