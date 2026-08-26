# Pack: LSSI-CE + cookies + contratación electrónica

> Marco: **Ley 34/2002 (LSSI-CE)**, de servicios de la sociedad de la información y de comercio
> electrónico (BOE-A-2002-13758, consolidado; extractos literales en `sources/textos/lssi.txt`).
> Aplica a **cualquier web/SaaS con actividad económica** dirigida a España: aviso legal, cookies,
> comunicaciones comerciales y contratación electrónica. Autoridades: **Ministerio (SETID)** para la LSSI
> en general y **AEPD** para cookies y spam (arts. 43 LSSI). Complementa al pack `rgpd-lopdgdd`
> (el consentimiento de cookies y la prueba de aceptaciones se rigen además por el RGPD).

## Controles que exige (ver `references/controls.md`)
`lssi-aviso-legal`, `lssi-cookies`, `lssi-comunicaciones`, `lssi-contratacion`, `data-consent-records`,
y de apoyo `data-info`, `data-licitud`.

## Obligaciones clave (artículo verificado contra `sources/textos/lssi.txt`)
- **Aviso legal (art. 10):** información permanente, fácil, directa y gratuita: denominación, domicilio,
  email/contacto, **NIF**, datos registrales (Registro Mercantil), autorización administrativa si aplica,
  datos de profesión regulada, y **precios con indicación de impuestos y gastos de envío**.
- **Cookies (art. 22.2):** consentimiento **tras información clara y completa** sobre fines; excepción
  solo para el almacenamiento **técnico estrictamente necesario** para la transmisión o para prestar el
  servicio expresamente solicitado. Criterios prácticos: **Guía de cookies de la AEPD** (ed. 2023,
  criterios exigibles desde ene-2024): rechazar tan fácil como aceptar, sin muros de cookies abusivos,
  sin casillas premarcadas, renovación del consentimiento ≤ 24 meses.
- **Comunicaciones comerciales (art. 21):** prohibido el email/SMS publicitario **sin consentimiento
  previo**, salvo relación contractual previa y productos/servicios **similares** de la propia empresa;
  siempre con vía de **baja sencilla y gratuita** (art. 22.1: email válido en cada envío) y el anunciante
  identificable (art. 20).
- **Contratación electrónica (arts. 23, 27, 28):** el contrato electrónico es válido sin acuerdo previo
  (art. 23). **Antes** de contratar: informar de los trámites, si se **archivará el documento electrónico**
  y si será accesible, medios de corrección de errores e idiomas; y poner a disposición las **condiciones
  generales** para su almacenamiento y reproducción (art. 27.1 y 27.4). **Después**: confirmar la
  aceptación por acuse de recibo por email en **24 horas** o confirmación por medio equivalente (art. 28).
  En B2B (ningún contratante consumidor) los arts. 27.1 y 28 son **pactables en contrario** (27.2 y 28.3.b).
- **Evidencia de aceptación versionada (art. 27.1.b LSSI + art. 7.1 RGPD):** el prestador que declara
  archivar el contrato debe poder **exhibir qué versión exacta** de los términos/política aceptó cada
  usuario, cuándo y cómo. Este pack lo trata como control propio (`data-consent-records`): tabla de
  aceptaciones con `user_id`, documento, **versión + hash del texto**, timestamp, IP/user-agent, y un
  **histórico inmutable de versiones** de los términos publicados (con fecha de vigencia de cada una).

## Sanciones (arts. 38-39 — verificado contra el consolidado)
Leves hasta **30.000 €** · graves **30.001-150.000 €** · muy graves **150.001-600.000 €** (art. 39.1);
reiteración de muy graves → posible prohibición de actuar en España hasta 2 años. Típicas de un SaaS:
no disponer del email de baja en comunicaciones (grave, art. 38.3.d), spam masivo (grave 38.3.c),
incumplir cookies del art. 22.2 (**leve** 38.4.g o **grave** 38.3.i si hay reincidencia significativa).

## Decisiones que este pack resuelve
- **¿Necesita banner de cookies?** Solo si usa cookies NO exentas (analítica, publicidad, terceros).
  Cookies puramente técnicas (sesión, seguridad, preferencias solicitadas) → basta informar en la política.
  Analítica: la AEPD **no** considera exenta ni la analítica propia — requiere consentimiento
  `[verificar contra la Guía de cookies AEPD para matices de analítica de audiencia]`.
- **¿Acuse de recibo?** B2C: siempre (art. 28). B2B: pactable en las condiciones generales (art. 28.3.b) —
  la práctica correcta en SaaS es enviarlo igualmente (email de bienvenida/confirmación con los términos).
- **¿Dónde debe estar el aviso legal?** Accesible de forma permanente desde toda la web (footer).

## Documentos a generar (templates/ → `<repo>/.compliance/docs/` con prefijo `lssi-`)
`aviso-legal.md`, `politica-cookies.md` (+ inventario de cookies detectadas en el código),
`terminos-contratacion.md` (cláusulas LSSI para las condiciones generales + flujo de confirmación),
`registro-aceptaciones.md` (diseño del registro versionado de aceptaciones; receta de código en
`references/build/derechos-y-datos.md`).
