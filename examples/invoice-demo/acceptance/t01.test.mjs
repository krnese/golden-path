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

// T01: see EXAMPLES.md section T01
test("T01 test_discount_before_vat", () => {
  const l = new Line("A", "100.00", 1, "standard", { discountPct: "10" });
  assertDec(l.net(), D("90.00"));
  assertDec(l.vat(), D("22.50"));
});
test("T01 test_rounding_after_discount", () => {
  const l = new Line("A", "0.15", 1, "standard", { discountPct: "50" }); // 0.075 -> 0.08
  assertDec(l.net(), D("0.08"));
});
test("T01 test_default_unchanged", () => {
  assertDec(new Invoice().add(new Line("A", "10.00", 3)).grossTotal(), D("37.50"));
});
test("T01 test_range", () => {
  for (const bad of ["-1", "100.01"]) {
    assert.throws(() => new Line("A", "1.00", 1, "standard", { discountPct: bad }), RangeError);
  }
  new Line("A", "1.00", 1, "standard", { discountPct: "100" });
});
