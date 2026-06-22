# Política de Conservación y Trazabilidad de Registros de Facturación — [RAZÓN SOCIAL]

**NIF:** [NIF] · **Vigente desde:** [FECHA] · **Versión:** 1.0

> Da soporte a la obligación de conservar de forma íntegra, accesible, legible, trazable e inalterable los
> registros de facturación (art. 29.2.j) LGT + RD 1007/2023). Complementa la política de conservación de
> datos personales (RGPD), respetando que los **datos fiscales no se borran** durante su plazo legal.

## 1. Qué se conserva
- **Facturas emitidas y recibidas** y su representación (PDF/electrónica).
- **Registros de facturación** de alta y anulación, con su **huella/hash** y datos de **encadenamiento**.
- **Registro de eventos** (si el sistema opera en modo no-Veri*Factu).
- En modo **Veri*Factu**: justificantes de la **remisión a la AEAT**.

## 2. Plazos de conservación
- **Tributario:** durante el periodo de prescripción de los tributos afectados (**4 años**, ampliable si hay
  comprobación o bases/cuotas pendientes de compensar).
- **Mercantil:** los libros y documentación, **6 años** desde el último asiento (art. 30 Código de Comercio).
- Se aplica el **plazo más largo** que resulte exigible. Estos plazos **priman** sobre cualquier purga por
  minimización del RGPD: hasta su vencimiento, los datos de facturación se **bloquean**, no se borran.

## 3. Integridad e inalterabilidad
- Los registros **no se modifican** una vez emitidos: una corrección se hace con **factura rectificativa** o
  **registro de anulación** encadenado, nunca editando el original.
- La cadena de huellas (hash encadenado) permite **verificar** que no ha habido alteraciones.
- Accesos al sistema de facturación protegidos (ver controles `sec-mfa`, `sec-logs`).

## 4. Accesibilidad ante la AEAT
Los registros deben poder **exportarse y exhibirse** a requerimiento de la Agencia Tributaria en formato
legible, durante todo el plazo de conservación.

## 5. Responsable y proveedor
- **Responsable de la conservación:** [NOMBRE / CARGO].
- **Sistema/proveedor de facturación:** [SOFTWARE / PROVEEDOR]. [Si es un SaaS conforme: la generación,
  huella, encadenamiento y, en su caso, remisión a la AEAT las realiza el proveedor; la empresa conserva el
  acceso a los registros y la declaración responsable del fabricante.]

---
*Borrador generado con compliance-es (pack verifactu). No constituye asesoramiento jurídico ni fiscal; revisar con un asesor.*
