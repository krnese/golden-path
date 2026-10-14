// Protected acceptance tests, built from acceptance/marketing/EXAMPLES.md and approved by Marketing.
// Marketing owns this path (T05); Finance owns acceptance/t01..t04.test.mjs (T01..T04).
// Agents may read and run these tests but never change them. Any change goes back to Marketing.
// The owner enables increments by naming their files in .golden-path/config.json acceptance.command
// (e.g. acceptance/marketing/t05.test.mjs).
// Port of acceptance/marketing/test_acceptance.py (Python unittest); same examples, same assertions.
// Python TypeError -> TypeError; a JS number (e.g. 1.0) is the counterpart of a Python float.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as invoice from "../../invoice.mjs";

const { Decimal, Invoice, Line } = invoice;
const D = (s) => new Decimal(s);
const KEYS = ["flags", "gross", "lines", "net", "reason", "recommendation", "vat"];
const codes = (s) => s["flags"].map((f) => f["code"]);
const assertDec = (actual, expected) => {
  assert.ok(actual instanceof Decimal, `expected a Decimal, got ${actual}`);
  assert.ok(actual.eq(expected), `${actual} != ${expected}`);
};
const assertOneSentence = (text) => {
  assert.equal(typeof text, "string");
  assert.ok(!text.includes("\n"));
  assert.ok(text.trim().endsWith("."));
  assert.ok([...text].length <= 200); // code points, like Python len()
};

// T05: see acceptance/marketing/EXAMPLES.md section T05 (owner: Marketing)
test("T05 test_fixed_fields_and_totals_reconcile", () => {
  const inv = new Invoice().add(new Line("A", "100.00", 2)).add(new Line("F", "10.00", 1, "food"));
  const s = inv.reviewSummary();
  assert.deepEqual(Object.keys(s).sort(), KEYS);
  assert.equal(s["lines"], 2);
  assertDec(s["net"], inv.netTotal());
  assertDec(s["vat"], inv.vatTotal());
  assertDec(s["gross"], inv.grossTotal());
  assertDec(s["net"].add(s["vat"]), s["gross"]);
});

test("T05 test_clean_invoice_is_approved_with_one_sentence", () => {
  const s = new Invoice().add(new Line("A", "100.00", 2)).reviewSummary();
  assertDec(s["gross"], D("250.00"));
  assert.deepEqual(s["flags"], []);
  assert.equal(s["recommendation"], "approve");
  assertOneSentence(s["reason"]);
});

test("T05 test_duplicate_line_flagged_with_plain_reason", () => {
  const s = new Invoice().add(new Line("A", "100.00", 1)).add(new Line("A", "100.00", 1)).reviewSummary();
  assert.deepEqual(codes(s), ["duplicate_line"]);
  assert.ok(s["flags"][0]["reason"].includes("A"));
  assert.equal(s["recommendation"], "review");
  assert.ok(s["reason"].includes("duplicate_line"));
  assertOneSentence(s["reason"]);
});

test("T05 test_same_sku_with_other_differences_is_not_duplicate", async (t) => {
  const cases = [
    [[new Line("A", "100.00", 1), new Line("A", "90.00", 1)], D("237.50")], // price differs
    [[new Line("A", "100.00", 1), new Line("A", "100.00", 2)], D("375.00")], // quantity differs
    [[new Line("A", "100.00", 1), new Line("A", "100.00", 1, "food")], D("240.00")], // VAT class differs
  ];
  for (const [lines, gross] of cases) {
    await t.test(`lines=${JSON.stringify(lines)}`, () => {
      const s = new Invoice().add(lines[0]).add(lines[1]).reviewSummary();
      assertDec(s["gross"], gross);
      assert.ok(!codes(s).includes("duplicate_line"));
      assert.deepEqual(s["flags"], []);
      assert.equal(s["recommendation"], "approve");
    });
  }
});

test("T05 test_threshold_is_strictly_greater", () => {
  const at = new Invoice().add(new Line("A", "40000.00", 1)).reviewSummary();
  assertDec(at["gross"], D("50000.00"));
  assert.equal(at["recommendation"], "approve");
  const over = new Invoice().add(new Line("A", "40000.01", 1)).reviewSummary();
  assert.deepEqual(codes(over), ["over_threshold"]);
  assert.ok(over["flags"][0]["reason"].includes("50000.00"));
  assert.equal(over["recommendation"], "review");
  assert.throws(() => new Invoice().add(new Line("A", "1.00", 1)).reviewSummary(1.0), TypeError);
});

test("T05 test_custom_threshold_reason_states_effective_threshold", async (t) => {
  for (const threshold of ["10.00", D("10.00")]) {
    await t.test(`threshold=${typeof threshold === "string" ? JSON.stringify(threshold) : `Decimal("${threshold}")`}`, () => {
      const s = new Invoice().add(new Line("A", "10.00", 1)).reviewSummary(threshold);
      assertDec(s["gross"], D("12.50"));
      assert.deepEqual(codes(s), ["over_threshold"]);
      assert.ok(s["flags"][0]["reason"].includes("10.00"));
      assert.ok(!s["flags"][0]["reason"].includes("50000.00"));
      assert.equal(s["recommendation"], "review");
    });
  }
});

test("T05 test_decimal_threshold_accepted_at_boundary", () => {
  const s = new Invoice().add(new Line("A", "10.00", 1)).reviewSummary(D("12.5"));
  assert.deepEqual(s["flags"], []);
  assert.equal(s["recommendation"], "approve");
});

test("T05 test_empty_invoice_needs_review", () => {
  const s = new Invoice().reviewSummary();
  assert.equal(s["lines"], 0);
  assert.deepEqual(codes(s), ["empty"]);
  assert.equal(typeof s["flags"][0]["reason"], "string");
  assert.ok(s["flags"][0]["reason"].trim());
  assert.equal(s["recommendation"], "review");
  assert.ok(s["reason"].includes("empty"));
  assertOneSentence(s["reason"]);
});

test("T05 test_every_flag_named_in_reason", () => {
  const s = new Invoice().add(new Line("A", "30000.00", 1)).add(new Line("A", "30000.00", 1))
    .reviewSummary();
  assert.deepEqual([...codes(s)].sort(), ["duplicate_line", "over_threshold"]);
  for (const f of s["flags"]) {
    assert.ok(f["reason"].trim());
    assert.ok(s["reason"].includes(f["code"]));
  }
  assertOneSentence(s["reason"]);
});
