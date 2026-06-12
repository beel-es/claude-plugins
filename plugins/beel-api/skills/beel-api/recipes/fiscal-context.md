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
# Current tax config for the user's account
GET /v1/tax-configuration

# Full glossary of fiscal terms and API field mappings
curl https://docs.beel.es/llms.txt | grep -i glossary

# Tax regime codes, payment methods, reason codes
curl https://docs.beel.es/llms.txt | grep -i glossary
```

## Invoice Types

- **STANDARD** → regular B2B/B2C invoices, full fiscal data required
- **SIMPLIFIED** → consumer receipts (like restaurant tickets), NIF/address optional
- **CORRECTIVE** → fixes or cancels a previously issued invoice

For which type to use when, and required fields per type:
```bash
curl https://docs.beel.es/api/openapi   # Check InvoiceType enum and required fields
```

## VeriFactu

- Automatic — BeeL handles AEAT submission, hash chaining, and QR codes
- Invoices are immutable once issued (this is a VeriFactu requirement)
- Corrective invoices reference the original (the original is never modified)
- Developers don't need to interact with VeriFactu directly — BeeL manages it
