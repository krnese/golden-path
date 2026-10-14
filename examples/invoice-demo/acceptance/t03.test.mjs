// Protected acceptance tests, built from acceptance/EXAMPLES.md and approved by Finance (Ingrid Berg).
// Agents may read and run these tests but never change them. Any change goes back to the owner.
// The owner enables increments by naming their files in .golden-path/config.json acceptance.command.
// Port of acceptance/test_acceptance.py (Python unittest); same examples, same assertions.
// Python ValueError -> RangeError; TypeError -> TypeError; a JS number is the counterpart of a Python float.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as invoice from "../invoice.mjs"; // namespace import, so one unimplemented increment cannot break the others

const { Decimal, Invoice, Line } = invoice;
const D = (s) => new Decimal(s);
const assertDec = (actual, expected) => {
  assert.ok(actual instanceof Decimal, `expected a Decimal, got ${actual}`);
  assert.ok(actual.eq(expected), `${actual} != ${expected}`);
};

// T03: see EXAMPLES.md section T03
test("T03 test_bulk_threshold", () => {
  assertDec(new Line("A", "1.00", 9).net(), D("9.00"));
  assertDec(new Line("A", "1.00", 10).net(), D("9.50"));
});
test("T03 test_combined_single_rounding", () => {
  // 0.33*10*0.9*0.95 = 2.8215 -> 2.82
  const l = new Line("A", "0.33", 10, "standard", { discountPct: "10" });
  assertDec(l.net(), D("2.82"));
  assertDec(l.vat(), D("0.71"));
});
