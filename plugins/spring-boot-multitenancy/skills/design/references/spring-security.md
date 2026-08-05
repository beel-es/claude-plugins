# Spring Security design

## Contents

- Filter chains
- Principal and context types
- API-key filter
- Scope resolver
- Method/service authorization
- Error handling

## Filter chains

Use explicit ordered `SecurityFilterChain` beans when browser and API authentication differ:

```java
@Bean @Order(1)
SecurityFilterChain api(HttpSecurity http) throws Exception {
    return http.securityMatcher("/api/**")
        .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
        .csrf(csrf -> csrf.disable()) // this chain accepts no cookies
        .addFilterBefore(apiKeyFilter, BearerTokenAuthenticationFilter.class)
        .authorizeHttpRequests(a -> a.anyRequest().authenticated())
        .build();
}

@Bean @Order(2)
SecurityFilterChain browser(HttpSecurity http) throws Exception {
    return http.securityMatcher("/app/**", "/login", "/logout")
        .csrf(Customizer.withDefaults())
        .authorizeHttpRequests(a -> a
            .requestMatchers("/login").permitAll()
            .anyRequest().authenticated())
        .build();
}
```

Match all routes intentionally. Verify an endpoint cannot fall into a more permissive chain. CSRF is disabled above only because that chain is stateless and must reject cookie authentication.

## Principal and context types

Use immutable values:

```java
record Actor(ActorType type, UUID id, UUID accountId, UUID environmentId,
             Set<Permission> maximumPermissions) {}

record TenantContext(UUID environmentId, UUID accountId, UUID companyId) {}
```

Put the authenticated `Actor` in Spring Security's `Authentication`. Keep `TenantContext` in a request-scoped holder or explicit method argument. Prefer explicit arguments in domain/application services; use an accessor only at infrastructure seams.

Do not put JPA entities, secret material or mutable grant collections in the principal.

## API-key filter

Implement `OncePerRequestFilter` or an `AuthenticationFilter` backed by an `AuthenticationProvider`. The filter parses credentials; the provider verifies them and returns authenticated `Authentication`. Reject multiple Authorization values. Clear failure state and use a uniform `AuthenticationEntryPoint`.

Never continue the chain after failed authentication. Avoid logging raw headers. Update `last_used_at` asynchronously or rate-limited so authentication does not become a hot-row write.

## Scope resolver

Place scope resolution after authentication and before authorization that depends on company. Parse selector, load membership/key policy, require environment/account equality and produce `TenantContext`. An invalid selector is an error, never “no filter.”

For request-local storage, clean up in `finally`. Servlet `ThreadLocal` context does not propagate safely to `@Async`, Reactor or scheduled tasks. Those boundaries require explicit envelopes.

## Method and service authorization

Use request authorization for coarse checks and service methods for resource-aware decisions. `@PreAuthorize` is useful for stable permission checks, but avoid complex database logic in SpEL. A typed `AuthorizationService` is easier to test and audit.

Keep check and mutation in one transaction. Lock or version resources when a concurrent grant/ownership change creates a TOCTOU risk. RLS remains active throughout.

## Error handling

Map unauthenticated failures through `AuthenticationEntryPoint`, authorization failures through `AccessDeniedHandler`, and domain visibility consistently. Do not leak whether an invisible resource exists. Attach a trace ID, not principal secrets.
