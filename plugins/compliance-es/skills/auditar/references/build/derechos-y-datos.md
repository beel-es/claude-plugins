# Receta: derechos del interesado y manejo de datos (arts. 12-22, 5 RGPD)

## 1. Export (acceso / portabilidad) — control `data-derechos` (arts. 15, 20)
Endpoint autenticado que junta TODOS los datos del interesado de todas las tablas y los entrega en formato
estructurado (JSON; CSV con `@json2csv/node` si conviene). La **portabilidad** (art. 20) exige formato
estructurado, de uso común y lectura mecánica.

**Pasos:** validar identidad/ownership → recolectar de cada tabla relacionada (en paralelo) → serializar
→ entregar como descarga → **registrar la solicitud** (audit log, sin loguear el contenido).
**Gotchas:** nunca incluir hashes de contraseña ni secretos; con datasets grandes, **streamear** (no cargar
todo en memoria); cuidado con relaciones lejanas (N+1). Plazo de respuesta: **1 mes** (art. 12.3),
prorrogable 2 meses más si es complejo, avisando en el primer mes.

## 2. Borrado / derecho de supresión — control `data-derechos` (art. 17)
Tres estrategias, se combinan según el dato:
- **Soft-delete** (`deletedAt`): reversible; toda query filtra `IS NULL` (índice parcial). Para "no verme más".
- **Anonimización** (hard delete de la PII): reemplazar nombre/DNI/correo por hash o `NULL` manteniendo la
  fila para auditoría/contabilidad. **A nivel de app** (un `UPDATE`), NO depender de la extensión
  `postgresql-anonymizer` (puede no estar disponible en Postgres gestionado — `[verificar]`).
- **Conservación legal (art. 17.3.b RGPD):** lo que la ley obliga a guardar (datos fiscales/contables: ~4
  años AEAT, 6 años Código de Comercio; facturación) NO se borra; se **bloquea** (LOPDGDD art. 32: datos
  a disposición solo de jueces, AEPD y administraciones, por el plazo de prescripción) y se anonimiza lo
  que no sea necesario.

**Gotchas:** **no** usar `ON DELETE CASCADE` a ciegas (borra y no deja rastro) → borrado explícito dentro
de una transacción. Backups: no se reescriben; documentar en la política el plazo (ej. "el borrado se
propaga; los backups se rotan en N días"). Hashear PII es reversible si se conoce el salt → para borrado
fuerte, `NULL` es más seguro. El **bloqueo** de la LOPDGDD (art. 32) es la figura española para datos que
no se pueden borrar por obligación legal.

## 3. Captura de consentimiento — control `data-consent-text` (arts. 7, 4.11)
Tabla `consents`: `userId`, `policyVersion`, `policyHash`, `ip`, `userAgent`, `categories` (jsonb),
`givenAt`, `revokedAt`, `method`. La IP del cliente sale de `x-forwarded-for` (primer valor) tras proxy.
**Revocar = crear un nuevo registro** con `revokedAt`/nuevas categorías, **no** sobrescribir el anterior
(la carga de la prueba del consentimiento es del responsable, art. 7.1). Servir la versión EXACTA de la
política que se aceptó (versionar el archivo, no editar in-place). El consentimiento debe ser tan fácil de
retirar como de dar (art. 7.3) y mediante **acto afirmativo claro** (casilla NO premarcada, considerando 32).

## 4. Conservación / purga automática — control `data-minimizacion` (art. 5.1.e)
Job programado que borra o anonimiza lo vencido. Opciones de scheduler: **GitHub Action (cron)** o cron
del hosting o un worker (`croner` / BullMQ si ya hay cola). Define una tabla de políticas
(`tabla → plazo → acción`). Respetar siempre los **plazos legales mínimos** (fiscal/mercantil) antes de purgar.
**Gotchas:** loguear cada corrida y **alertar si falla** (un cron mudo = datos vencidos acumulándose);
lock si puede correr en paralelo; **timezone explícito** (`Europe/Madrid`); testear con fecha mockeada
(no esperar 90 días).

> Versiones verificadas en npm 2026-06-21 (`@json2csv/node` v7.x). Confirmar con `npm view`.
