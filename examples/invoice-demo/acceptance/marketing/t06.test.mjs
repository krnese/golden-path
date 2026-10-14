// Protected acceptance tests, built from acceptance/marketing/EXAMPLES.md (section T06) and approved by Marketing.
// Marketing owns this path (T05, T06). Agents may read and run these tests but never change them.
// Intent (Marketing): "A reviewer should understand the reason without knowing any system terms,
// and every duplicated product should be named."
// Wording is deliberately NOT pinned: the tests check meaning through required words and the absence of
// system terms. Whether the sentence reads well is Marketing's judgement (see tasks/T06.md).
import { test } from "node:test";
import assert from "node:assert/strict";
import * as invoice from "../../invoice.mjs";

const { Invoice, Line } = invoice;
const FLAG_CODES = ["empty", "duplicate_line", "over_threshold"];
const codes = (s) => s["flags"].map((f) => f["code"]);
const esc = (w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const word = (w) => new RegExp(`(^|[^A-Za-z0-9_-])${esc(w)}($|[^A-Za-z0-9_-])`);

// No system terms: no underscores or snake_case identifiers, and no flag code used as a word.
const assertNoSystemTerms = (text, what) => {
  assert.equal(typeof text, "string");
  assert.ok(!text.includes("_"), `${what} contains an underscore / system identifier: ${JSON.stringify(text)}`);
  for (const c of FLAG_CODES) {
    assert.ok(!word(c).test(text), `${what} uses the flag code "${c}": ${JSON.stringify(text)}`);
  }
};
const assertOneSentence = (text) => {
  assert.equal(typeof text, "string");
  assert.ok(!text.includes("\n"), "one line");
  assert.ok(text.trim().endsWith("."), "ends with .");
  assert.ok([...text].length <= 200, `at most 200 characters, got ${[...text].length}`);
};
const assertNames = (text, sku, what) =>
  assert.ok(word(sku).test(text), `${what} does not name ${sku}: ${JSON.stringify(text)}`);
const DUP = /duplicat|more than once|twice|repeated|several times|\d+ times/i;
const LIMIT = /threshold|limit/i;
const NO_LINES = /no lines|no line items|nothing to approve|has no items/i;

const summary = (lines, threshold) => {
  let inv = new Invoice();
  for (const l of lines) inv = inv.add(l);
  return threshold === undefined ? inv.reviewSummary() : inv.reviewSummary(threshold);
};

test("T06 test_duplicate_summary_reason_is_plain_and_names_the_product", () => {
  const s = summary([new Line("PAPER-500", "100.00", 1), new Line("PAPER-500", "100.00", 1)]);
  assert.equal(s["recommendation"], "review");
  assertNoSystemTerms(s["reason"], "summary reason");
  assert.match(s["reason"], DUP);
  assertNames(s["reason"], "PAPER-500", "summary reason");
  assertOneSentence(s["reason"]);
});

test("T06 test_every_duplicated_product_is_named", () => {
  // PAPER-500 three times and TONER-9 twice: both are duplicated, both must be named.
  const s = summary([
    new Line("PAPER-500", "10.00", 1), new Line("TONER-9", "50.00", 2), new Line("PAPER-500", "10.00", 1),
    new Line("PAPER-500", "10.00", 1), new Line("TONER-9", "50.00", 2), new Line("PEN-3", "1.00", 1),
  ]);
  assert.equal(s["recommendation"], "review");
  assert.ok(codes(s).length >= 1 && codes(s).every((c) => c === "duplicate_line"), `codes: ${codes(s)}`);
  const flagText = s["flags"].map((f) => f["reason"]).join(" ");
  for (const sku of ["PAPER-500", "TONER-9"]) assertNames(flagText, sku, "duplicate flag reason(s)");
  for (const sku of ["PAPER-500", "TONER-9"]) assertNames(s["reason"], sku, "summary reason");
  assert.ok(!word("PEN-3").test(flagText), "a product that appears once is not reported as duplicated");
  for (const f of s["flags"]) assertNoSystemTerms(f["reason"], "flag reason");
  assertNoSystemTerms(s["reason"], "summary reason");
  assertOneSentence(s["reason"]);
});

test("T06 test_three_duplicated_products_still_fit_one_sentence", () => {
  const skus = ["PAPER-500", "TONER-9", "STAPLER-12"];
  const s = summary(skus.flatMap((k) => [new Line(k, "5.00", 1), new Line(k, "5.00", 1)]));
  for (const k of skus) assertNames(s["reason"], k, "summary reason");
  assertNoSystemTerms(s["reason"], "summary reason");
  assertOneSentence(s["reason"]);
});

test("T06 test_over_threshold_summary_reason_is_plain", () => {
  const s = summary([new Line("A", "40000.01", 1)]);
  assert.deepEqual(codes(s), ["over_threshold"]);
  assertNoSystemTerms(s["reason"], "summary reason");
  assertNoSystemTerms(s["flags"][0]["reason"], "flag reason");
  assert.match(s["reason"], LIMIT);
  assertOneSentence(s["reason"]);
});

test("T06 test_empty_summary_reason_is_plain", () => {
  const s = summary([]);
  assert.deepEqual(codes(s), ["empty"]);
  assertNoSystemTerms(s["reason"], "summary reason");
  assertNoSystemTerms(s["flags"][0]["reason"], "flag reason");
  assert.match(s["reason"], NO_LINES);
  assertOneSentence(s["reason"]);
});

test("T06 test_several_problems_all_explained_in_plain_words", () => {
  const s = summary([new Line("PAPER-500", "30000.00", 1), new Line("PAPER-500", "30000.00", 1)]);
  assert.deepEqual([...codes(s)].sort(), ["duplicate_line", "over_threshold"]);
  assertNoSystemTerms(s["reason"], "summary reason");
  assert.match(s["reason"], DUP);
  assert.match(s["reason"], LIMIT);
  assertNames(s["reason"], "PAPER-500", "summary reason");
  assertOneSentence(s["reason"]);
});

test("T06 test_approve_reason_is_plain", () => {
  const s = summary([new Line("A", "100.00", 2)]);
  assert.equal(s["recommendation"], "approve");
  assertNoSystemTerms(s["reason"], "summary reason");
  assertOneSentence(s["reason"]);
});

test("T06 test_t05_behaviour_unchanged", () => {
  // Flag codes stay as machine fields; only the human-facing text changes.
  assert.deepEqual(codes(summary([])), ["empty"]);
  assert.deepEqual(codes(summary([new Line("A", "1.00", 1), new Line("A", "1.00", 1)])), ["duplicate_line"]);
  assert.deepEqual(codes(summary([new Line("A", "1.00", 1), new Line("A", "2.00", 1)])), []);
  assert.deepEqual(codes(summary([new Line("A", "10.00", 1)], "10.00")), ["over_threshold"]);
  assert.ok(summary([new Line("A", "10.00", 1)], "10.00")["flags"][0]["reason"].includes("10.00"));
  assert.equal(summary([new Line("A", "40000.00", 1)])["recommendation"], "approve");
  assert.throws(() => summary([new Line("A", "1.00", 1)], 1.0), TypeError);
});
