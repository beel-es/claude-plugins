# Spanish Fiscal Context

BeeL. operates in the Spanish tax system. This file explains concepts for developers unfamiliar with Spanish fiscal terminology.

## Core Concepts (stable, rarely change)

- **IVA** (Impuesto sobre el Valor Añadido) = VAT. Applied to most goods and services. Multiple rates exist.
- **IRPF** (Impuesto sobre la Renta de las Personas Físicas) = income tax withholding. Autónomos apply a retention percentage on invoices to other businesses.
- **Recargo de equivalencia** = equivalence surcharge. Extra tax for certain retailers.
- **IGIC** = Canary Islands tax (instead of IVA). **IPSI** = Ceuta & Melilla tax.
- **NIF** = Spanish tax ID (umbrella term). Includes DNI (individuals), NIE (foreigners), CIF (companies).
- **VeriFactu** = AEAT's verifiable invoicing system. BeeL. sends each invoice's record to AEAT.

## What NOT to Hardcode

Tax rates, regime codes, and available tax types **change over time**. Always fetch current values:

```bash
# Current tax config for a NIF (company) — canonical, company-scoped form
GET /v1/companies/{company_id}/tax-configuration

# Glossary of fiscal terms and API field mappings
curl -s https://docs.beel.es/guides/glossary.md

# Regime keys, exemption reasons, corrective reason codes
curl -s https://docs.beel.es/verifactu/regime-keys.md
curl -s https://docs.beel.es/verifactu/tax-classification.md
curl -s https://docs.beel.es/verifactu/corrective-invoices.md
```

## Invoice Types

- **STANDARD** → regular B2B/B2C invoices, full fiscal data required
- **SIMPLIFIED** → consumer receipts (like restaurant tickets), NIF/address optional, with limits of their own (SIM-001 to SIM-009)
- **CORRECTIVE** → fixes or cancels a previously issued invoice
- **PROFORMA** → commercial document (a formal quote) with no fiscal validity. Never enters VeriFactu: no QR, nothing sent to the AEAT

For which type to use when, and required fields per type:
```bash
curl https://docs.beel.es/api/openapi   # Check InvoiceType enum and required fields
```

## VeriFactu

- BeeL. generates the billing record, chains it, sends it to AEAT and puts the QR on the invoice
- An issued invoice is never edited or deleted (LIF-001); a corrective identifies the invoice it rectifies, which stays as it was (COR-005)
- What stays with you: follow `submission_status` and fix what AEAT rejects (REC-008), and wait for the QR before distributing the PDF (QRC-002)
- The fiscal rules behind all this, with who enforces each one, are in `/beel-api:rules`
