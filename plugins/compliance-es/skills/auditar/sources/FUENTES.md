# Fuentes oficiales (corpus primario)

Objetivo: que la auditoría sea **reproducible y contrastada contra la norma vigente, nada inventado**.
Toda afirmación legal de la skill debe poder rastrearse a una de estas fuentes + el artículo. Si algo no se
puede verificar, se marca `[verificar contra fuente oficial]`.

> Los consolidados del BOE/EUR-Lex son documentos enormes y vivos. En vez de adjuntar las leyes enteras,
> guardamos en **`textos/`** los **extractos literales de los artículos que la skill cita** (grepeables y
> verificables **offline**), y referenciamos las **URLs oficiales** para el resto y para re-verificar online.
> Descargado/verificado: **2026-06-21**. Reproducible con `python3 descargar-fuentes.py`.

## Corpus local (`textos/`) — extractos literales con SHA-256
La skill puede grepear estos archivos para contrastar un literal sin conexión. Si cambia la norma,
re-generar con el script y actualizar los hashes.

| Archivo (`textos/`) | Norma · idBOE | Artículos | SHA-256 (trunc.) |
|---|---|---|---|
| `cp-resp-penal-pj.txt` | Código Penal · BOE-A-1995-25444 | 31 bis, 31 ter, 31 quater, 31 quinquies, 197 quinquies, 251 bis, 264 quater, 288, 302, 310 bis, 427 bis | `16eb0e36…` |
| `lgt-facturacion.txt` | LGT (Ley 58/2003) · BOE-A-2003-23186 | 29 (29.2.j), 201 bis | `9cbfe1d0…` |
| `lopdgdd.txt` | LOPDGDD (LO 3/2018) · BOE-A-2018-16673 | 7, 32, 34, 72, 73, 74, 78 | `52887f62…` |
| `ley-2-2023-canal.txt` | Ley 2/2023 · BOE-A-2023-4513 | 7, 9, 10, 65 | `9d606b1a…` |
| `rd-1007-2023-verifactu.txt` | RD 1007/2023 · BOE-A-2023-24840 | 9, 10, 11, 12, 13, 15, 16 | `df737c28…` |

> El **RGPD** (consolidado de EUR-Lex) y normas más pequeñas (Orden HAC/1177/2024, RD-ley 15/2025, RD
> 1619/2012, "Crea y Crece") se verifican por **URL** (abajo); no se extraen a `textos/` para no duplicar
> texto que cambia. Para esos, usar WebFetch sobre la URL oficial.

## Protección de datos (RGPD + LOPDGDD)
| Norma | Referencia | URL oficial |
|---|---|---|
| **RGPD** — Reglamento (UE) 2016/679 | CELEX 32016R0679 | https://eur-lex.europa.eu/legal-content/ES/TXT/HTML/?uri=CELEX:02016R0679-20160504 |
| **LOPDGDD** — LO 3/2018, de 5 de diciembre | BOE-A-2018-16673 | https://www.boe.es/buscar/act.php?id=BOE-A-2018-16673 |
| **Cláusulas Contractuales Tipo (SCC)** — Decisión (UE) 2021/914 | CELEX 32021D0914 | https://eur-lex.europa.eu/eli/dec_impl/2021/914/oj |
| **EU-US Data Privacy Framework** — Decisión (UE) 2023/1795 | CELEX 32023D1795 | https://eur-lex.europa.eu/eli/dec_impl/2023/1795/oj |
| AEPD — Guía del RGPD para responsables | — | https://www.aepd.es/guias/guia-rgpd-para-responsables-de-tratamiento.pdf |
| AEPD — **Facilita RGPD** (PYMES/autónomos, bajo riesgo) | — | https://www.aepd.es/guias-y-herramientas/herramientas/facilita-rgpd |
| AEPD — Listas de tratamientos que requieren EIPD (art. 35.4) | — | https://www.aepd.es/documento/listas-dpia-es-35-4.pdf |
| AEPD — Notificación de brechas (sede) | — | https://sede.aepd.gob.es |

## Compliance penal (art. 31 bis CP + Ley 2/2023)
| Norma | Referencia | URL oficial |
|---|---|---|
| **Código Penal** (consolidado) — arts. 31 bis a 31 quinquies | BOE-A-1995-25444 | https://www.boe.es/buscar/act.php?id=BOE-A-1995-25444 |
| **LO 5/2010** (introduce la responsabilidad penal de la PJ) | BOE-A-2010-9953 | https://www.boe.es/buscar/act.php?id=BOE-A-2010-9953 |
| **LO 1/2015** (reforma art. 31 bis) | BOE-A-2015-3439 | https://www.boe.es/buscar/doc.php?id=BOE-A-2015-3439 |
| **Ley 2/2023** (protección del informante / canal de denuncias) | BOE-A-2023-4513 | https://www.boe.es/buscar/act.php?id=BOE-A-2023-4513 |
| **Circular 1/2016 FGE** (resp. penal de la PJ) | FIS-C-2016-00001 | https://www.boe.es/buscar/abrir_fiscalia.php?id=FIS-C-2016-00001.pdf |
| **UNE 19601** (sistemas de gestión de compliance penal) | AENOR | https://www.aenor.com/certificacion/empresas/compliance-y-buen-gobierno/gestion-prevencion-delitos |

## Facturación antifraude (Veri*Factu)
| Norma | Referencia | URL oficial |
|---|---|---|
| **Ley 11/2021** (antifraude; introduce arts. 29.2.j) y 201 bis LGT) | BOE-A-2021-11473 | https://www.boe.es/buscar/doc.php?id=BOE-A-2021-11473 |
| **Ley 58/2003 (LGT)** consolidada | BOE-A-2003-23186 | https://www.boe.es/buscar/act.php?id=BOE-A-2003-23186 |
| **RD 1007/2023** (Reglamento de requisitos de los SIF) | BOE-A-2023-24840 | https://www.boe.es/buscar/act.php?id=BOE-A-2023-24840 |
| **Orden HAC/1177/2024** (especificaciones técnicas) | BOE-A-2024-22138 | https://www.boe.es/buscar/act.php?id=BOE-A-2024-22138 |
| **RD 1619/2012** (Reglamento de facturación; art. 6.5/7.5 = QR y leyenda, vía Disp. final 1ª del RD 1007/2023) | BOE-A-2012-14696 | https://www.boe.es/buscar/act.php?id=BOE-A-2012-14696 |
| **RD-ley 15/2025** (2ª prórroga → 2027) | BOE-A-2025-24446 | https://www.boe.es/eli/es/rdl/2025/12/02/15 |
| **Ley 18/2022 "Crea y Crece"** (factura electrónica B2B) | BOE-A-2022-15818 | https://www.boe.es/buscar/act.php?id=BOE-A-2022-15818 |
| **RD 238/2026** (desarrollo factura electrónica B2B) | BOE-A-2026-7295 | https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-7295 |
| AEAT — FAQ y portal Veri*Factu | — | https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/preguntas-frecuentes.html |
| AEAT — Nota ampliación de plazos (03/12/2025) | — | https://sede.agenciatributaria.gob.es/Sede/todas-noticias/2025/diciembre/3/ampliacion-plazo-adaptacion-sistemas-informaticos-facturacion.html |

## Notas de validez (IMPORTANTE)
- **Veri*Factu se prorrogó a 2027** (RD-ley 15/2025): software 29-jul-2025 (vencido), Sociedades 1-ene-2027,
  resto 1-jul-2027. Las fechas de 2025/2026 que aún circulan están **derogadas**.
- **EU-US DPF en vigor** en 2026; recurso C-703/25 P pendiente ante el TJUE **sin efecto suspensivo**.
- **Prescripción de infracciones LOPDGDD** en arts. 72-74 (no en el 78, que es prescripción de sanciones).
- **Cotejo literal completado (junio 2026)** contra los PDF consolidados del BOE: art. 31 bis CP y todos los
  artículos de imputación del catálogo penal (251 bis, 264 quater, 197 quinquies, 310 bis, 302.2, 288,
  427 bis); art. 201 bis LGT (cuantías en el ap. 4; conductas en aps. 1, 2 y 1.f); arts. 9-16 del RD 1007/2023;
  arts. 7, 32, 34, 72-74, 78 LOPDGDD; arts. 7, 9, 10, 65 y DT 2ª de la Ley 2/2023. El QR/leyenda Veri*Factu
  proviene de la **Disp. final 1ª del RD 1007/2023** (art. 6.5/7.5 del RD 1619/2012), no del cuerpo del RD.

## Regla de uso para la skill
1. Antes de afirmar algo legal, **grepea el extracto en `textos/`** (offline) o abre la **URL oficial** con
   WebFetch; para lo no extraído (RGPD, Orden, RD-ley…), usa la URL.
2. Cita siempre **norma + artículo + fuente**.
3. Si no está o no es verificable, dilo: `[verificar contra fuente oficial / abogado]`.
4. Nunca uses un blog/fuente secundaria como base de una afirmación normativa en el output final.
5. **Re-verifica las fechas de Veri*Factu y el estado del DPF** en cada corrida (con WebFetch sobre la sede de
   la AEAT / EUR-Lex): cambian. Si una norma se actualiza, re-genera el corpus con `python3 descargar-fuentes.py`
   y actualiza los SHA-256.
