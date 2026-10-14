// The developer's own tests (port of the former tests/test_invoice.py, same cases).
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { Decimal, Invoice, Line, roundMoney, toMoney } from "../invoice.mjs";

const D = (s) => new Decimal(s);
const assertDec = (actual, expected) => {
  assert.ok(actual instanceof Decimal, `expected a Decimal, got ${actual}`);
  assert.ok(actual.eq(D(expected)), `${actual} != ${expected}`);
};

describe("MoneyTests", () => {
  test("half_up_rounding", () => {
    assertDec(roundMoney(D("0.125")), "0.13");
    assertDec(roundMoney(D("0.124")), "0.12");
  });
  test("rejects_float", () => { assert.throws(() => toMoney(0.1), TypeError); });
});

describe("InvoiceTests", () => {
  test("single_standard_line", () => {
    const inv = new Invoice().add(new Line("A", "100.00", 2));
    assertDec(inv.netTotal(), "200.00");
    assertDec(inv.vatTotal(), "50.00");
    assertDec(inv.grossTotal(), "250.00");
  });
  test("vat_rounded_per_line", () => {
    const inv = new Invoice().add(new Line("A", "0.10", 1)).add(new Line("B", "0.10", 1));
    // 0.10 * 25% = 0.025 -> 0.03 per line, so 0.06 total (not 0.05)
    assertDec(inv.vatTotal(), "0.06");
  });
  test("food_rate", () => { assertDec(new Invoice().add(new Line("F", "10.00", 1, "food")).vatTotal(), "1.50"); });
  test("rejects_non_positive_quantity", () => { assert.throws(() => new Line("A", "1.00", 0), RangeError); });
  test("rejects_unknown_vat_class", () => { assert.throws(() => new Line("A", "1.00", 1, "luxury"), RangeError); });
});
