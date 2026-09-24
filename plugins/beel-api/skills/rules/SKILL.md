---
name: rules
description: >
  Indexes the fiscal rules a BeeL. invoicing integration must respect (lifecycle,
  voiding, corrective and simplified invoices, numbering, contents, taxes, dates,
  QR, VeriFactu records) by stable rule ID, with who enforces each one and the
  error codes that report it. Use when designing, reviewing or debugging code
  that issues, corrects, voids or renders invoices, or when a BeeL. error code
  needs explaining.
argument-hint: "[rule ID, domain or error code]"
---

# BeeL. fiscal rules

BeeL. publishes the rules an invoicing integration must respect as a catalogue. Each rule has a stable ID (`VOI-001`): cite it in reviews, findings and code comments instead of paraphrasing the rule.

## Who checks what

Every rule says who catches a violation (`enforced_by`):

- `api`: BeeL. rejects the request with an error code, or does it for you.
- `aeat`: AEAT rejects the billing record.
- `integrator`: your code must.
- `issuer`: the issuing business must. It is a fiscal decision no software can make for it.

**Rules enforced by `integrator` or `issuer` are the integration's responsibility, because BeeL. does not check them.** When such a rule lists error codes, BeeL. rejects only those cases and the rest is still yours. They carry `†` in the index. When an integration touches a domain, account for every `†` rule in it.

Each rule also names its source (`kind`): **Law**, **AEAT criterion** or **BeeL. rule**. Keep that label when you cite a rule. A BeeL. rule is not law, and an AEAT criterion is not a norm.

## Void or correct

What to do with an invoice that should not stand as it is. Find the row that matches:

<!-- BEGIN GENERATED: decision -->
- You spot the mistake before issuing: the invoice is still a draft or scheduled. → **Edit or delete the draft. Nothing has been issued, so nothing needs correcting.** (LIF-001)
- The invoice should never have been issued: the operation did not take place, it was a test, or it is an accidental duplicate. → **Void it. Its number stays used; if a valid invoice is still due, issue it as a new one.** (VOI-001)
- The sale happened, but the amounts, the tax or a detail on the invoice are wrong. → **Issue a corrective against it: R1–R4 for a standard invoice, R5 for a simplified one.** (COR-001)
- A corrective you already issued is itself wrong. → **Issue another corrective against the original invoice, not against the corrective.** (COR-007)
- The customer has not paid, the legal waiting period has passed and you have claimed the debt in court or by notarial demand. → **Issue an R3 corrective within the legal window and report it to AEAT.** (COR-008)
- The customer has been declared insolvent by a court after the invoice's tax accrued, and has not paid. → **Issue an R2 corrective.** (COR-009)
- You grant a discount or a volume rebate after the invoice was issued. → **Issue an R1 PARTIAL corrective with the discount as a negative line.** (COR-011)
- The customer asks for a full invoice with their details in place of a simplified one already issued. → **Issue an R5 TOTAL corrective on the simplified invoice, then a new standard invoice with the customer's data.** (SIM-007)
- Nothing on the invoice is wrong: AEAT refused the record for a cause outside it (issuer not in the census, representation not signed). → **Fix the cause, then ask BeeL. support to resubmit the unchanged record (subsanación).** (REC-010)
<!-- END GENERATED: decision -->

A void and a corrective are never interchangeable: read the rule behind the row before writing code for it.

## Look a rule up

Find the ID in the index below, then read the rule in full in `reference/<domain>.md`: statement, why, who checks it, error codes, legal basis, and a wrong and a right example. The live sources are `https://docs.beel.es/rules/<ID>.md`, which quotes the legal text verbatim, and `https://docs.beel.es/api/rules.json`, the whole catalogue.

The bundled script reads the live catalogue and falls back to a snapshot bundled with this skill when the docs are unreachable. Run it from this skill's directory:

```bash
node scripts/lookup.mjs VOI-001                  # one rule, in full
node scripts/lookup.mjs void                     # a domain, one line per rule (--full for every rule in full)
node scripts/lookup.mjs INVOICE_ALREADY_VOIDED   # the rules an error code reports
node scripts/lookup.mjs --yours corrective       # the rules in a domain that BeeL. does not check
```

Stderr names the source. When it says `bundled snapshot`, the published rules may be newer: say so in your answer. With `jq`: `curl -s https://docs.beel.es/api/rules.json | jq '.rules[] | select(any(.error_codes[]; .code == "INVOICE_ALREADY_VOIDED"))'`.

To explain an error code, look it up as above for the rules that report it, then read `https://docs.beel.es/errors/<CODE>`. When no rule lists the code, the error page is the whole answer.

## Design or review a change

1. List the invoice operations the change touches: create, issue, correct, void, render or send the PDF, import.
2. Map them to domains with the index, then run `lookup.mjs <domain>` for each.
3. For each `†` rule, point to where the code or the business process handles it. For each `api` rule, check that its error codes are handled as permanent failures, not retried.
4. Report every gap with the rule ID, `file:line` and the fix.
5. After the fixes, repeat steps 3 and 4 until every rule in scope is accounted for.

## Index

`MUST`, `MUST NOT` and `SHOULD` come from the rule. `†` marks a rule enforced by the integrator or the issuing business.

<!-- BEGIN GENERATED: index -->
**Invoice lifecycle** · [reference/lifecycle.md](reference/lifecycle.md)
- LIF-001 `MUST NOT` — An issued invoice is never edited or deleted
- LIF-002 `MUST` — Only a draft can be issued
- LIF-003 `MUST NOT` † — Test in the sandbox, never with real invoices
- LIF-004 `SHOULD` † — Retry writes with the same Idempotency-Key
- LIF-005 `MUST NOT` † — Duplicating an invoice creates a new one, not a copy

**Voiding** · [reference/void.md](reference/void.md)
- VOI-001 `MUST` † — Void only an invoice that should never have been issued
- VOI-002 `MUST` — Void an issued invoice through the void operation; delete a draft
- VOI-003 `MUST` — A void adds a cancellation record; the original stays

**Corrective invoices** · [reference/corrective.md](reference/corrective.md)
- COR-001 `MUST` † — Wrong data on an issued invoice is fixed with a corrective
- COR-002 `MUST` — Pick the reason code: R1–R4 for standard invoices, R5 for simplified
- COR-003 `MUST` — A corrective shows the difference or the amounts after the correction
- COR-004 `MUST` — The corrective record says whether it substitutes or adds a difference
- COR-005 `MUST` — A corrective identifies the invoice it rectifies
- COR-006 `MUST` † — Issue the corrective as soon as you know, within 4 years
- COR-007 `MUST NOT` — A wrong corrective is fixed against the original, not corrected itself
- COR-008 `MUST` † — A bad-debt corrective (R3) needs the legal conditions first
- COR-009 `MUST` † — An insolvency corrective (R2) needs a declaration of insolvency
- COR-010 `MUST` † — A provisional price is rectified once the final one is known
- COR-011 `MUST` † — Discounts and rebates granted after the sale go on a corrective
- COR-012 `SHOULD` † — Returns can be netted only on a later supply to the same customer
- COR-013 `MUST NOT` † — A corrective is only for the causes the law lists
- COR-014 `SHOULD` — A corrective keeps the operation date of the original
- COR-015 `MUST NOT` † — Do not raise the VAT charged to a consumer through a corrective

**Numbering and series** · [reference/numbering.md](reference/numbering.md)
- NUM-001 `MUST NOT` — The number is assigned when the invoice is issued
- NUM-002 `MUST NOT` — An issued number is never reused, even when the invoice is voided
- NUM-003 `MUST` — Numbers are correlative within each series
- NUM-004 `SHOULD` † — Separate series may be used when there is a reason for them
- NUM-005 `MUST` — Simplified invoices are numbered in their own series
- NUM-006 `MUST` — Corrective invoices are numbered in their own series
- NUM-007 `MUST NOT` — A series cannot be renumbered once it has issued
- NUM-008 `MUST` — An invoice number fits AEAT's length and character set
- NUM-009 `MUST` † — Reverse-charge supplies of metals and electronics go in a special series

**Invoice contents** · [reference/contents.md](reference/contents.md)
- CNT-001 `MUST` † — Every operation of the business is invoiced, exempt ones included
- CNT-002 `MUST` † — A business customer always gets an invoice
- CNT-003 `MUST` — A full invoice names both parties by their legal name
- CNT-004 `MUST` — Every invoice shows the issuer's NIF
- CNT-005 `MUST` — A full invoice identifies the recipient by NIF
- CNT-006 `MUST` † — A full invoice shows the address of both parties
- CNT-007 `MUST` † — Each line describes the operation, its unit price and any discount
- CNT-008 `MUST` — The tax rate and the tax amount are shown apart from the base
- CNT-009 `MUST` — The base is broken down by rate and by kind of operation
- CNT-010 `MUST` † — An exempt operation states why it is exempt
- CNT-011 `MUST NOT` † — Only one original of each invoice exists
- CNT-012 `MUST` † — A reverse-charge invoice carries the mention «inversión del sujeto pasivo»
- CNT-013 `MUST` † — A cash-basis invoice carries the mention «régimen especial del criterio de caja»
- CNT-014 `MUST` † — A used-goods, art or antiques invoice carries its regime mention
- CNT-015 `MUST` † — A travel-agency invoice carries the mention «régimen especial de las agencias de viajes»
- CNT-016 `MUST` † — An intra-EU supply of a new means of transport describes the vehicle
- CNT-017 `SHOULD` † — An invoice may be in any language
- CNT-018 `MUST` † — Invoices go by email only with the recipient's consent
- CNT-019 `MUST NOT` — An invoice never totals zero, and only a corrective totals less
- CNT-020 `SHOULD` — A Spanish recipient's NIF is in the AEAT census
- CNT-021 `MUST` — A recipient without a Spanish NIF is identified by an alternative id

**Simplified invoices** · [reference/simplified.md](reference/simplified.md)
- SIM-001 `MUST NOT` — A simplified invoice never exceeds 3,000 €
- SIM-002 `MUST NOT` † — Above 400 €, a simplified invoice needs an art. 4.2 activity
- SIM-003 `MUST NOT` † — Some operations can never go on a simplified invoice
- SIM-004 `MUST` — A simplified invoice still carries its minimum contents
- SIM-005 `MUST NOT` — The record of a simplified invoice carries no recipient
- SIM-006 `MUST` — An identified customer gets a standard invoice (F1)
- SIM-007 `MUST` † — Exchanging a simplified invoice for a full one
- SIM-008 `MUST` † — A simplified invoice carries the same legal mentions as a full one
- SIM-009 `MUST` † — A customer who needs a full invoice is entitled to one

**Taxes and exemptions** · [reference/taxes.md](reference/taxes.md)
- TAX-001 `MUST` † — Apply the VAT rate in force when the operation took place
- TAX-002 `MUST` † — Reverse-charge operations are invoiced without charging VAT
- TAX-003 `MUST` — Reverse-charge lines carry no tax and never go on a simplified invoice
- TAX-004 `MUST` † — Intra-EU supplies of goods are exempt only with the buyer's EU VAT number
- TAX-005 `MUST` — Exempt and non-subject lines carry no VAT rate
- TAX-006 `MUST` † — Services to a business abroad are not subject to Spanish VAT
- TAX-007 `MUST` † — Sales declared through OSS use regime key 17
- TAX-008 `MUST` — Disbursements go as suplido lines, without tax
- TAX-009 `MUST NOT` — IRPF withholding is not part of the total AEAT receives
- TAX-010 `SHOULD` † — Set the IRPF withholding when the customer must withhold
- TAX-011 `MUST NOT` — Cash-basis lines stay domestic, subject and not reverse charge
- TAX-012 `MUST` — The tax and the billing record are expressed in euros
- TAX-013 `MUST` † — Send every amount in euros

**Equivalence surcharge** · [reference/surcharge.md](reference/surcharge.md)
- SUR-001 `MUST` — The surcharge rate matches the VAT rate of its line
- SUR-002 `MUST` † — Supplies with the surcharge go on separate invoices

**Dates and deadlines** · [reference/dates.md](reference/dates.md)
- DAT-001 `MUST NOT` — Do not send an issue date
- DAT-002 `MUST` — The issue date is the day the billing record is generated
- DAT-003 `MUST NOT` — The operation date is never after the issue date
- DAT-004 `MUST` † — Send the operation date when it differs from the issue date
- DAT-005 `MUST` † — Invoice consumers when the operation takes place
- DAT-006 `MUST` † — Invoice businesses before day 16 of the following month
- DAT-007 `MUST` † — One invoice for a month of operations, issued in time
- DAT-008 `MUST` † — Deliver the invoice to the customer in time
- DAT-009 `MUST` † — VAT is charged by invoice within 1 year of accrual
- DAT-010 `MUST` † — Invoice advance payments when you receive them
- DAT-011 `MUST` † — Adapted billing systems are mandatory from 1 January 2027 or 1 July 2027
- DAT-012 `SHOULD` † — Plan for mandatory B2B electronic invoices

**QR code and PDF** · [reference/qr.md](reference/qr.md)
- QRC-001 `MUST` — Every invoice carries the tax QR code
- QRC-002 `MUST NOT` † — Wait for the QR before you distribute the PDF
- QRC-003 `MUST` † — The QR measures between 30 mm and 40 mm
- QRC-004 `MUST` † — The QR follows ISO/IEC 18004 with error correction M
- QRC-005 `MUST NOT` — Use qr_url exactly as returned
- QRC-006 `MUST` † — The VeriFactu legend goes just below the QR
- QRC-007 `MUST` † — «QR tributario:» goes just above the QR
- QRC-008 `MUST` † — The QR goes once, at the top of the first page
- QRC-009 `MUST` † — Keep a blank margin around the QR
- QRC-010 `MUST` † — A structured e-invoice carries the QR URL as a field

**VeriFactu records** · [reference/records.md](reference/records.md)
- REC-001 `MUST` — Each issued invoice gets a billing record built from its data
- REC-002 `MUST` — The record goes to AEAT as soon as the invoice is issued
- REC-003 `MUST` † — VERI*FACTU is kept until the end of the year
- REC-004 `MUST NOT` — BeeL. generates the hash and the chain
- REC-005 `MUST` — One chain per NIF, one company per NIF
- REC-006 `SHOULD` — No certificate is needed to sign records
- REC-007 `MUST NOT` — Keep invoicing when AEAT is unreachable
- REC-008 `MUST` † — Follow submission_status and fix what AEAT rejects
- REC-009 `MUST` † — Check the data AEAT accepted with errors
- REC-010 `MUST` † — Resubmission fixes only causes outside the invoice
- REC-011 `MUST` — The NIF holder signs the AEAT representation first
- REC-012 `MUST` — Tax amounts are base times rate

**Conservation** · [reference/conservation.md](reference/conservation.md)
- CON-001 `MUST` † — Keep copies of issued invoices for the limitation period
- CON-002 `MUST` † — AEAT keeps the records, not your invoices
- CON-003 `MUST` † — Export your invoices and records before leaving
- CON-004 `MUST` † — Invoices kept electronically are reachable on request

**Sanctions** · [reference/sanctions.md](reference/sanctions.md)
- SAN-001 `MUST` † — Invoice only with compliant, unaltered software
- SAN-002 `MUST` † — Invoicing breaches are fined in proportion to the operations
<!-- END GENERATED: index -->
