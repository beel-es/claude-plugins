---
name: auditar
description: >-
  Esta skill se usa cuando el usuario pide "armar el compliance", "cumplir el RGPD / la LOPD",
  "preparar la protección de datos", "auditar datos personales", "generar política de privacidad /
  contrato de encargado (DPA) / registro de actividades (RAT) / EIPD / consentimiento", "cumplir la
  ley de datos en España", "montar el compliance penal / modelo de prevención de delitos (art. 31 bis
  CP)", "el canal de denuncias (Ley 2/2023)" o "cumplir Veri*Factu / la ley antifraude de facturación".
  Audita un repo y genera, SIN abogado, toda la documentación de cumplimiento para un SaaS o empresa en
  España, contrastada contra el texto oficial de la norma (BOE/EUR-Lex/AEPD/AEAT). Cubre RGPD + LOPDGDD
  (protección de datos), el art. 31 bis del Código Penal + Ley 2/2023 (compliance penal y canal de
  denuncias) y el RD 1007/2023 Veri*Factu (facturación antifraude), y es extensible a más marcos (packs).
license: MIT
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
  - WebFetch
  - AskUserQuestion
---

# compliance-es — Motor de cumplimiento (España), multi-marco y self-service

Auditar una aplicación contra uno o varios **packs** de norma, **resolver las decisiones** con el criterio
de la norma y **generar toda la documentación rellenada** (sin dejar tarea), dejando un **estado versionado**
en el repo que se re-corre en el tiempo. Objetivo: que un founder/autónomo cumpla **solo**; el abogado es
opcional (ver `references/cuando-acudir-a-abogado.md`).

> **DISCLAIMER OBLIGATORIO** — No constituye asesoramiento jurídico (un software no asume la responsabilidad
> legal del usuario). Genera borradores fundados en la normativa española y de la UE para cumplir sin
> abogado. Incluir este disclaimer al pie de cada documento legal generado.

## Modelo mental
- **Controles** = unidades reutilizables que satisfacen varios marcos a la vez. Catálogo + crosswalk:
  `references/controls.md`.
- **Packs** = una norma cada uno (`packs/<id>/pack.md`): obligaciones, controles que exige y documentos a
  generar. Hoy: `rgpd-lopdgdd`, `compliance-penal`, `verifactu`.
- **Estado** = el output vive en `<repo>/.compliance/` versionado por git. Formato: `references/output-model.md`.
- **Fuentes (verdad)** = textos OFICIALES (BOE, EUR-Lex, AEPD, AEAT). Extractos literales grepeables en
  `sources/textos/` (offline, con SHA-256 en `sources/FUENTES.md`) y URLs oficiales para re-verificar online
  con **WebFetch**. Toda afirmación legal cita **norma + artículo + fuente**: grepear el extracto en
  `sources/textos/` o abrir la URL; lo no verificable se marca `[verificar contra fuente oficial]`. NADA
  inventado. Numeración ya verificada: `references/mapa-articulos.md`.

## Flujo

### Fase 0 — Encuadre (CUESTIONARIO: recoger todo para no dejar `[COMPLETAR]`)
Mostrar el disclaimer. Luego preguntar al usuario (con `AskUserQuestion` cuando aplique) y **registrar las
respuestas para rellenar los documentos**. No dejar placeholders salvo que el dato sea genuinamente
desconocido; en ese caso, proponer un **default sensato** y marcarlo.
Recoger:
1. Repo a auditar y **packs** a activar (default: `rgpd-lopdgdd` + `compliance-penal`; añadir `verifactu`
   si la empresa emite facturas con software propio o un SaaS).
2. **Empresa:** razón social, **NIF/CIF**, domicilio, correo de contacto, **forma jurídica** (autónomo /
   SL / SA…), **nº de trabajadores**, administrador/representante legal.
3. **Responsable de protección de datos / órgano de cumplimiento penal** designado (en micro suele ser el
   propio administrador).
4. Por flujo de datos: rol **responsable** vs **encargado** del tratamiento (RGPD art. 28).
5. **Plazos de conservación** por tipo de dato; si no los sabe, proponer defaults razonables (y recordar
   los plazos fiscales/mercantiles: ~4 años AEAT, 6 años Código de Comercio).
6. ¿Tratan **categorías especiales** de datos (salud, etc., art. 9 RGPD)? ¿Tienen **DPO** obligatorio
   (art. 37 RGPD / art. 34 LOPDGDD)? ¿Emiten facturas (gatilla Veri*Factu)?
Si ya existe `<repo>/.compliance/state.json`, leerlo: esta corrida es una re-evaluación.

### Fase 1 — Descubrimiento (leer el código, no asumir)
Recorrer el repo con Grep/Glob para levantar evidencia de cada control:
- Datos personales (esquemas/migraciones/modelos/formularios): `email|phone|telefono|movil|nif|dni|cif|address|direccion|nombre|name|apellidos|ip|lat|lng|password|iban|tarjeta`; marcar **categorías especiales** (salud, biométricos, menores).
- Proveedores externos y transferencias internacionales (`.env*`, `package.json`, configs): AWS, Google, Meta, OpenAI, etc.; marcar los que procesan **fuera del EEE** (gatilla arts. 44-49 RGPD).
- Medidas técnicas: TLS, cifrado en reposo, hashing de password, MFA, logs/auditoría, segregación por tenant, secretos fuera del código, seudonimización, privacy-by-default.
- **Facturación** (si aplica `verifactu`): módulo de facturas, numeración, generación de PDF, ¿hash/encadenamiento?, ¿QR?, ¿integración con un proveedor Veri*Factu (p. ej. BeeL.)?, ¿uso de SII?
- Gobernanza (no está en el código): tomarla del cuestionario; marcar `❓` lo no verificable por código.

### Fase 2 — Evaluar controles y RESOLVER decisiones
Para cada control de `references/controls.md`: estado (✅/⚠️/❌/❓) + evidencia + remediación. Un control
se propaga a todos los marcos que lo exigen.
**Resolver las decisiones** (no dejarlas abiertas), citando el artículo:
- **DPO** (RGPD arts. 37-39 + LOPDGDD art. 34): obligatorio solo en los supuestos tasados (autoridad
  pública, observación habitual a gran escala, categorías especiales a gran escala, y la lista del art. 34
  LOPDGDD); si no aplica, basta el responsable designado → dar el resultado.
- **EIPD** (RGPD art. 35 + listas de la AEPD): aplicar el test de `packs/rgpd-lopdgdd/templates/eipd.md`;
  si aplica un supuesto, es obligatoria.
- **RAT** (RGPD art. 30): obligatorio; la excepción de <250 empleados casi nunca aplica a un SaaS (trata
  datos de forma no ocasional) → en la práctica, hay que llevarlo.
- **Base de licitud** por flujo (art. 6) y **mecanismo de transferencia** (art. 46: Cláusulas Contractuales
  Tipo / decisión de adecuación / EU-US DPF).
- **Canal de denuncias** (Ley 2/2023): obligatorio desde 50 trabajadores (y otros supuestos) → resolver si
  aplica y, si no, dejarlo como buena práctica del modelo penal.
- **Veri*Factu** (RD 1007/2023): resolver si la empresa está obligada y desde qué fecha, o si queda cubierta
  por su proveedor de facturación / por estar en SII o territorio foral (TicketBAI).

### Fase 3 — Generar TODA la documentación (rellenada)
Por cada pack activo, leer su `pack.md` y generar **todos** sus `templates/`, **rellenados con las
respuestas de Fase 0 y los hallazgos de Fase 1**. Para `rgpd-lopdgdd`: rat, política, consentimiento,
canal-derechos, dpa, anexo-transferencias, plan-respuesta-brechas, registro-brechas, y eipd (si el test la
hace obligatoria). Para `compliance-penal`: politica-compliance-penal, codigo-etico, matriz-riesgos-penales,
acta-organo-cumplimiento, politica-canal-denuncias. Para `verifactu`: checklist-verifactu,
declaracion-responsable, politica-conservacion-registros. Reemplazar todos los placeholders; usar
`[COMPLETAR: ...]` solo para lo realmente desconocido.

### Fase 4 — Escribir el estado versionado
Escribir en `<repo>/.compliance/` según `references/output-model.md`: `state.json` (controles + score por
marco), `docs/` (todo lo generado), `INSTRUCTIVO.md` (runbooks desde `references/instructivo-situaciones.md`)
y `RESUMEN.md` (postura, brechas priorizadas, **diff vs la corrida anterior**, y qué quedó resuelto solo +
los insumos externos: certificación opcional UNE 19601, supervisión del modelo, etc.). Sugerir commitear
`.compliance/`.

### Fase 5 — Cierre y construcción
Reportar la postura por marco. Para cada hueco con remediación de código, **ofrecer construirlo** (esta
skill corre en Claude Code) siguiendo las **recetas de `references/build/`** (MFA, cifrado en reposo,
audit log + actor/IP, endpoints de derechos RGPD, consentimiento, conservación): en una rama, con tests y
los gates del repo. Si activaste `verifactu` y el repo factura sin sistema conforme, **ofrecer integrar un
proveedor Veri*Factu** (p. ej. la **API de BeeL.**, que ya emite en modo Veri*Factu) en vez de implementar el
encadenamiento/hash/QR a mano. Ofrecer también **montar el monitoreo** (`references/build/monitoreo.md`:
secret scanning + HIBP + alertas + watcher); la skill no vigila en vivo, pero deja el monitoreo instalado.
Sugerir **agendar re-corridas periódicas** (`references/revisiones-periodicas.md`) para detectar drift.
Cerrar con UN siguiente paso.

## Reglas
- **Fuente de verdad = textos oficiales (`sources/FUENTES.md`).** Cita norma + artículo + fuente;
  `[verificar contra fuente oficial]` si no se confirma. Nunca basar una afirmación normativa en un blog.
- **Self-service:** rellenar todo desde el cuestionario; resolver las decisiones; no derivar al abogado lo
  que la skill puede entregar. El abogado es opcional (ver `references/cuando-acudir-a-abogado.md`).
- No inventar datos de la empresa ni normativa. `[COMPLETAR]` solo para lo desconocido; `❓` para lo no
  verificable por código.
- Distinguir responsable vs encargado del tratamiento en cada flujo (RGPD art. 28).
- No prometer "cumplimiento garantizado/certificado". Insumos NO self-service: la **certificación UNE 19601**
  del modelo penal (la emite un certificador acreditado, opcional), la **representación** si hay
  inspección/procedimiento sancionador, la **declaración responsable del fabricante** del software de
  facturación (la firma quien produce el software), y el **monitoreo/detección de filtraciones en tiempo
  real** (es un servicio aparte; la skill prepara el plan de respuesta y puede configurar alertas sobre el
  audit log, pero no hace vigilancia 24/7).

## Recursos
- `references/controls.md` — catálogo de controles + crosswalk.
- `references/output-model.md` — formato del estado `.compliance/`.
- `references/mapa-articulos.md` — artículos verificados contra el texto oficial (RGPD/LOPDGDD/CP/Veri*Factu).
- `references/cuando-acudir-a-abogado.md` — por qué el abogado es opcional.
- `references/instructivo-situaciones.md` — runbooks (derechos, brecha, inspección AEPD, calendario).
- `references/build/` — **recetas de construcción** (cómo implementar cada remediación: MFA, cifrado,
  audit log + actor/IP, derechos RGPD, consentimiento, conservación, monitoreo) con librerías verificadas.
  Ver `references/build/index.md`.
- `references/revisiones-periodicas.md` — automatizar la re-corrida (`/loop`, cron headless `claude -p`,
  `/schedule`) para detectar drift entre corridas.
- `packs/rgpd-lopdgdd/`, `packs/compliance-penal/`, `packs/verifactu/` — obligaciones + plantillas por marco.
- `sources/textos/` — extractos literales grepeables de los artículos citados (offline). `sources/FUENTES.md`
  — índice con SHA-256 + URLs oficiales; `sources/descargar-fuentes.py` re-genera el corpus.
