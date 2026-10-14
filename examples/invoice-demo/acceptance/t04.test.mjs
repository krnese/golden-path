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

// Python dict equality {"net": Decimal, "vat": Decimal}: exactly these keys, each numerically equal.
const assertNetVat = (actual, net, vat) => {
  assert.deepEqual(Object.keys(actual).sort(), ["net", "vat"]);
  assertDec(actual.net, net);
  assertDec(actual.vat, vat);
};

// T04: see EXAMPLES.md section T04
test("T04 test_summary_matches_totals", () => {
  const inv = new Invoice().add(new Line("A", "0.10", 1)).add(new Line("B", "0.10", 1))
    .add(new Line("F", "10.00", 1, "food"));
  const s = inv.vatSummary();
  assertNetVat(s["standard"], D("0.20"), D("0.06"));
  assertNetVat(s["food"], D("10.00"), D("1.50"));
  assert.ok(!Object.hasOwn(s, "exempt"));
  assertDec(Object.values(s).reduce((acc, v) => acc.add(v["vat"]), D("0")), inv.vatTotal());
});
