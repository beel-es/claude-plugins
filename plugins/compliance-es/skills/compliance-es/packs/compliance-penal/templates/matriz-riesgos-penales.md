# Matriz de Riesgos Penales — [RAZÓN SOCIAL]

**Fecha:** [FECHA] · **Versión:** 1.0 · **Responsable:** [ÓRGANO DE CUMPLIMIENTO]

> Art. 31 bis.5.1ª CP: identifica, por proceso, dónde puede cometerse un delito del que responda la empresa,
> su nivel de riesgo y el control que lo mitiga. Actualizar al menos anualmente o ante cambios relevantes.

| Proceso | Delito potencial (art. CP) | Probabilidad | Impacto | Nivel | Control mitigante | Control técnico (id) | Estado |
|---|---|---|---|---|---|---|---|
| Facturación / fiscalidad | Fraude fiscal (305-310 bis) | [baja/media/alta] | [alto] | [medio] | Software de facturación conforme Veri*Factu + conservación | `fact-integridad` | [ ] |
| Pagos a proveedores | Blanqueo / cohecho (301, 286 bis) | | | | Autorización por importe + doble firma + KYC contraparte | `ctrl-interno` | [ ] |
| Contratación con el sector público | Cohecho / corrupción (427 bis) | | | | Debida diligencia + registro de regalos/invitaciones | `ctrl-interno` | [ ] |
| Acceso a sistemas/datos de clientes | Descubrimiento de secretos / daños informáticos (197, 264) | | | | MFA + logs + segregación por tenant | `sec-mfa`,`sec-logs`,`sec-tenant` | [ ] |
| Gastos / reembolsos | Administración desleal / estafa (252, 248) | | | | Política de gastos + revisión | `ctrl-interno` | [ ] |
| Marketing / propiedad intelectual | Infracción de PI/marcas (270-277) | | | | Revisión de contenidos y licencias | — | [ ] |
| Tesorería / cobros | Blanqueo (301) | | | | Límite de efectivo + conciliación bancaria | `ctrl-interno` | [ ] |
| Contratación / RRHH | Conflicto de interés / corrupción | | | | Declaración de conflictos | — | [ ] |

## Notas
- Niveles: combinar probabilidad × impacto (bajo/medio/alto).
- Los controles técnicos enlazan con `references/controls.md` (se evalúan en la auditoría del repo).
- Para procesos sin control aún, ese es el plan de remediación.
- Verificar el número de artículo de imputación de cada delito en el Código Penal consolidado
  (BOE-A-1995-25444) antes de usar la matriz en un expediente formal.

---
*Borrador generado con compliance-es (pack compliance-penal). No constituye asesoramiento jurídico; revisar con un abogado.*
