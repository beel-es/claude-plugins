# Instructivo: qué hacer ante cada situación (runbooks)

Manual operativo para consultar cuando pase algo. La skill lo incluye en el output
(`<repo>/.compliance/INSTRUCTIVO.md`). El founder ejecuta esto **solo**; el abogado solo entra en la
representación de una inspección o procedimiento sancionador (caso reactivo).

---

## A. Llega un derecho del interesado (acceso, rectificación, supresión, oposición, limitación, portabilidad)
**Plazo: 1 mes** desde la recepción, prorrogable **2 meses más** si es complejo, avisando en el primer mes
(art. 12.3 RGPD). Gratuito salvo solicitudes manifiestamente infundadas o excesivas (art. 12.5).
1. Registra la solicitud (fecha, quién, qué pide) y **verifica la identidad** sin pedir datos de más.
2. Localiza sus datos (BD, backups, encargados).
3. Ejecuta: **acceso/portabilidad** → exporta en formato estructurado (JSON/CSV); **supresión** → borra o
   anonimiza (si hay obligación legal de conservar, **bloquea**, art. 32 LOPDGDD); **rectificación/
   oposición/limitación** → aplica.
4. Responde por escrito y **guarda evidencia**. Informa del derecho a reclamar ante la AEPD.

## B. Brecha de seguridad (acceso no autorizado, fuga, pérdida, alteración)
**Plazo: notificar a la AEPD sin dilación indebida y, de ser posible, en 72 horas** (art. 33).
1. **Contén:** aísla, revoca accesos, rota credenciales. Abre bitácora.
2. **Evalúa:** qué datos, cuántos interesados, nivel de riesgo. Si fue un encargado, exígele la información.
3. **Notifica:** a la **AEPD** vía Sede Electrónica (sede.aepd.gob.es) si hay riesgo; a los **interesados** si
   hay **alto riesgo** (art. 34). Si eres encargado, avisa también al **responsable**.
4. **Registra** la brecha en `rgpd-registro-brechas.md` aunque no la notifiques (art. 33.5).
5. **Cierra:** causa raíz + fix + actualiza el RAT y el plan. No notificar cuando procede es infracción.

## C. Te inspecciona la AEPD / abre un procedimiento sancionador
Único caso donde conviene un **[ABOGADO]** (la representación en el procedimiento es su terreno).
1. Designa un contacto único. Todo por escrito y en plazo.
2. **Identifica la fase:** ¿actuaciones previas de investigación o **acuerdo de inicio** del procedimiento
   sancionador?
3. **Reúne los antecedentes:** RAT, evidencia de consentimiento, medidas de seguridad (art. 32), registro de
   brechas, DPA, EIPD → ya están en `<repo>/.compliance/`.
4. **Responde cargo por cargo**, mostrando diligencia debida y remediación (atenúa, art. 76 LOPDGDD).
5. **Nunca:** ocultar o destruir documentación, ni ignorar plazos.

## D. Sospecha de delito / activación del canal de denuncias (compliance penal)
1. El **órgano de cumplimiento / Responsable del Sistema** recibe la comunicación, **acusa recibo en 7 días**
   y abre investigación con garantías (Ley 2/2023).
2. **Confidencialidad y no represalias.** Resuelve en **máx. 3 meses** (+3 prorrogable).
3. Si hay indicios de delito, valora la comunicación a las autoridades y aplica el **régimen disciplinario**.
4. Documenta todo (es prueba de la eficacia del modelo ante el art. 31 bis CP).

## E. Inspección de Hacienda sobre la facturación (Veri*Factu)
1. **Exhibe** los registros de facturación (alta/anulación, huellas, encadenamiento; eventos si no-Veri*Factu).
2. Aporta la **declaración responsable** del fabricante del software.
3. Si usas un proveedor conforme, aporta la evidencia de la integración; recuerda que la sanción al usuario
   (50.000 €/ejercicio) es por **usar un sistema no conforme o manipularlo**, no por la herramienta en sí.

## F. Cambia la ley o sale un reglamento (ej. nueva prórroga de Veri*Factu, Orden de factura B2B)
1. Actualiza las referencias en `sources/FUENTES.md` (re-verifica fechas/artículos en BOE/AEAT/AEPD).
2. Ajusta el pack afectado y los controles.
3. Re-corre `/compliance-es:auditar` → el `state.json` muestra qué cambió.

## G. Calendario de revisión
| Cuándo | Qué | Quién |
|---|---|---|
| Anual (o ante cambios) | Revisar y actualizar el **RAT** y la matriz de riesgos penales | Responsable / órgano de cumplimiento |
| Anual | **Verificación periódica del modelo penal** (art. 31 bis.5.6ª) | Órgano de cumplimiento |
| Anual | Formación del equipo (datos + compliance penal) | Responsable |
| Al firmar/renovar proveedor | **DPA** + anexo de transferencia (Cláusulas Tipo) | Responsable |
| Antes de 1-ene-2027 / 1-jul-2027 | Verificar conformidad **Veri*Factu** del sistema de facturación | Administración |
| Cada release relevante | Re-correr `/compliance-es:auditar` (drift) | Dev |

---
*Guía operativa de compliance-es. No constituye asesoramiento jurídico.*
