# Checklist de conformidad Veri*Factu — [RAZÓN SOCIAL]

**NIF:** [NIF] · **Fecha:** [FECHA] · **Sistema de facturación usado:** [SOFTWARE / PROVEEDOR]
**Fecha de obligación aplicable:** [1-ene-2027 si Impuesto sobre Sociedades · 1-jul-2027 resto]
(`[verificar contra sede AEAT — las fechas se han prorrogado dos veces]`)

> Estado por requisito: ✅ cumple · ⚠️ parcial · ❌ falta · 🟦 cubierto por el proveedor · N/A no aplica.

## A. ¿Estás obligado?
- [ ] Facturas usando un **sistema informático** (no solo a mano). → si NO, **excluido**.
- [ ] **No** estás en SII, **no** tienes domicilio fiscal en País Vasco/Navarra (si SÍ → TicketBAI/Batuz,
      no este reglamento). → "regla de los 4 NO" de la AEAT.

→ Si estás obligado, completa el resto.

## B. Conformidad del sistema
| # | Requisito | Norma | Estado | Evidencia |
|---|---|---|---|---|
| 1 | Registro de facturación de **alta** por factura | RD 1007/2023 art. 9-10 | | |
| 2 | Registro de **anulación** (no se borra, se encadena) | art. 11 | | |
| 3 | **Huella/hash SHA-256** + **encadenamiento** con el registro anterior | art. 12 / Orden art. 13 | | |
| 4 | **Registro de eventos** (solo modo no-Veri*Factu) | Orden art. 9 | | |
| 5 | **Firma electrónica** de cada registro (solo modo no-Veri*Factu) | art. 12 / 16.3 | | |
| 6 | **Código QR** en todas las facturas | Disp. final 1ª RD 1007/2023 (art. 6.5 RD 1619/2012) | | |
| 7 | **Leyenda "VERI*FACTU"** (solo si el sistema remite a la AEAT) | Disp. final 1ª RD 1007/2023 (art. 6.5 RD 1619/2012) | | |
| 8 | **Declaración responsable** del fabricante disponible | art. 13 | | |
| 9 | Modalidad declarada: ☐ Veri*Factu (remite) ☐ No Veri*Factu (local) | art. 15-16 | | |

## C. Lo que te corresponde como usuario (aunque uses un proveedor conforme)
- [ ] **Usar efectivamente** un sistema conforme (no uno casero no adaptado).
- [ ] **No manipular** el sistema ni los registros, y usar uno **certificado/conforme** (sanción al usuario:
      **50.000 €/ejercicio**, art. 201 bis.2 y .4 LGT).
- [ ] **Conservar** los registros y poder **exhibirlos** a la AEAT a requerimiento.
- [ ] Guardar la **declaración responsable** del proveedor del software.

## D. Resultado
- **Si facturas con un proveedor Veri*Factu** (p. ej. la API de BeeL): los requisitos 1-8 se marcan 🟦
  "cubierto por el proveedor"; tu trabajo es la sección C. Ver `references/build/facturacion.md`.
- **Si mantienes tu propio SIF**: eres "productor de software" y respondes de TODOS los requisitos + la
  declaración responsable. Recomendación: migrar a un proveedor conforme.

---
*Borrador generado con compliance-es (pack verifactu). No constituye asesoramiento jurídico ni fiscal; revisar con un asesor.*
