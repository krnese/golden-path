# Acceptance examples: invoice calculator, Marketing increments

Owner: **Marketing** (a fictional business-context expert). This is Marketing's own acceptance path,
separate from Finance's (`acceptance/EXAMPLES.md`, T01..T04). These examples are the acceptance criteria. Each
section is an executable test class in `acceptance/marketing/test_acceptance.py`, which Marketing reviewed and
approved. Agents may read and run them but never change them. A change goes back to Marketing.
Marketing releases an increment by naming it in the acceptance command (`.golden-path/config.json`), e.g.
`python3 -m unittest acceptance.marketing.test_acceptance.T05`. T05 is not enabled yet.

## T05: Review summary (intent: "invoices a human can approve at a glance")
One summary per invoice with fixed fields: `lines`, `net`, `vat`, `gross`, `flags`, `recommendation`, `reason`.

| Invoice | Gross | Flags | Recommendation | Why |
|---|---|---|---|---|
| A 100.00 × 2 | 250.00 | none | approve | Totals reconcile, nothing unusual |
| A 100.00 × 1 twice | 250.00 | `duplicate_line` (names A) | review | Same line twice looks like double billing |
| A 100.00 × 1 and A 90.00 × 1 | 237.50 | none | approve | Same SKU, different price: not a duplicate |
| A 100.00 × 1 and A 100.00 × 2 | 375.00 | none | approve | Same SKU, different quantity: not a duplicate |
| A 100.00 × 1 and A 100.00 × 1 food | 240.00 | none | approve | Same SKU, different VAT class: not a duplicate |
| A 40 000.00 × 1 | 50 000.00 | none | approve | At the 50000.00 threshold is not over it |
| A 40 000.01 × 1 | 50 000.01 | `over_threshold` (states `50000.00`) | review | Large amounts need a second look |
| A 10.00 × 1, threshold `"10.00"` | 12.50 | `over_threshold` (states `10.00`, not `50000.00`) | review | A custom threshold is the one stated |
| A 10.00 × 1, threshold `Decimal("10.00")` | 12.50 | `over_threshold` (states `10.00`) | review | A Decimal threshold is accepted like a string |
| A 10.00 × 1, threshold `Decimal("12.5")` | 12.50 | none | approve | At the threshold is not over it |
| A 1.00 × 1, threshold `1.0` (float) | | rejected | | Floats are refused, like money |
| no lines | 0.00 | `empty` (plain-language reason) | review | Nothing to approve; the summary reason names `empty` |

The threshold is stated in a flag reason as a plain number with two decimals and no thousands separator
(`50000.00`, `10.00`), the effective threshold for that call.
Every flag has a non-empty plain-language `reason`. The summary `reason` is always one sentence (one line,
ends with `.`, ≤ 200 characters) and names every flag code.
Not testable here, checked by Marketing reading real summaries: that a person "immediately understands" it.
