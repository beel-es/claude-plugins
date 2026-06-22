# Pack: RGPD + LOPDGDD — Protección de Datos Personales

> **Plenamente vigente.** Reglamento (UE) 2016/679 (**RGPD**, aplicable desde 25-may-2018) + **LOPDGDD**
> (Ley Orgánica 3/2018, de 5 de diciembre), que lo desarrolla en España. Aplica a todo responsable/encargado
> establecido en la UE (y a quien dirija servicios a la UE). Autoridad: **AEPD** (y autoridades autonómicas
> para el sector público de su territorio). No hay "periodo de gracia": las obligaciones rigen desde que
> empieza el tratamiento. Artículos verificados contra el consolidado de EUR-Lex y el BOE
> (`references/mapa-articulos.md`).

## Controles que exige (ver `references/controls.md`)
`gov-responsable` (DPO si aplica), `gov-registro` (RAT), `gov-politicas`, `gov-denuncias`/`data-rights-channel`,
`data-licitud`, `data-consent-text`, `data-derechos`, `data-info`, `data-minimizacion`, `data-dpa`,
`data-transfer`, `data-eipd`, `data-privacy-by-design`, `data-pseudonym`, `sec-tls`, `sec-rest`,
`sec-passwords`, `sec-mfa`, `sec-logs`, `sec-tenant`, `sec-secrets`, `sec-backups`, `inc-brechas`.

## Obligaciones clave (resumen, con artículo verificado)
- **Roles:** responsable (decide fines y medios) vs **encargado** (art. 28: trata por cuenta del responsable
  según contrato; no usa los datos para fines propios). Relación regida por un **DPA** (contenido mínimo en
  art. 28.3).
- **Bases de licitud (art. 6):** consentimiento, ejecución de contrato, obligación legal, interés vital,
  interés público, interés legítimo. Una por cada finalidad.
- **Consentimiento (art. 7 + considerando 32):** demostrable, libre, específico, informado e inequívoco
  mediante **acto afirmativo claro** (casilla NO premarcada). **Tan fácil de retirar como de dar** (art. 7.3).
- **Categorías especiales (art. 9):** prohibición general (salud, biometría, ideología, etc.) salvo
  excepción tasada del 9.2 (p. ej. consentimiento explícito).
- **Deber de información (arts. 13-14):** identidad y contacto, fines y base, destinatarios, transferencias,
  plazo de conservación, derechos, y —si los datos no se obtienen del interesado (art. 14)— **la fuente**.
- **Derechos (arts. 15-22):** acceso (15), rectificación (16), supresión (17), limitación (18), portabilidad
  (20, formato estructurado/lectura mecánica), oposición (21, incl. marketing), decisiones automatizadas (22).
  **Plazo de respuesta: 1 mes** (art. 12.3), prorrogable **2 meses más** si es complejo, informando en el
  primer mes.
- **Protección desde el diseño y por defecto (art. 25)** + **seguridad (art. 32)** proporcional al riesgo
  (seudonimización, cifrado, confidencialidad/integridad/disponibilidad/resiliencia).
- **Brechas:** notificar a la **AEPD sin dilación indebida y, de ser posible, en 72 horas** (art. 33), salvo
  improbabilidad de riesgo; **comunicar al interesado** si hay alto riesgo (art. 34); **registrar todas** las
  brechas (art. 33.5) aunque no se notifiquen.
- **RAT (art. 30):** obligatorio; la excepción de <250 empleados **decae** si el tratamiento no es ocasional,
  entraña riesgo o incluye categorías especiales → en un SaaS, en la práctica, **hay que llevarlo**.
- **DPO (arts. 37-39 + LOPDGDD art. 34):** obligatorio en los 3 supuestos del art. 37.1 (autoridad pública;
  observación habitual y sistemática a gran escala; categorías especiales/penales a gran escala) y en la
  lista del art. 34 LOPDGDD (p. ej. art. 34.1.d) prestadores de servicios de la sociedad de la información que
  elaboren **perfiles a gran escala**; art. 34.1.l) centros sanitarios obligados a conservar historias
  clínicas). Si no, basta el responsable designado.
- **EIPD (art. 35):** obligatoria ante probable **alto riesgo** (perfilado con efectos significativos,
  categorías especiales a gran escala, observación sistemática a gran escala; + listas de la AEPD).
- **Transferencias internacionales (arts. 44-49):** lícitas con **decisión de adecuación** (art. 45; incluye
  el **EU-US Data Privacy Framework** para empresas de EE. UU. autocertificadas, en vigor en 2026),
  **garantías adecuadas** (art. 46: **Cláusulas Contractuales Tipo** de la Decisión (UE) 2021/914, BCR), o
  excepciones del art. 49.

## Sanciones (RGPD art. 83 + LOPDGDD arts. 72-74 — verificado)
Dos tramos: **hasta 10 M€ o 2 %** del volumen de negocio anual mundial (art. 83.4) · **hasta 20 M€ o 4 %**
(art. 83.5, principios, derechos y transferencias) — se aplica la de mayor cuantía. Clasificación en España:
muy graves (art. 72, prescriben a 3 años), graves (art. 73, 2 años), leves (art. 74, 1 año).

## Atenuante / responsabilidad proactiva
La **responsabilidad proactiva** (art. 5.2): el responsable debe poder **demostrar** el cumplimiento. Toda la
documentación de este pack es esa prueba. La adhesión a códigos de conducta o certificaciones (arts. 40-42)
es un plus.

## Herramienta oficial para bajo riesgo
La AEPD ofrece **Facilita RGPD** (gratuita) para PYMES/autónomos con tratamientos de **bajo riesgo** (genera
RAT básico y cláusulas). No vale para alto riesgo (salud, gran escala): ahí se usa este pack completo.

## Documentos a generar (templates/ → `<repo>/.compliance/docs/` con prefijo `rgpd-`)
`rat.md`, `politica-privacidad.md`, `consentimiento.md` (opt-in + aviso por capas + categorías especiales),
`canal-derechos.md`, `dpa.md`, `anexo-transferencias.md` (Cláusulas Contractuales Tipo),
`plan-respuesta-brechas.md`, `registro-brechas.md`, `eipd.md` (si el test del art. 35 da obligatoria).
