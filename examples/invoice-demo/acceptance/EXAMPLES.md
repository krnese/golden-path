# Acceptance examples: invoice calculator

Owner: **Finance, Ingrid Berg** (a fictional business-context expert). These examples are the
acceptance criteria. Each section is an executable test class in `acceptance/test_acceptance.py`, which Ingrid reviewed
and approved. Agents may read and run them but never change them. A change goes back to Ingrid.
Ingrid releases increments by naming them in the acceptance command (`.golden-path/config.json`), e.g. `python3 -m unittest acceptance.test_acceptance.T01`.

## T01: Percentage discount per line
| Unit price | Qty | Discount | Net | VAT (25%) | Why |
|---|---|---|---|---|---|
| 100.00 | 1 | 10% | 90.00 | 22.50 | Discount comes off before VAT |
| 0.15 | 1 | 50% | 0.08 | | Round once, after the discount, half-up |
| 10.00 | 3 | none | 30.00 | 7.50 | No discount, no change |
| | | −1% or 100.01% | rejected | | Discount must be 0–100% |

## T02: Norwegian money formatting
`1234.5` → `1 234,50 kr`; `-0.005` → `-0,01 kr`; `0` → `0,00 kr`; `1234567.891` → `1 234 567,89 kr`. Binary floats are refused (use exact decimals).

## T03: Bulk discount
Quantity 9 at 1.00 → 9.00. Quantity 10 at 1.00 → 9.50 (5% bulk). 10 × 0.33 with 10% → net 2.82, VAT 0.71 (one rounding).

## T04: VAT summary
Two standard lines at 0.10 and one food line at 10.00 → standard: net 0.20, VAT 0.06; food: net 10.00,
VAT 1.50. The summary always adds up to the invoice VAT total.
