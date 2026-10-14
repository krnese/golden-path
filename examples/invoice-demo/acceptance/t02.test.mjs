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

// T02: see EXAMPLES.md section T02
test("T02 test_examples", () => {
  assert.equal(invoice.formatNok(D("1234.5")), "1 234,50 kr");
  assert.equal(invoice.formatNok(D("-0.005")), "-0,01 kr");
  assert.equal(invoice.formatNok(D("0")), "0,00 kr");
  assert.equal(invoice.formatNok(D("1234567.891")), "1 234 567,89 kr");
});
test("T02 test_rejects_float", () => {
  assert.throws(() => invoice.formatNok(1.5), TypeError);
});
