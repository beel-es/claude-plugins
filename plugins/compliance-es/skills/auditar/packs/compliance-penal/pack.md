# Pack: Compliance penal — Responsabilidad penal de la persona jurídica (art. 31 bis CP)

> **Ya vigente.** La responsabilidad penal de las personas jurídicas se introdujo por la **LO 5/2010** y se
> reformó a fondo por la **LO 1/2015** (arts. 31 bis a 31 quinquies del Código Penal, LO 10/1995). Aplica a
> **toda persona jurídica de Derecho privado** (SL, SA, asociación, fundación), **sin umbral de tamaño**,
> incluida una **SL de un solo socio**. El **modelo de organización y gestión** ("programa de compliance
> penal") adoptado y ejecutado con eficacia **antes** del delito es la defensa: **eximente** (art. 31 bis.2
> y .4) o **atenuante** si solo se acredita parcialmente. Debe ser **idóneo, eficaz y proporcional** al
> tamaño (Circular 1/2016 FGE: no vale un modelo "de fachada").

## Controles que exige (ver `references/controls.md`)
`gov-responsable` (órgano de cumplimiento / compliance officer), `gov-registro` (matriz de riesgos penales),
`gov-politicas` (código ético / política de compliance), `gov-denuncias` (canal interno, Ley 2/2023),
`gov-formacion`, `gov-auditoria` (verificación periódica), `gov-disciplinario`, `ctrl-interno`
(segregación de funciones / autorizaciones / control financiero).

## Los 6 requisitos del modelo (art. 31 bis.5 — verificado contra BOE-A-1995-25444)
1. **Identificar las actividades** en cuyo ámbito puedan cometerse los delitos a prevenir → *matriz de riesgos*.
2. **Protocolos/procedimientos** que concreten la formación de la voluntad, la adopción de decisiones y su ejecución.
3. **Modelos de gestión de los recursos financieros** adecuados para impedir la comisión de los delitos.
4. **Obligación de informar** de posibles riesgos e incumplimientos al órgano de cumplimiento → *canal de denuncias*.
5. **Sistema disciplinario** que sancione el incumplimiento de las medidas del modelo.
6. **Verificación periódica** del modelo y su modificación ante infracciones relevantes o cambios en la organización.

## Condiciones de la eximente (art. 31 bis.2, delitos de directivos — acumulativas)
1ª Modelo adoptado y ejecutado **con eficacia antes del delito**, con medidas de vigilancia y control idóneas.
2ª Supervisión confiada a **un órgano con poderes autónomos de iniciativa y control** (el *compliance officer*).
3ª Los autores cometieron el delito **eludiendo fraudulentamente** el modelo.
4ª No hubo **omisión ni ejercicio insuficiente** de la función de supervisión.
> Si solo se acreditan **parcialmente** → **atenuante** (art. 31 bis.2 in fine). Para delitos de subordinados
> (letra b), basta acreditar un modelo idóneo adoptado y ejecutado antes del delito (art. 31 bis.4).

## PYMES (art. 31 bis.3)
En personas jurídicas de **pequeñas dimensiones** (las autorizadas a presentar **cuenta de pérdidas y
ganancias abreviada**), las funciones de supervisión las puede asumir **directamente el órgano de
administración** — no hace falta un órgano de cumplimiento separado. Pero **sí hace falta el modelo** con
los 6 requisitos para acceder a la eximente.

## Catálogo de delitos relevantes para un SaaS (numerus clausus — la PJ solo responde si el tipo la menciona)
| Delito | Art. del tipo | Imputación a la PJ |
|---|---|---|
| Estafa y fraudes | 248-251 | art. 251 bis |
| Daños informáticos (sabotaje a datos/sistemas) | 264, 264 bis, 264 ter | art. 264 quater |
| Descubrimiento y revelación de secretos (datos personales) | 197, 197 bis, 197 ter | art. 197 quinquies |
| Delitos contra la Hacienda Pública (fraude fiscal) | 305-310 | art. 310 bis |
| Blanqueo de capitales | 301-302 | art. 302.2 |
| Corrupción en los negocios (corrupción privada) | 286 bis-286 ter | art. 288 |
| Cohecho (a funcionario) | 419-427 | art. 427 bis |
| Propiedad intelectual e industrial | 270-277 | art. 288 |
> Artículos de imputación **verificados** contra el consolidado del BOE-A-1995-25444 (últ. mod. 9-abr-2026).
> Matices: el **197 quinquies** solo cubre los arts. 197/197 bis/197 ter (no 197 quater ni 198); el **288**
> canaliza tanto la propiedad intelectual/industrial como la corrupción en los negocios (286 bis-286 quater),
> con dos escalas de multa.

## Canal de denuncias — Ley 2/2023 (Sistema interno de información)
- **Obligatorio** desde **50 trabajadores** (y, sin umbral, en finanzas, blanqueo, transporte y medio
  ambiente; y partidos/sindicatos/fundaciones con fondos públicos). Plazos de implantación **ya vencidos**
  (sector público y privadas de 250+ trabajadores: 13-jun-2023; privadas de ≤249 y municipios <10.000 hab.:
  1-dic-2023).
- Requisitos: **Responsable del Sistema** independiente; **confidencialidad**; el canal **debe permitir
  comunicaciones anónimas**; **acuse de recibo en 7 días naturales**; **respuesta máx. 3 meses** (prorrogable
  otros 3); **prohibición de represalias**.
- Régimen sancionador (art. 65): infracciones muy graves hasta **1.000.000 €** (PJ) / **300.000 €** (persona
  física). Autoridad: **A.A.I.** (Autoridad Independiente de Protección del Informante).
- Por debajo de 50 trabajadores el canal no es obligatorio por la Ley 2/2023, pero **sí lo exige el modelo
  penal** (art. 31 bis.5.4ª) como vía para informar al órgano de cumplimiento → se genera igual como buena
  práctica, dimensionado al tamaño.

## Certificación (opcional)
La **UNE 19601** (AENOR) certifica el sistema de gestión de compliance penal. **No exime automáticamente**:
es un medio de prueba de la idoneidad/eficacia del modelo, que valora el juez (Circular 1/2016 FGE). Es un
plus, no un requisito legal.

## Documentos a generar (templates/ → `<repo>/.compliance/docs/` con prefijo `penal-`)
`politica-compliance-penal.md`, `codigo-etico.md`, `matriz-riesgos-penales.md`,
`acta-organo-cumplimiento.md`, `politica-canal-denuncias.md`.

## Nota
La parte central es **organizacional** (designar el órgano, operar el canal, formar, verificar, sancionar).
La skill genera los documentos base; la implementación, la operación del canal y la (opcional) certificación
UNE 19601 las ejecuta la empresa.
