# PostgreSQL row-level security

## Contents

- Roles and ownership
- Context settings
- Policies
- Inherited ownership
- Writes and bypasses
- Performance

## Roles and ownership

Use separate roles:

- migration/owner role: owns tables and manages DDL; not used by the application;
- runtime role: receives only required DML, owns no protected tables and lacks `BYPASSRLS`;
- tightly controlled operational role: exceptional maintenance only.

Table owners normally bypass RLS. Apply both:

```sql
ALTER TABLE project ENABLE ROW LEVEL SECURITY;
ALTER TABLE project FORCE ROW LEVEL SECURITY;
```

Superusers and roles with `BYPASSRLS` still bypass policies. Tests must connect as the real runtime role.

## Context settings

Set context inside each transaction on the same JDBC connection:

```sql
SELECT set_config('app.environment_id', :environmentId, true);
SELECT set_config('app.account_id', :accountId, true);
SELECT set_config('app.company_id', :companyId, true);
SELECT set_config('app.actor_id', :actorId, true);
```

The third argument `true` makes the value transaction-local. Validate UUIDs in SQL with a helper that returns null for missing/empty context or let casts fail closed. Never use a policy shaped like `setting IS NULL OR tenant_id = setting`.

A robust helper can centralize parsing:

```sql
CREATE FUNCTION app.current_company_id() RETURNS uuid
LANGUAGE sql STABLE PARALLEL SAFE
AS $$ SELECT nullif(current_setting('app.company_id', true), '')::uuid $$;
```

Create equivalent UUID helpers for `app.environment_id`, `app.account_id` and `app.actor_id`.

No context yields null; equality/`EXISTS` then evaluates false.

## Policies

Direct company ownership:

```sql
CREATE POLICY project_isolation ON project
FOR ALL TO app_runtime
USING (
  EXISTS (
    SELECT 1
    FROM company_space cs
    JOIN company c ON c.id = cs.company_id
    WHERE cs.id = project.company_space_id
      AND cs.environment_id = app.current_environment_id()
      AND cs.company_id = app.current_company_id()
      AND c.account_id = app.current_account_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM company_space cs
    JOIN company c ON c.id = cs.company_id
    WHERE cs.id = project.company_space_id
      AND cs.environment_id = app.current_environment_id()
      AND cs.company_id = app.current_company_id()
      AND c.account_id = app.current_account_id()
  )
);
```

Use `USING` for visible existing rows and `WITH CHECK` for inserted/updated rows. Define both explicitly.

## Inherited ownership

Leaf tables need not repeat every scope axis:

```sql
CREATE POLICY task_isolation ON task
FOR ALL TO app_runtime
USING (EXISTS (
  SELECT 1
  FROM project p
  JOIN company_space cs ON cs.id = p.company_space_id
  JOIN company c ON c.id = cs.company_id
  WHERE p.id = task.project_id
    AND cs.environment_id = app.current_environment_id()
    AND cs.company_id = app.current_company_id()
    AND c.account_id = app.current_account_id()
))
WITH CHECK (EXISTS (
  SELECT 1
  FROM project p
  JOIN company_space cs ON cs.id = p.company_space_id
  JOIN company c ON c.id = cs.company_id
  WHERE p.id = task.project_id
    AND cs.environment_id = app.current_environment_id()
    AND cs.company_id = app.current_company_id()
    AND c.account_id = app.current_account_id()
));
```

Index every join and predicate column: `task(project_id)`, `project(id, company_space_id)`, `company_space(id, environment_id, company_id)` and `company(id, account_id)`. Validate plans with tenant-shaped data.

## Writes and bypasses

RLS is not business authorization. It isolates rows but does not know whether `tasks:write` was intended unless permission data is also passed safely and encoded in policy. Prefer application authorization for actions and RLS for ownership.

Beware security-definer functions, table owners, superusers, backup jobs, logical replication and direct connections. Inventory each bypass path. Set a restrictive `search_path` on security-definer functions and fully qualify objects.

## Performance

RLS predicates run frequently. Keep helpers `STABLE`, index ownership paths, avoid volatile functions and benchmark representative tenants. Denormalize only after measurement; if adding `company_id` to a leaf, enforce consistency with the parent using composite keys or a trigger and test attempts to forge it.
