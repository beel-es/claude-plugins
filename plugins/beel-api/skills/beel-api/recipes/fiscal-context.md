# Spanish Fiscal Context

BeeL operates in the Spanish tax system. This file explains concepts for developers unfamiliar with Spanish fiscal terminology.

## Core Concepts (stable, rarely change)

- **IVA** (Impuesto sobre el Valor Añadido) = VAT. Applied to most goods and services. Multiple rates exist.
- **IRPF** (Impuesto sobre la Renta de las Personas Físicas) = income tax withholding. Autónomos apply a retention percentage on invoices to other businesses.
- **Recargo de equivalencia** = equivalence surcharge. Extra tax for certain retailers.
- **IGIC** = Canary Islands tax (instead of IVA). **IPSI** = Ceuta & Melilla tax.
- **NIF** = Spanish tax ID (umbrella term). Includes DNI (individuals), NIE (foreigners), CIF (companies).
- **VeriFactu** = AEAT's verifiable invoicing system. BeeL handles submission automatically.

## What NOT to Hardcode

Tax rates, regime codes, and available tax types **change over time**. Always fetch current values:

```bash
# Current tax config for a NIF (company) — canonical, company-scoped form
GET /v1/companies/{company_id}/tax-configuration

# Full glossary of fiscal terms and API field mappings
curl -s https://docs.beel.es/guides/glossary.md

# Tax regime keys and tax classification
curl -s https://docs.beel.es/verifactu/regime-keys.md
curl -s https://docs.beel.es/verifactu/tax-classification.md
```

## Invoice Types

- **STANDARD** → regular B2B/B2C invoices, full fiscal data required
- **SIMPLIFIED** → consumer receipts (like restaurant tickets) for a recipient who is not identified, at most 3,000 € VAT included (SIM-001). A recipient with a `nif` or an `alternative_id` always gets a STANDARD invoice, at any amount: BeeL. rejects a SIMPLIFIED one that carries either with `422 SIMPLIFIED_INVOICE_FORBIDS_IDENTIFIED_RECIPIENT` when creating, editing or issuing it. This is BeeL.'s rule, stricter than the law (SIM-006)
- **CORRECTIVE** → fixes or cancels a previously issued invoice
- **PROFORMA** → commercial document (a formal quote) with no fiscal validity. Never enters VeriFactu: no QR, nothing sent to the AEAT

A recipient without a Spanish NIF is identified with `alternative_id` and its country, never together with a `nif`. An EU VAT number (`type: NIF_IVA`) is accepted only for another EU member state (`422 ALTERNATIVE_ID_VAT_REQUIRES_EU_COUNTRY`) and in that state's format, prefix included, e.g. `FR40303265045`, `EL…` for Greece (`422 ALTERNATIVE_ID_VAT_INVALID_FORMAT`). A customer from outside the EU uses another type, such as `OTHER_DOCUMENT` or `COUNTRY_ID` (CNT-021).

For which type to use when, and required fields per type:
```bash
curl -s https://docs.beel.es/verifactu/simplified-vs-standard.md
curl -s https://docs.beel.es/verifactu/invoice-types.md
```

## VeriFactu

- Automatic — BeeL builds and submits the records to AEAT, chains them and generates the QR
- Submission is asynchronous: a `200` on issue means accepted, not registered. Follow `verifactu.submission_status` through the `verifactu.status.updated` webhook and fix what AEAT rejects (REC-008). `GET /v1/companies/{company_id}/invoices/{invoice_id}/verifactu-records` lists each record of an invoice (the registration and, if voided, the cancellation) with its own status, `error_code` and `error_message`
- Wait for the QR before distributing the PDF (QRC-002)
- Invoices are immutable once issued (LIF-001); corrective invoices reference the original, which is never modified
- The rules behind all of this, by id: `/beel-api:rules`
