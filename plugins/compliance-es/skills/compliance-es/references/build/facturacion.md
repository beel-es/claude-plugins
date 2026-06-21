# Receta: facturación conforme Veri*Factu — controles `fact-*`

> Regla de oro: **no reimplementes Veri*Factu a mano.** El encadenamiento de registros, la huella (hash
> SHA-256), el formato exacto de los registros, el QR, el registro de eventos y la remisión a la AEAT
> tienen una especificación técnica detallada (Orden HAC/1177/2024) que cambia y que el fabricante del
> software debe **declarar responsablemente**. Para un SaaS o un autónomo, lo correcto y barato es
> **facturar a través de un proveedor que ya emita en modo Veri*Factu**.

## Opción recomendada: integrar un proveedor conforme (p. ej. BeeL)
**BeeL** es una API de facturación española que ya emite en modo Veri*Factu (huella, encadenamiento, QR y
remisión a la AEAT incluidos). Integrarla cubre `fact-integridad`, `fact-encadenamiento`, `fact-qr` y
`fact-remision` sin que tú mantengas la criptografía ni sigas los cambios de la Orden técnica.

- Skill de integración: **`/beel-api`** (en este mismo marketplace) — base URL, autenticación con
  `X-API-Key`, idempotencia en los POST, ciclo de vida de la factura.
- Docs vivas: `https://docs.beel.es/llms.txt` (índice) y `https://docs.beel.es/api/openapi` (esquema).
- Patrón: tu app crea el cliente/producto y llama a la API para **emitir** la factura; el proveedor
  genera el registro de facturación, lo encadena, calcula la huella, añade el QR y (en modo Veri*Factu)
  lo remite a la AEAT. Tú conservas el identificador y el PDF/representación.

**Qué te queda a ti aunque uses un proveedor:**
- Conservar las facturas y registros el plazo legal (ver `data-minimizacion` y la política de conservación).
- Guardar la **declaración responsable** del fabricante del software (la entrega el proveedor).
- No alterar los registros emitidos (las correcciones se hacen con factura rectificativa/registro de
  anulación, nunca editando el original).

## Si aun así mantienes tu propio SIF (no recomendado salvo producto de facturación)
Entonces eres "fabricante/productor de software" y asumes TODA la especificación:
1. **Registro de facturación de alta y de anulación** por cada factura, con todos los campos del formato.
2. **Encadenamiento**: cada registro incluye la huella del anterior (cadena tipo blockchain) → inalterabilidad.
3. **Huella/hash** SHA-256 de cada registro según el algoritmo exacto de la Orden HAC/1177/2024.
4. **Registro de eventos** (inicio/fin de funcionamiento, incidencias, exportaciones, etc.).
5. **QR** + mención **"VERI*FACTU"** / "Factura verificable en la sede electrónica de la AEAT" en la
   representación de la factura.
6. Modo **Veri*Factu** (remisión automática a la AEAT) **o** modo no-Veri*Factu (conservación local con
   requisitos más estrictos: firma electrónica, registro de eventos íntegro).
7. **Declaración responsable** de que el software cumple el RD 1007/2023.

> Verifica SIEMPRE la especificación y los plazos vigentes en la sede de la AEAT (no fijes el detalle
> técnico desde memoria; cambia). Ver `sources/FUENTES.md` y `packs/verifactu/pack.md`.
