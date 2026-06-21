# Contribuir a compliance-es

¡Gracias por aportar! Este plugin ayuda a empresas y autónomos españoles a preparar su cumplimiento legal.

## Principio rector: todo citado a la norma

Toda afirmación legal **debe** poder contrastarse contra el texto oficial (BOE, EUR-Lex, AEPD, AEAT) y citar
**norma + artículo + fuente**. Lo que no se pueda confirmar se marca `[verificar contra fuente oficial]`. No
se aceptan afirmaciones normativas basadas solo en blogs o resúmenes secundarios. Cuidado especial con las
**fechas** (Veri*Factu se ha prorrogado dos veces) y con la **numeración** de artículos.

## Cómo aportar

- **Corregir un artículo/dato:** cita la fuente oficial (BOE/EUR-Lex) y actualiza
  `skills/compliance-es/references/mapa-articulos.md`.
- **Agregar un marco nuevo (pack):** crea `skills/compliance-es/packs/<id>/pack.md` (obligaciones + controles
  que exige + plantillas) y mapea sus controles en `references/controls.md` (crosswalk). Añade sus fuentes a
  `sources/FUENTES.md` con su URL oficial.
- **Mejorar runbooks/plantillas:** mantén el disclaimer "no es asesoramiento jurídico" y marca `[ABOGADO]`
  donde se requiera intervención profesional.

## Flujo de trabajo (git)

1. Crea una **rama** descriptiva: `tipo/descripcion-corta` (ej. `fix/verifactu-fechas`, `feat/pack-ens`).
2. Usa [Conventional Commits](https://www.conventionalcommits.org): `tipo(scope): descripción`.
3. Abre un **Pull Request contra `master`** describiendo el cambio y citando las fuentes que tocaste.
4. Espera **al menos una revisión** antes de mergear.

## Estilo

- Contenido en español de España (el dominio es derecho español/UE).
- Documentos generados con placeholders `[COMPLETAR: ...]` para lo que no se sabe; no inventar datos de la
  empresa.

## Aviso

Este plugin genera borradores y diagnósticos; **no constituye asesoramiento jurídico**. Las contribuciones se
publican bajo la licencia [MIT](../../LICENSE).
