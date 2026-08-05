# Multitenancy en Spring Boot: el playbook que me habría gustado recibir antes de diseñar un SaaS

La mayoría de implementaciones multitenant empiezan con una columna `tenant_id` y una regla informal: “acuérdate de filtrar siempre”.

Eso no es aislamiento. Es una promesa distribuida entre cientos de consultas futuras.

Un sistema multitenant sólido se diseña como una cadena de invariantes que comienza en el contrato HTTP y termina en PostgreSQL. Si una sola capa pierde el contexto, la petición debe fallar cerrada.

He preparado un playbook ejecutable por agentes para diseñar, implementar y auditar esa cadena en Java con Spring Boot, Spring Security y PostgreSQL. No es un tutorial lineal: inspecciona tu repositorio, toma decisiones explícitas, genera ADRs, OpenAPI, políticas RLS, matriz de permisos, plan de migración y pruebas adversariales.

## El modelo: tres ejes antes de hablar de tablas

Imaginemos un SaaS de gestión de proyectos:

```text
Account ──owns──> Company
   │                │
   └── API key      ├── CompanySpace(TEST) ──> Project ──> Task
       bound to     └── CompanySpace(LIVE) ──> Project ──> Task
       environment
```

Los tres primeros conceptos responden preguntas distintas:

- `environment`: ¿en qué plano de datos y efectos laterales operamos?
- `account`: ¿quién autentica, paga y posee las credenciales?
- `company`: ¿qué frontera empresarial posee los datos?

Una API key puede pertenecer a una cuenta, estar ligada a `TEST` y operar solo una lista de compañías. Un usuario puede ser administrador de la cuenta, editor en una compañía y mero lector en otra.

La decisión importante es separar dos objetos:

```java
record Actor(ActorType type, UUID id, UUID accountId, UUID environmentId,
             Set<Permission> permissions) {}

record TenantContext(UUID environmentId, UUID accountId,
                     UUID companyId) {}
```

`Actor` dice quién se autenticó. `TenantContext` dice dónde se ejecuta la operación. Autenticación y autorización dejan de ser la misma cosa.

## API first significa que el scope forma parte del contrato

Para colecciones, prefiero que el propietario sea visible:

```text
GET  /v1/companies/{companyId}/projects
POST /v1/companies/{companyId}/projects
GET  /v1/projects/{projectId}
```

La ruta anidada resuelve bajo qué compañía se lista o crea. Para recursos individuales, un ID global permite una ruta corta, pero conocer el UUID nunca concede acceso: el servicio autoriza la acción y PostgreSQL valida la pertenencia.

Si una API heredada usa `X-Active-Company`, el contrato debe definir la precedencia. Si ruta y cabecera difieren, la respuesta correcta es un error, no ignorar una y elegir una compañía por defecto. Los fallbacks silenciosos son fábricas de confused deputies.

## Dos credenciales, dos cadenas de seguridad

Una sesión de navegador y una API key no son intercambiables.

La sesión necesita cookie `Secure`, `HttpOnly`, política `SameSite`, protección CSRF, rotación frente a session fixation, expiración e invalidación del lado servidor.

La API key necesita entropía alta, secreto mostrado una sola vez, hash en reposo, scopes, entorno, política de compañías, caducidad, revocación y rotación solapada.

En Spring Security, conviene hacer esa diferencia explícita con dos `SecurityFilterChain`: una API stateless que no acepta cookies y una cadena web con sesión y CSRF. Desactivar CSRF globalmente porque “la API usa JSON” mezcla amenazas distintas.

La autorización efectiva tampoco es un rol suelto. Es una intersección:

```text
credencial activa
AND entorno permitido
AND cuenta correcta
AND acceso a compañía
AND scope/permiso para la acción
AND regla del recurso
```

Los roles agrupan permisos. Los servicios autorizan permisos. Las reglas que dependen del recurso viven cerca de la mutación y dentro de la transacción.

## RLS: la red de seguridad que también puede fallar abierta

La aplicación decide si el actor puede hacer `projects:write`. PostgreSQL decide qué filas pertenecen al contexto.

Pero RLS solo protege si la conexión de runtime no es propietaria, no tiene `BYPASSRLS`, y las tablas usan `ENABLE` más `FORCE ROW LEVEL SECURITY`.

El contexto debe fijarse en la misma conexión y transacción que ejecutará el SQL:

```sql
SELECT set_config('app.environment_id', :environmentId, true);
SELECT set_config('app.account_id', :accountId, true);
SELECT set_config('app.company_id', :companyId, true);
```

Ese `true` hace el valor local a la transacción. Hacer `SET` a nivel de sesión sobre HikariCP puede entregar a la siguiente petición una conexión con el tenant anterior.

Y nunca escribiría una política así:

```sql
current_setting('app.company_id', true) IS NULL
OR company_id = current_setting('app.company_id')::uuid
```

Si falta contexto, no queremos todas las filas. Queremos ninguna.

## No hace falta repetir los tres ejes en cada tabla

`task` pertenece a `project`; `project`, a un `company_space` que une compañía y entorno; y la compañía, a `account`. La política deriva los tres ejes:

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

Así evitamos que una fila acumule `environment_id`, `account_id` y `company_id` que podrían contradecirse. Si el coste del join aparece en mediciones reales, se puede denormalizar con constraints; no antes.

## Los bugs aparecen fuera del controller

Una solución no está terminada hasta cubrir:

- `@Async`, schedulers, colas y reintentos;
- claves de caché e idempotencia;
- búsquedas, exports y object storage;
- queries nativas y bulk updates;
- cambios de permisos concurrentes;
- reutilización de conexiones del pool;
- rotación y revocación de credenciales;
- roles de migración, backup y soporte.

Un worker no debe heredar un `ThreadLocal` HTTP. Debe recibir un scope persistido y confiable, crear un contexto nuevo, revalidar autoridad cuando corresponda y abrir su propia transacción.

## La prueba que importa es la negativa

Para cada agregado pruebo, como mínimo:

```text
misma compañía              → permitido
compañía hermana            → denegado
otra cuenta                 → denegado
mismo tenant, otro entorno  → denegado
sin contexto                → cero filas / denegado
path y header distintos     → error
foreign parent              → denegado
key revocada                → denegado inmediatamente
pool reutilizado            → ningún contexto residual
```

Y estas pruebas corren contra PostgreSQL real con el rol de runtime. H2 no demuestra políticas RLS.

## El entregable

El plugin incluye tres skills:

- `design`: inspecciona el repo y produce arquitectura ejecutable;
- `implement`: migra por verticales reversibles;
- `audit`: busca fugas con evidencia `file:line` y una matriz de amenazas.

La salida no es “añade un filtro”. Es un paquete con contrato OpenAPI, modelo de ownership, jerarquía de permisos, configuración de Spring Security, políticas RLS, tratamiento de transacciones y workers, rotación de tokens, plan de rollout, rollback y tests adversariales.

Lo publicaré como repositorio/plugin para que puedas dárselo directamente a un agente y pedirle:

```text
Diseña el multitenancy de este Spring Boot.
Necesito sesiones web, API keys y aislamiento RLS.
No inventes hechos del repositorio y entrégame un plan ejecutable.
```

Si estás construyendo un SaaS con Java, guárdalo. El coste de diseñar bien el aislamiento al principio es pequeño; el de demostrar después que nunca mezclaste dos tenants no lo es.
