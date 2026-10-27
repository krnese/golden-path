// Regression tests for the three parser findings in Copilot's last review of #44 (27 Oct 2026): what GitHub
// renders as a table is what counts. Earlier Golden Loop test files are unchanged; these add the new cases.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { evidenceCheck, visibleLines } from "../.github/scripts/golden-loop.mjs";

const HEAD = "| Example | Expected | Actual |\n| --- | --- | --- |\n";
const ROW = "| E1 | Six prompts | Six labels |";

describe("Review of #44: GFM delimiter cells may have a single hyphen", () => {
  test("| - | - | - | under the header starts a table and a filled row counts", () => {
    const r = evidenceCheck("| Example | Expected | Actual |\n| - | - | - |\n" + ROW, ["E1"]);
    assert.equal(r.hasTable, true);
    assert.equal(r.ok, true);
  });
  test("one or two hyphens with alignment colons work too", () => {
    assert.equal(evidenceCheck("| Example | Expected | Actual |\n|:-|:-:|--:|\n" + ROW, ["E1"]).ok, true);
  });
  test("a short delimiter row with a different cell count still does not start a table", () => {
    assert.equal(evidenceCheck("| Example | Expected | Actual |\n| - | - |\n" + ROW, ["E1"]).hasTable, false);
  });
});

describe("Review of #44: HTML comments are hidden as GitHub hides them", () => {
  test("an unterminated <!-- hides the filled table after it", () => {
    const r = evidenceCheck("Report below.\n<!-- draft\n\n" + HEAD + ROW, ["E1"]);
    assert.equal(r.ok, false);
    assert.equal(r.hasTable, false);
    assert.deepEqual(r.missing, ["E1"]);
  });
  test("an unterminated <!-- mid-table hides the rows after it", () => {
    const body = HEAD + ROW + "\n| E2 | a | b | <!-- unfinished\n| E3 | c | d |";
    assert.deepEqual(evidenceCheck(body, ["E1", "E2", "E3"]).missing, ["E3"]);
  });
  test("an inline-code <!-- retained --> in an Actual cell is visible output, not a comment", () => {
    const r = evidenceCheck(HEAD + "| E1 | The literal is kept | `<!-- retained -->` |", ["E1"]);
    assert.equal(r.ok, true);
    assert.deepEqual(r.empty, []);
  });
  test("an inline-code <!-- does not hide the rows after it", () => {
    const body = HEAD + "| E1 | Opener shown | `<!--` |\n| E2 | Six prompts | Six labels |";
    assert.equal(evidenceCheck(body, ["E1", "E2"]).ok, true);
  });
  test("terminated comments, on one line or across lines, are still hidden", () => {
    assert.deepEqual(evidenceCheck(HEAD + "<!-- | E1 | a | b | -->", ["E1"]).missing, ["E1"]);
    const body = "<!--\n" + HEAD + ROW + "\n-->\n\n" + HEAD + "| E2 | Six prompts | Six labels |";
    const r = evidenceCheck(body, ["E1", "E2"]);
    assert.deepEqual(r.missing, ["E1"]);
    assert.equal(r.hasTable, true);
  });
});

describe("Review of #44: tables inside fenced code blocks are code, not evidence", () => {
  test("a fenced markdown sample with a filled evidence table is not ok and has no table", () => {
    const r = evidenceCheck("Example report:\n\n```markdown\n" + HEAD + ROW + "\n```\n", ["E1"]);
    assert.equal(r.ok, false);
    assert.equal(r.hasTable, false);
  });
  test("~~~ fences and longer fences work, and a shorter inner fence does not close them", () => {
    assert.equal(evidenceCheck("~~~md\n" + HEAD + ROW + "\n~~~", ["E1"]).hasTable, false);
    assert.equal(evidenceCheck("````markdown\n```\n" + HEAD + ROW + "\n```\n````", ["E1"]).hasTable, false);
  });
  test("an unclosed fence runs to the end of the description", () => {
    assert.equal(evidenceCheck("```\n" + HEAD + ROW, ["E1"]).hasTable, false);
  });
  test("an HTML comment inside a fence is code and does not hide what follows the fence", () => {
    const body = "```html\n<!-- sample\n```\n\n" + HEAD + ROW;
    assert.equal(evidenceCheck(body, ["E1"]).ok, true);
  });
  test("a real table after a closed fence counts, with inline-code cells kept", () => {
    const body = "```markdown\n" + HEAD + "| E1 | x | y |\n```\n\n" + HEAD + "| E1 | `six` | `Owner judgment: meets the need` |";
    assert.equal(evidenceCheck(body, ["E1"]).ok, true);
    assert.equal(visibleLines(body).at(-1), "| E1 | `six` | `Owner judgment: meets the need` |");
  });
});
