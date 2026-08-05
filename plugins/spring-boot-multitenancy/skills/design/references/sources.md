# Primary references

Verify version-sensitive behavior against primary documentation before implementing:

- PostgreSQL row security: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- PostgreSQL `CREATE POLICY`: https://www.postgresql.org/docs/current/sql-createpolicy.html
- PostgreSQL runtime settings: https://www.postgresql.org/docs/current/functions-admin.html
- Spring Security servlet architecture: https://docs.spring.io/spring-security/reference/servlet/architecture.html
- Spring Security authorization: https://docs.spring.io/spring-security/reference/servlet/authorization/index.html
- Spring Security session management: https://docs.spring.io/spring-security/reference/servlet/authentication/session-management.html
- Spring Security CSRF: https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html
- Spring Session: https://docs.spring.io/spring-session/reference/
- Spring transaction management: https://docs.spring.io/spring-framework/reference/data-access/transaction.html
- OWASP API Security Top 10: https://owasp.org/API-Security/
- OWASP Session Management Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- OWASP Secrets Management Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
- RFC 9457 Problem Details: https://www.rfc-editor.org/rfc/rfc9457.html

Do not copy framework defaults from memory when security depends on them. Pin the Spring Boot/Security and PostgreSQL versions supported by the target repository, then use the matching documentation.
