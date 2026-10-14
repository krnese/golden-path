# Acceptance examples: invoice calculator, Marketing increments

Owner: **Marketing** (a fictional business-context expert). This is Marketing's own acceptance path,
separate from Finance's (`acceptance/EXAMPLES.md`, T01..T04). These examples are the acceptance criteria. Each
section is an executable test file, `acceptance/marketing/t05.test.mjs` (Node.js `node:test`), which Marketing reviewed and
approved (and `t06.test.mjs`). Agents may read and run them but never change them. A change goes back to Marketing.
Marketing releases an increment by naming it in the acceptance command (`.golden-path/config.json`), e.g.
`node --test acceptance/marketing/t05.test.mjs`. T05 and T06 are enabled in the demo.

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
| A 10.00 × 1, threshold `new Decimal("10.00")` | 12.50 | `over_threshold` (states `10.00`) | review | A `Decimal` threshold is accepted like a string |
| A 10.00 × 1, threshold `new Decimal("12.5")` | 12.50 | none | approve | At the threshold is not over it |
| A 1.00 × 1, threshold `1.0` (JS number, i.e. a float) | | rejected | | Floats are refused, like money |
| no lines | 0.00 | `empty` (plain-language reason) | review | Nothing to approve |

The threshold is stated in a flag reason as a plain number with two decimals and no thousands separator
(`50000.00`, `10.00`), the effective threshold for that call.
Every flag has a non-empty plain-language `reason`. The summary `reason` is always one sentence (one line,
ends with `.`, ≤ 200 characters) and explains every flag (T06: in plain words, not codes).
Not testable here, checked by Marketing reading real summaries: that a person "immediately understands" it.

## T06: Plain-language reasons (intent: "understand the reason without knowing any system terms, and every duplicated product should be named")
Tests: `acceptance/marketing/t06.test.mjs`. Same summary shape as T05; only the wording rules change.

| Invoice | Flags (codes unchanged) | Summary `reason` must | Must not |
|---|---|---|---|
| PAPER-500 100.00 × 1 twice | `duplicate_line` | say duplicate / more than once, name PAPER-500 | contain `duplicate_line` or `_` |
| PAPER-500 ×3, TONER-9 ×2, PEN-3 ×1 (identical lines) | `duplicate_line` (one or several) | name PAPER-500 **and** TONER-9 (flag reasons too) | name PEN-3 as duplicated |
| three products each twice | `duplicate_line` | name all three, still ≤ 200 characters | |
| A 40 000.01 × 1 | `over_threshold` | mention the threshold or limit | contain `over_threshold` |
| no lines | `empty` | say there are no lines (or nothing to approve) | use `empty` as a word |
| PAPER-500 30 000.00 × 1 twice | `duplicate_line`, `over_threshold` | explain both, name PAPER-500 | contain codes |
| A 100.00 × 2 | none (approve) | be one plain sentence | contain codes |

The summary `reason` is always one sentence (one line, ends with `.`, ≤ 200 characters). T05 behaviour is
unchanged except that the summary `reason` no longer names flag codes (this supersedes that T05 clause).
Not testable, judged by Marketing on real output: natural wording, tone, whether counts are given.
