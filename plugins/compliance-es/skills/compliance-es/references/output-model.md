# Modelo de output — `.compliance/` versionado en el repo

El resultado NO son PDFs sueltos: es un **estado vivo** dentro del repo auditado, versionado
por git. Re-correr la skill compara contra el estado anterior y reporta avance/**drift**.

## Estructura escrita en `<repo>/.compliance/`
```
.compliance/
├── state.json        # estado de controles + score por marco (la "postura")
├── RESUMEN.md        # informe legible + diff vs corrida anterior + plan
├── INSTRUCTIVO.md    # runbooks: derechos · brecha · inspección AEPD · calendario
└── docs/             # documentos generados por los packs activos
    ├── rgpd-rat.md
    ├── rgpd-politica-privacidad.md
    ├── rgpd-consentimiento.md
    ├── rgpd-canal-derechos.md
    ├── rgpd-dpa.md
    ├── rgpd-anexo-transferencias.md
    ├── rgpd-plan-respuesta-brechas.md
    ├── rgpd-registro-brechas.md
    ├── rgpd-eipd.md                       (si el test del art. 35 la hace obligatoria)
    ├── penal-politica-compliance-penal.md
    ├── penal-codigo-etico.md
    ├── penal-matriz-riesgos-penales.md
    ├── penal-acta-organo-cumplimiento.md
    ├── penal-politica-canal-denuncias.md
    ├── verifactu-checklist.md
    ├── verifactu-declaracion-responsable.md
    └── verifactu-politica-conservacion.md
```

## `state.json` (esquema)
```json
{
  "schema": 1,
  "generated_at": "[ISO-8601, pedir al sistema con `date`]",
  "git_commit": "[git rev-parse --short HEAD]",
  "company": { "razon_social": "...", "nif": "...", "forma_juridica": "autonomo|SL|SA|...", "trabajadores": 0 },
  "active_packs": ["rgpd-lopdgdd", "compliance-penal", "verifactu"],
  "controls": {
    "sec-mfa": { "status": "pass|partial|fail|unknown", "evidence": "auth/mfa.ts:42", "remediation": "" },
    "data-derechos": { "status": "fail", "evidence": "", "remediation": "Añadir endpoint export+delete (arts. 15, 17)" }
  },
  "frameworks": {
    "rgpd-lopdgdd": { "score": 0.62, "controls_required": 17, "pass": 9, "partial": 2, "fail": 6 },
    "compliance-penal": { "score": 0.40, "controls_required": 8, "pass": 2, "partial": 2, "fail": 4 },
    "verifactu": { "score": 0.75, "controls_required": 4, "pass": 3, "partial": 0, "fail": 1 }
  }
}
```
- `score` = (pass + 0.5·partial) / controls_required.
- Timestamp y commit reales: obtenerlos con Bash (`date -u +%FT%TZ`, `git rev-parse --short HEAD`),
  no inventarlos.

## Re-corrida (compliance vivo)
1. Si existe `state.json`, cárgalo como `previo`.
2. Tras evaluar, compara control a control:
   - **avance**: fail/partial/unknown → pass.
   - **drift**: pass → fail/partial (algo que cumplía dejó de cumplir).
3. En `RESUMEN.md`, sección "Cambios vs última corrida ([fecha previa])": lista avances y drift,
   y la variación de score por marco.

## Versionado
- git es el audit trail: cada corrida = un commit de `.compliance/`.
- Sugerir al usuario: `git add .compliance && git commit -m "compliance: snapshot [fecha]"`.
- Más adelante (productización), esto mismo corre en CI por release; aquí basta correr la skill.
