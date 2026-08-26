# Radar normativo — marcos SIN pack propio (evaluar en cada corrida)

> Actualizado: **agosto 2026**. Marcos que ya aplican (o van a aplicar) a un SaaS en España pero aún no
> tienen pack completo. En Fase 2, **resolver si aplican** al repo auditado y reflejarlo en `RESUMEN.md`
> (sección "Radar"); si uno aplica con fuerza, proponer crear su pack. Las fechas de aquí caducan:
> re-verificar contra la fuente oficial en cada corrida.

## 1. Data Act — Reglamento (UE) 2023/2854 · **YA APLICABLE (12-sep-2025)**
Aplica a todo **proveedor de "servicios de tratamiento de datos"** (SaaS/PaaS/IaaS) con clientes en la UE.
Obligaciones de **cambio de proveedor (switching)**, arts. 23-31 y 35:
- Eliminar obstáculos contractuales/técnicos al cambio; preaviso de terminación **máx. 2 meses**.
- Cláusulas obligatorias en el contrato: derecho a cambiar/egresar, plazo de transición, **exportación de
  datos en formato legible por máquina**, cooperación de buena fe.
- **Tarifas de switching**: reducidas desde sep-2025 y **prohibidas desde el 12-ene-2027** (art. 29).
- Aplica también a contratos preexistentes.
**Test rápido para el repo:** ¿los términos del SaaS contemplan terminación ≤2 meses y egress de datos?
¿Existe exportación completa de datos del cliente (API/dump)? → controles `data-act-switching` +
`data-portabilidad`. Fuente: https://eur-lex.europa.eu/eli/reg/2023/2854/oj

## 2. Accesibilidad — Ley 11/2023 (EAA, Directiva 2019/882) · **EN VIGOR (28-jun-2025)**
Obliga (Título I) a que los **servicios de comercio electrónico** dirigidos a consumidores sean accesibles
(EN 301 549 / WCAG 2.1 AA): todo el flujo web/app, incluido el pago. Servicios ya en el mercado antes de
28-jun-2025: transitoria hasta **28-jun-2030** si no hay modificación sustancial. **Excepción:
microempresas de servicios** (<10 trabajadores y ≤2 M€) están exentas (art. 2.3) — resolver con los datos
de Fase 0. Sanciones: leves hasta 30.000 € · graves hasta 90.000 € · muy graves hasta 1.000.000 €
`[verificar cuantías contra el texto]`. Un SaaS **B2B puro** (solo autónomos/empresas como clientes) queda
en zona gris: la EAA protege al **consumidor**; documentar la posición. Fuente:
https://www.boe.es/buscar/act.php?id=BOE-A-2023-11022

## 3. AI Act — Reglamento (UE) 2024/1689 · **por tramos; art. 50 desde el 2-ago-2026**
Solo si el repo **usa o expone IA**. Vigente ya: prohibiciones (feb-2025) y **alfabetización en IA del
personal** (art. 4, feb-2025). Desde el **2-ago-2026**: obligaciones de **transparencia del art. 50**
(informar cuando el usuario interactúa con una IA; marcar contenido generado/deepfakes) y régimen
sancionador con la **AESIA** como autoridad española. Alto riesgo (Anexo III): desplazado a **2027-2028**
por el "Ómnibus Digital" `[verificar estado del ómnibus — aún en tramitación en 2026]`. GPAI (modelos):
obligaciones desde ago-2025, son del proveedor del modelo (OpenAI/Anthropic/…), no del SaaS que lo usa —
pero el SaaS es "deployer": transparencia + supervisión humana + no usar para prácticas prohibidas.
Fuente: https://eur-lex.europa.eu/eli/reg/2024/1689/oj

## 4. NIS2 — Directiva (UE) 2022/2555 · **transposición española PENDIENTE (ago-2026)**
El Anteproyecto de **Ley de Coordinación y Gobernanza de la Ciberseguridad** (aprobado en Consejo de
Ministros el 14-ene-2025) **aún no está en el BOE**; España va tarde (dictamen motivado de la Comisión,
may-2025, y nuevo requerimiento may-2026). Afectará a entidades esenciales/importantes de sectores
anexados (incluye **proveedores de servicios digitales y gestionados**) normalmente a partir de **50
trabajadores / 10 M€** — una micro-pyme SaaS típica queda fuera salvo sector crítico. Qué hacer hoy:
nada obligatorio; los controles `sec-*` + `inc-brechas` de esta skill ya cubren la base de gestión de
riesgos que exigirá. Re-verificar publicación en BOE en cada corrida.

## 5. Factura electrónica B2B ("Crea y Crece") · **RD 238/2026 en vigor (20-abr-2026), plazos aún no corren**
Detalle en el pack `verifactu` (§Factura electrónica B2B). La exigibilidad depende de la **Orden
Ministerial** de la solución pública, prevista para la 2ª mitad de 2026 → estimaciones: >8 M€ hacia
oct-2027, resto hacia oct-2028 `[verificar]`. Para un SaaS de facturación es además una **feature de
producto** (interoperar con la solución pública / Facturae), no solo compliance.

## Cómo usar este radar en la auditoría
1. En Fase 2, para cada marco: **¿aplica?** (sí/no/zona gris + por qué, con los datos de Fase 0).
2. Si aplica: evaluar los controles asociados (`data-act-switching`, `a11y-eaa`, `ai-transparencia`).
3. En `RESUMEN.md`, sección **Radar**: veredicto + próxima fecha relevante + qué vigilar.
