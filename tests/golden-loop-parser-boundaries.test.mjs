import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { evidenceCheck, visibleLines } from "../.github/scripts/golden-loop.mjs";

const HEADER = "| Example | Expected | Actual | Notes |";
const DELIMITER = "| --- | --- | --- | --- |";
const HIDDEN_ACTUAL = "| E1 | `six | <!-- hidden result --> | six` |";
const FILLED = "| E1 | Six prompts | Six labels | Observed |";
const VALID = `${HEADER}\n${DELIMITER}\n${FILLED}`;

describe("Review of #45: visibility and evidence reuse table boundaries", () => {
  for (const header of [
    `${HEADER} <!-- | -->`,
    `${HEADER} <!-- | extra | -->`,
    "| Example <!-- | --> | Expected | Actual | Notes |",
  ]) {
    test(`stripping comments cannot repair a rejected header: ${header}`, () => {
      const body = `${header}\n${DELIMITER}\n${HIDDEN_ACTUAL}`;
      assert.deepEqual(evidenceCheck(body, ["E1"]), {
        ok: false, hasTable: false, missing: ["E1"], empty: [],
      });
      assert.deepEqual(evidenceCheck(body, []), {
        ok: false, hasTable: false, missing: [], empty: [],
      });
      assert.equal(visibleLines(body).at(-1), HIDDEN_ACTUAL);
    });

    test(`a rejected header does not hide a later valid table: ${header}`, () => {
      const body = `${header}\n${DELIMITER}\n${HIDDEN_ACTUAL}\n\n${VALID}`;
      assert.deepEqual(evidenceCheck(body, ["E1"]), {
        ok: true, hasTable: true, missing: [], empty: [],
      });
    });
  }

  test("a comment-hidden delimiter cannot manufacture a table", () => {
    const body = `${HEADER}\n${DELIMITER} <!-- hidden -->\n${FILLED}`;
    assert.equal(evidenceCheck(body, ["E1"]).hasTable, false);
  });

  for (const comment of ["<!-- note -->", "<!-- \\| -->"]) {
    test(`comments that do not alter cell counts preserve a real table: ${comment}`, () => {
      const head = `${HEADER.replace("Notes", `Notes ${comment}`)}\n${DELIMITER}\n`;
      assert.deepEqual(evidenceCheck(head + HIDDEN_ACTUAL, ["E1"]), {
        ok: false, hasTable: true, missing: ["E1"], empty: ["E1"],
      });
      assert.equal(evidenceCheck(head + FILLED, ["E1"]).ok, true);
    });
  }
});
