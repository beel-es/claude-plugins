# Registro versionado de aceptaciones (términos, privacidad, cookies) — [RAZÓN SOCIAL]

> Base: **art. 7.1 RGPD** (el responsable debe poder **demostrar** el consentimiento) + **art. 27.1.b
> LSSI** (archivo del documento electrónico del contrato) + art. 5.2 RGPD (accountability). Sin este
> registro, en una inspección no puedes probar QUÉ aceptó cada usuario ni QUÉ versión estaba vigente.

## Qué se registra (por cada aceptación)
| Campo | Ejemplo |
|---|---|
| `user_id` / email | — |
| Documento | `terminos` · `privacidad` · `cookies` · `marketing-optin` |
| **Versión aceptada** | `v3.2` |
| **Hash SHA-256 del texto** aceptado | prueba de integridad de esa versión |
| Timestamp (UTC) | `2026-08-26T10:00:00Z` |
| Evidencia técnica | IP, user-agent, mecanismo (checkbox del alta / re-aceptación / API) |

## Qué se archiva (por cada versión publicada de cada documento)
Texto completo, número de versión, **fecha de vigencia**, hash SHA-256, y quién/cómo lo aprobó.
El histórico es **inmutable** (append-only): nunca se sobrescribe una versión publicada.

## Reglas
- **Estado actual del repo:** `[✅/❌ hallazgo de Fase 1: ¿existe tabla de aceptaciones? ¿los términos
  están versionados o solo hay una página HTML que se sobrescribe?]`
- Cambio de términos **sustancial** → re-aceptación explícita (nuevo registro); cambio menor → aviso
  previo + registro de la fecha de comunicación.
- Conservación: mientras dure la relación + plazos de prescripción (acciones contractuales; en paralelo,
  bloqueo del art. 32 LOPDGDD si el usuario se borra).
- La baja de marketing se registra igual que el alta (art. 22.1 LSSI: revocable en cualquier momento).

## Implementación
Receta en `references/build/derechos-y-datos.md` (§consentimiento): tabla `consent_records` +
`document_versions`, sin UPDATE/DELETE (constraint o trigger), y snapshot/hash en el momento de aceptar.

---
*Borrador generado con compliance-es (pack lssi-cookies). No constituye asesoramiento jurídico ni garantiza el cumplimiento; se recomienda revisión por un abogado.*
