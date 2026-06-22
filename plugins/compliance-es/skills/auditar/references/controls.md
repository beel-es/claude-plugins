# Catálogo de controles + crosswalk

Cada **control** es una unidad reutilizable de cumplimiento. Un mismo control satisface
requisitos de **varios marcos a la vez** → se evalúa una vez y se propaga. Esta es la pieza
que hace genérico al motor: para agregar un marco nuevo, se le suman columnas a esta tabla
(o el pack referencia los `id` de control que exige).

> Estado por control: ✅ cumple · ⚠️ parcial · ❌ falta · ❓ no verificable por código.
> `evidencia`: `archivo:línea` o "declarado por el usuario". Anota remediación si no es ✅.

## Crosswalk (control → marcos)

| id | Control | RGPD + LOPDGDD (Datos) | Compliance penal (31 bis) | Veri*Factu (Facturación) | Ref. cruzada (ISO 27001 / SOC 2 / ENS) | Fuente de evidencia |
|----|---------|------------------------|---------------------------|--------------------------|----------------------------------|---------------------|
| `gov-responsable` | Responsable/órgano designado | DPO si aplica (art. 37) | Órgano de cumplimiento (art. 31 bis.2.2ª) | — | ISO A.5.3 / SOC2 CC1 | usuario |
| `gov-registro` | Registro/inventario formal | RAT (art. 30) | Matriz de riesgos penales | Registro de facturación | ISO A.5.9 | usuario + código |
| `gov-politicas` | Políticas documentadas | Política de privacidad | Código ético / política de compliance | Política de conservación | ISO A.5.1 | docs generados |
| `gov-formacion` | Formación al personal | buena práctica | Formación (parte del modelo) | — | ISO A.6.3 | usuario |
| `gov-auditoria` | Auditoría/revisión periódica | revisión del RAT | Verificación periódica del modelo (art. 31 bis.5.6ª) | — | ISO 9.2 / SOC2 CC4 | usuario |
| `gov-disciplinario` | Régimen disciplinario interno | — | Sí (art. 31 bis.5.5ª) | — | ISO A.6.4 | usuario |
| `gov-denuncias` | Canal de denuncias / información | canal de contacto/derechos | Canal interno (Ley 2/2023, art. 31 bis.5.4ª) | — | GDPR Art.38 | código + usuario |
| `data-licitud` | Base de licitud / consentimiento | Sí (art. 6) | — | — | GDPR Art.6 | código (formularios) |
| `data-consent-text` | Texto de consentimiento + revocación | Sí (arts. 7, 4.11) | — | — | GDPR Art.7 | docs + código |
| `data-derechos` | Derechos del interesado (acceso, rectif., supresión, oposición, portabilidad, limitación) | Sí (arts. 15-22, plazo 1 mes art. 12) | — | — | GDPR Art.15-22 | código (endpoints) |
| `data-info` | Deber de información (privacidad por capas) | Sí (arts. 13-14) | — | — | GDPR Art.13 | código + docs |
| `data-minimizacion` | Minimización y conservación | Sí (art. 5.1.c/e) | — | conservación de registros | GDPR Art.5 | código |
| `data-dpa` | Contrato de encargado (DPA) | Sí (art. 28) | control de terceros | — | GDPR Art.28 | docs + usuario |
| `data-transfer` | Transferencias internacionales con mecanismo | Sí (arts. 44-49) | — | — | GDPR Cap.V | código (.env/proveedores) |
| `data-rights-channel` | Canal/formulario para ejercer derechos | Sí (art. 12) | — | — | GDPR Art.12 | docs + código |
| `data-eipd` | Evaluación de Impacto (alto riesgo) | Sí (art. 35) | — | — | GDPR Art.35 | docs + usuario |
| `data-privacy-by-design` | Protección de datos desde el diseño y por defecto | Sí (art. 25) | — | — | ISO A.8.x / GDPR Art.25 | código |
| `data-pseudonym` | Seudonimización de datos | Sí (arts. 25, 32) | — | — | GDPR Art.32 | código |
| `sec-tls` | Cifrado en tránsito (TLS/HTTPS) | Sí (art. 32) | control interno TI | conservación íntegra | ISO A.8.24 / SOC2 CC6 | código/infra |
| `sec-rest` | Cifrado en reposo (datos sensibles/credenciales) | Sí (art. 32) | — | — | ISO A.8.24 / SOC2 CC6 | código/infra |
| `sec-passwords` | Hashing fuerte de contraseñas (bcrypt/argon2) | Sí (art. 32) | — | — | ISO A.8.5 | código |
| `sec-mfa` | MFA en accesos administrativos | Sí (art. 32) | control de acceso | acceso al sistema de facturación | ISO A.8.5 / SOC2 CC6.1 | código/infra/usuario |
| `sec-logs` | Logs de acceso y auditoría | Sí (art. 32) | control interno | **registro de eventos** (Veri*Factu) | ISO A.8.15 / SOC2 CC7 | código |
| `sec-tenant` | Segregación por tenant/cliente | Sí (art. 32) | — | — | SOC2 CC6 | código (`organizationId`) |
| `sec-secrets` | Secretos fuera del código | Sí (art. 32) | control interno | — | ISO A.8.24 | código (.env/secret mgr) |
| `sec-backups` | Backups y borrado/conservación | Sí (art. 32) | — | conservación de registros | ISO A.8.13 | infra/usuario |
| `inc-brechas` | Gestión de incidentes + notificación de brechas | Sí (arts. 33-34, **72 h** a la AEPD) | — | — | GDPR Art.33 / SOC2 CC7 | docs + usuario |
| `ctrl-interno` | Control interno: segregación de funciones / autorizaciones | — | Sí (art. 31 bis.5.1ª-3ª) | autorización de facturas/abonos | ISO A.5.x / SOC2 CC | usuario + código |
| `fact-integridad` | Integridad/inalterabilidad de registros de facturación | — | — | Sí (LGT art. 29.2.j) | — | código (facturación) |
| `fact-encadenamiento` | Encadenamiento + huella (hash) de registros | — | — | Sí (RD 1007/2023) | — | código (facturación) |
| `fact-qr` | QR + mención "Veri*Factu" en la factura | — | — | Sí (Disp. final 1ª RD 1007/2023 → art. 6.5 RD 1619/2012) | — | código (PDF/plantilla factura) |
| `fact-remision` | Remisión a la AEAT o conservación conforme (Veri*Factu vs no-Veri*Factu) | — | — | Sí (RD 1007/2023) | — | código (integración AEAT/proveedor) |
| `sec-monitoring` | Monitoreo y alertas (audit log, secretos, errores) | detección de brechas | detección de irregularidades | alerta sobre el registro de eventos | SOC2 CC7 | infra + usuario |

## Cómo usarlo
1. En Fase 1, junta evidencia para cada `id` que tengan los packs activos.
2. En Fase 2, asigna estado + evidencia + remediación por control.
3. El score de cada marco = % de sus controles requeridos en ✅ (⚠️ cuenta como medio).
4. Guarda el resultado por control en `state.json` (ver `output-model.md`).

> Nota Veri*Factu: si la empresa factura a través de un **proveedor conforme** (un SaaS que ya emite en
> modo Veri*Factu, p. ej. la API de BeeL.), los controles `fact-*` se consideran ✅ "cubiertos por el
> proveedor" — la evidencia es la integración + la declaración responsable del fabricante. No hay que
> reimplementar el hash/QR/encadenamiento a mano.
