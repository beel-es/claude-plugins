-- Replace identifiers deliberately. Run migrations as owner, application as app_runtime.
CREATE SCHEMA IF NOT EXISTS app;

CREATE OR REPLACE FUNCTION app.current_environment_id() RETURNS uuid
LANGUAGE sql STABLE PARALLEL SAFE
AS $$ SELECT nullif(current_setting('app.environment_id', true), '')::uuid $$;

CREATE OR REPLACE FUNCTION app.current_account_id() RETURNS uuid
LANGUAGE sql STABLE PARALLEL SAFE
AS $$ SELECT nullif(current_setting('app.account_id', true), '')::uuid $$;

CREATE OR REPLACE FUNCTION app.current_company_id() RETURNS uuid
LANGUAGE sql STABLE PARALLEL SAFE
AS $$ SELECT nullif(current_setting('app.company_id', true), '')::uuid $$;

ALTER TABLE project ENABLE ROW LEVEL SECURITY;
ALTER TABLE project FORCE ROW LEVEL SECURITY;

CREATE POLICY project_isolation ON project
FOR ALL TO app_runtime
USING (
  EXISTS (
    SELECT 1 FROM company_space cs
    JOIN company c ON c.id = cs.company_id
    WHERE cs.id = project.company_space_id
      AND cs.environment_id = app.current_environment_id()
      AND cs.company_id = app.current_company_id()
      AND c.account_id = app.current_account_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM company_space cs
    JOIN company c ON c.id = cs.company_id
    WHERE cs.id = project.company_space_id
      AND cs.environment_id = app.current_environment_id()
      AND cs.company_id = app.current_company_id()
      AND c.account_id = app.current_account_id()
  )
);
