// Regression tests for Copilot's review of #45 (27 Oct 2026): in a table, GitHub splits a row into cells before it
// finds code spans, so a backtick in one cell cannot pair with a backtick in another. Earlier Golden Loop test files
// are unchanged; these add the new cases.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { evidenceCheck, visibleLines } from "../.github/scripts/golden-loop.mjs";

const HEAD = "| Example | Expected | Actual |\n| --- | --- | --- |\n";
const HEAD4 = "| Example | Expected | Actual | Notes |\n| --- | --- | --- | --- |\n";
const ROW = "| E1 | Six prompts | Six labels |";

describe("Review of #45: code spans in a table row stay within their cell", () => {
  test("backticks in separate cells do not hide a comment that leaves Actual empty (the review's case)", () => {
    const r = evidenceCheck(HEAD4 + "| E1 | `six | <!-- hidden result --> | six` |", ["E1"]);
    assert.equal(r.ok, false);
    assert.deepEqual(r.missing, ["E1"]);
    assert.deepEqual(r.empty, ["E1"]);
  });
  test("the same applies in a later row of the table", () => {
    const r = evidenceCheck(HEAD4 + ROW + " x |\n| E2 | `six | <!-- hidden --> | six` |", ["E1", "E2"]);
    assert.deepEqual(r.missing, ["E2"]);
  });
  test("an escaped pipe inside a code span keeps the span in one cell", () => {
    const r = evidenceCheck(HEAD + "| E1 | Six | `a \\| <!-- kept -->` |", ["E1"]);
    assert.equal(r.ok, true);
  });
  test("a code span within one cell is still kept as written", () => {
    const body = HEAD + "| E1 | Opener shown | `<!-- retained -->` |";
    assert.equal(evidenceCheck(body, ["E1"]).ok, true);
    assert.equal(visibleLines(body).at(-1), "| E1 | Opener shown | `<!-- retained -->` |");
  });
});

describe("Review of #45: prose outside tables is unchanged", () => {
  test("a code span with a pipe in prose still protects a <!-- inside it", () => {
    const body = "Use `x | <!-- y` in prose.\n\n" + HEAD + ROW;
    assert.equal(evidenceCheck(body, ["E1"]).ok, true);
    assert.equal(visibleLines(body)[0], "Use `x | <!-- y` in prose.");
  });
  test("after a table ends at a blank line, prose code spans span pipes again", () => {
    const body = HEAD + ROW + "\n\nThen `a | <!-- b` here.\n\n" + HEAD + "| E2 | Six | Six |";
    assert.equal(evidenceCheck(body, ["E1", "E2"]).ok, true);
  });
});
