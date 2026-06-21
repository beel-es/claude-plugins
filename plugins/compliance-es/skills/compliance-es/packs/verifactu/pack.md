# Pack: Veri*Factu — Sistemas de facturación antifraude

> Marco: **Ley 11/2021** (antifraude, introduce el art. 29.2.j) y el 201 bis de la Ley General Tributaria) +
> **RD 1007/2023** (Reglamento de requisitos de los Sistemas Informáticos de Facturación, "RRSIF") +
> **Orden HAC/1177/2024** (especificaciones técnicas). El software de facturación debe garantizar
> **integridad, conservación, accesibilidad, legibilidad, trazabilidad e inalterabilidad** de los registros.

## ⚠️ Fechas VIGENTES (verificar siempre en la sede de la AEAT — han cambiado dos veces)
La **2ª prórroga** (Real Decreto-ley 15/2025, de 2 de diciembre) desplazó las fechas a **2027**:
| Obligado | Fecha vigente (junio 2026) |
|---|---|
| Productores/comercializadores de software (SIF ya conforme) | **29 de julio de 2025** (vencido) |
| Contribuyentes del **Impuesto sobre Sociedades** | **1 de enero de 2027** |
| Resto (autónomos en IRPF, IRNR con EP, atribución de rentas) | **1 de julio de 2027** |
> Las fechas de 2025/2026 que circulan en muchas guías están **derogadas**. Confirmar la vigente antes de
> afirmar nada: `[verificar contra sede AEAT]`.

## Controles que exige (ver `references/controls.md`)
`fact-integridad`, `fact-encadenamiento`, `fact-qr`, `fact-remision`, y de apoyo `sec-logs` (registro de
eventos), `sec-backups`, `ctrl-interno` (autorización de facturas/abonos).

## ¿A quién aplica? (art. 3 RD 1007/2023) — y exclusiones ("regla de los 4 NO" de la AEAT)
Obligados: contribuyentes de Sociedades, IRPF con actividad económica, IRNR con EP y entidades en atribución
de rentas que **usen un sistema informático** para facturar. **Excluidos** quienes: están en **SII**
(Suministro Inmediato de Información); tienen domicilio fiscal en **País Vasco/Navarra** (rige
**TicketBAI/Batuz/NaTicket**, no este reglamento); facturan **íntegramente a mano**; o están excluidos por
resolución. Canarias (IGIC), Ceuta/Melilla (IPSI) y el comercio online **sí** están incluidos.

## Requisitos técnicos del SIF (RD 1007/2023 + Orden HAC/1177/2024)
- **Registro de facturación de ALTA** por cada factura (art. 10: NIF y nombre del obligado, nº y serie,
  fecha, tipo, descripción, importe total, datos de encadenamiento, huella y firma) y de **ANULACIÓN**
  (art. 11: no se borra, se añade un registro encadenado).
- **Huella/hash SHA-256** de cada registro y **encadenamiento** con el hash del registro anterior (art. 12;
  Orden art. 13 y Lista L12) → inalterabilidad verificable.
- **Registro de eventos** (Orden art. 9): inicio/fin de modo no-Veri*Factu, detección de anomalías,
  restauración de backups, exportaciones, y un **resumen cada 6 horas** de operación.
- **Código QR** en **todas** las facturas (norma ISO/IEC 18004, 30×30–40×40 mm) y **leyenda "VERI*FACTU"** /
  "Factura verificable en la sede electrónica de la AEAT" **solo** cuando el sistema remite a la AEAT.
- **Declaración responsable** del **productor** del software (art. 13): el fabricante certifica por escrito,
  visible en el propio sistema y por versión, que cumple el RD 1007/2023.

## Dos modalidades
| | **VERI*FACTU** (remite a AEAT) | **NO VERI*FACTU** (conservación local) |
|---|---|---|
| Remisión de registros a la AEAT | Automática, en tiempo real | No (solo a requerimiento) |
| **Firma electrónica** de cada registro | **No exigida** (art. 16.3; basta la huella) | **Obligatoria** |
| **Registro de eventos** | No (todo va a la AEAT) | **Obligatorio** |
| Leyenda "VERI*FACTU" en factura | Sí | No |
| QR | Sí | Sí |
> Veri*Factu es **menos carga técnica** (sin firma de cada registro) y da presunción reforzada de
> cumplimiento. No-Veri*Factu es **más estricto** (firma + log + custodia local).

## Régimen sancionador (art. 201 bis LGT — cuantías fijas)
- **Usuario**: tenencia/uso de un sistema **no conforme o manipulado** → **50.000 €** por ejercicio.
- **Fabricante**: producir/comercializar sistemas no conformes → **150.000 €** por ejercicio y por tipo de
  sistema; **1.000 €** por cada sistema vendido sin la certificación/declaración debida.
> `[verificar]` la numeración interna de los apartados del art. 201 bis contra el BOE; las cuantías están
> confirmadas.

## Lo más importante para un SaaS / autónomo (cómo cumplir barato)
**No reimplementes Veri*Factu a mano.** Lo correcto y económico es **facturar a través de un proveedor que
ya emita en modo Veri*Factu** (un SaaS de facturación conforme, p. ej. la **API de BeeL**). Eso traslada al
proveedor el riesgo de conformidad del **software** (sanciones de 150.000 €/1.000 €). **Pero al usuario le
sigue correspondiendo:** (1) **usar efectivamente** un sistema conforme, (2) **no manipularlo** (la sanción
de 50.000 €/ejercicio es por uso de sistema no conforme o alterado) y (3) **conservar y exhibir** los
registros a requerimiento. Ver la receta `references/build/facturacion.md` y la skill `/beel-api`.

## Factura electrónica B2B ("Crea y Crece", vía distinta)
La **Ley 18/2022** y su desarrollo (**RD 238/2026**) imponen la **factura electrónica obligatoria entre
empresas y autónomos**. Es un marco **independiente** de Veri*Factu y aún no exigible: sus plazos (12 meses
para facturación >8 M€; 24 meses para el resto) **se cuentan desde una Orden técnica pendiente de publicar**
`[verificar]`. Tenerlo en el radar, no confundir con Veri*Factu.

## Documentos a generar (templates/ → `<repo>/.compliance/docs/` con prefijo `verifactu-`)
`checklist.md` (estado de conformidad del sistema de facturación), `declaracion-responsable.md` (plantilla/
recordatorio: la firma el **fabricante** del software), `politica-conservacion.md` (conservación y
trazabilidad de registros).
