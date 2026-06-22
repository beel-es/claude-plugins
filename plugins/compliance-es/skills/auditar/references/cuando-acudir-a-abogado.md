# El abogado es opcional

**Objetivo: que un founder/autónomo arme su cumplimiento COMPLETO sin abogado.** En España es lícito:
generar políticas, consentimientos, contratos de encargo (DPA), RAT, EIPD, el modelo de compliance penal y
autoevaluarse **no** requiere abogado, y ni el RGPD ni la LOPDGDD ni el art. 31 bis CP **exigen que un
abogado firme ningún documento**. La AEPD incluso ofrece herramientas (Facilita RGPD) para autoproveerse el
cumplimiento básico.

La skill **no te manda al abogado**: te deja listo. Donde la norma pide criterio, la skill **aplica el
criterio de la norma y te da el resultado**, no te deja la tarea.

## Lo haces tú con la skill (todo lo preparable, completo)
- Inventario + **RAT** (art. 30).
- **Política de privacidad, consentimiento, canal de derechos, DPA (art. 28), anexo de transferencias (con
  las Cláusulas Contractuales Tipo), plan y registro de brechas, EIPD, modelo de compliance penal, código
  ético, matriz de riesgos penales, acta del órgano de cumplimiento, política del canal de denuncias,
  checklist Veri*Factu** — generados y rellenados desde tus respuestas, no a medio hacer.
- **Diagnóstico técnico** y remediaciones de código (consentimiento, endpoints de derechos, cifrado, MFA,
  audit log) y la **integración de un proveedor de facturación conforme** (Veri*Factu).
- **Decisiones resueltas**: ¿necesitas DPO?, ¿la EIPD es obligatoria?, ¿qué base de licitud?, ¿qué mecanismo
  de transferencia?, ¿estás obligado a Veri*Factu y desde cuándo?, ¿te aplica el canal de denuncias de la
  Ley 2/2023? La skill responde con el artículo, no te deja eligiendo a ciegas.
- Atender derechos de los interesados y responder una brecha con los runbooks.

## Lo único que SÍ requiere un tercero (honesto, no es siempre un abogado)
- **Certificación UNE 19601** del modelo de compliance penal: la emite un **certificador acreditado**
  (AENOR/ENAC). Es **opcional** (un medio de prueba reforzado de la idoneidad del modelo), no un requisito
  legal; sin ella el modelo igualmente puede eximir si es eficaz (Circular 1/2016 FGE).
- **Declaración responsable del fabricante** del software de facturación (Veri*Factu, art. 13 RD 1007/2023):
  la firma **quien produce el software**. Si usas un proveedor (un SaaS conforme), **te la entrega él**; tú
  solo la conservas.
- **Representación ante la AEPD, Hacienda o los tribunales** si te inspeccionan y escala a un procedimiento
  sancionador o judicial: ahí entra el abogado. Es **reactivo**: para prepararte y cumplir no lo necesitas, y
  la skill ya te dejó el expediente armado para defenderte.

## El abogado, como PLUS opcional
Si quieres que alguien revise y firme los documentos antes de publicarlos: es un "nice to have", no un
requisito legal.

## Lo que la skill NO hace (sé transparente: dilo)
- **Monitoreo / detección de filtraciones en tiempo real** (DLP, alertas 24/7): es un servicio corriendo
  siempre, no una skill on-demand. La skill prepara el **plan de respuesta** y puede configurar **alertas
  sobre el audit log**, pero la vigilancia en vivo es otra categoría (ver `build/monitoreo.md`).
- **Representarte** en un procedimiento ni darte una garantía legal personalizada. Por eso el disclaimer "no
  es asesoramiento jurídico": no porque necesites un abogado para cumplir, sino porque un software no asume
  tu responsabilidad legal. Tú quedas listo; la responsabilidad final es tuya.
