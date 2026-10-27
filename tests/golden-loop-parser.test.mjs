// Regression tests for the four parser findings in Copilot's review of #44 (27 Oct 2026).
// Earlier Golden Loop test files are unchanged; these add the cases that review showed were wrong.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { evidenceCheck, stripCode, workReferences, closingReferences } from "../.github/scripts/golden-loop.mjs";

const REPO = "krnese/golden-path";
const HEAD = "| Example | Expected | Actual |\n| --- | --- | --- |\n";

describe("Review of #44: an unmatched backtick does not swallow a real reference", () => {
  test("an unmatched `` before Refs #38 leaves the reference in scope", () => {
    assert.deepEqual(workReferences("Unclosed `` then Refs #38 and `x`", REPO), [38]);
    assert.match(stripCode("Unclosed `` then Refs #38 and `x`"), /Refs #38/);
  });
  test("matched spans of any length are still removed", () => {
    assert.deepEqual(closingReferences("``Fixes #38`` and `Fixes #39` and ```Fixes #40```", REPO), []);
  });
});

describe("Review of #44: Expected, Actual and the example need distinct columns", () => {
  test("a single combined column with only IDs is not evidence", () => {
    const r = evidenceCheck("| Example / Expected / Actual |\n| --- |\n| E1 |", ["E1"]);
    assert.equal(r.ok, false);
    assert.equal(r.hasTable, false);
  });
  test("an 'Expected vs actual' column does not stand in for an empty Actual column", () => {
    const r = evidenceCheck("| Example | Expected vs actual | Actual |\n| --- | --- | --- |\n| E1 | six vs six |  |", ["E1"]);
    assert.equal(r.ok, false);
    assert.deepEqual(r.empty, ["E1"]);
  });
  test("separate Expected and Actual columns in any order still work", () => {
    const body = "| Actual | Example | Expected |\n| --- | --- | --- |\n| Six labels | E1 | Six prompts |";
    assert.equal(evidenceCheck(body, ["E1"]).ok, true);
  });
});

describe("Review of #44: rows without outer pipes are valid table rows", () => {
  test("a row without a leading pipe under the header and delimiter counts", () => {
    assert.equal(evidenceCheck(HEAD + "E1 | Six prompts | Six labels", ["E1"]).ok, true);
  });
  test("a header without outer pipes works too", () => {
    assert.equal(evidenceCheck("Example | Expected | Actual\n--- | --- | ---\nE1 | Six prompts | Six labels", ["E1"]).ok, true);
  });
  test("the table still ends at a blank line or a new block", () => {
    const body = HEAD + "| E1 | Six | Six |\n\nE2 | prose after the table | x\n## Next\nE3 | not a row | x";
    assert.deepEqual(evidenceCheck(body, ["E1", "E2", "E3"]).missing, ["E2", "E3"]);
  });
  test("a delimiter row with a different cell count does not start a table", () => {
    assert.equal(evidenceCheck("| Example | Expected | Actual |\n| --- | --- |\n| E1 | a | b |", ["E1"]).hasTable, false);
  });
});

describe("Review of #44: formatted placeholders are still placeholders", () => {
  test("bold, italic or code TBD and an inline-code ellipsis do not count", () => {
    const body = HEAD + "| E1 | Six | **TBD** |\n| E2 | Six | `…` |\n| E3 | _todo_ | Six |\n| E4 | Six | ``-`` |";
    assert.deepEqual(evidenceCheck(body, ["E1", "E2", "E3", "E4"]).empty, ["E1", "E2", "E3", "E4"]);
  });
  test("real output in code formatting still counts", () => {
    const body = HEAD + "| E1 | Exact phrase | `Owner judgment: meets the need` |\n| E2 | Bold result | **Six labels** |";
    assert.equal(evidenceCheck(body, ["E1", "E2"]).ok, true);
  });
});
