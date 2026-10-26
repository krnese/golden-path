// Regression tests for the six review findings on #41 (Copilot review, 26 Oct 2026).
// Existing tests in golden-loop.test.mjs are unchanged; these add the cases the review showed were wrong.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  evidenceCheck, ownerJudgment, parseOwners, reopenComment, closingReferences, workReferences, stripCode,
} from "../.github/scripts/golden-loop.mjs";

const TEMPLATE = fs.readFileSync(new URL("../.github/pull_request_template.md", import.meta.url), "utf8");
const comment = (login, body, created_at, author_association) =>
  ({ user: { login }, body, created_at, author_association, html_url: "u" });

describe("Review P1: a PR cannot rewrite the check that judges it", () => {
  const wf = fs.readFileSync(new URL("../.github/workflows/golden-loop.yml", import.meta.url), "utf8");
  test("the evidence check runs on pull_request_target, not pull_request", () => {
    assert.match(wf, /^\s{2}pull_request_target:/m);
    assert.doesNotMatch(wf, /^\s{2}pull_request:/m);
    assert.match(wf, /if: github\.event_name == 'pull_request_target'/);
  });
  test("it checks out only the base commit, with a read-only token and no persisted credentials", () => {
    const job = wf.slice(wf.indexOf("  evidence:"));
    assert.match(job, /ref: \$\{\{ github\.event\.pull_request\.base\.sha \}\}/);
    assert.doesNotMatch(job, /head\.sha|head\.ref|merge/);
    assert.match(job, /persist-credentials: false/);
    assert.doesNotMatch(job, /: write/);
    assert.match(wf, /^permissions: \{\}$/m);
  });
  test("PR-controlled text is never interpolated into a shell command", () => {
    const runs = [...wf.matchAll(/run: (.+)/g)].map((m) => m[1]);
    for (const r of runs) assert.doesNotMatch(r, /\$\{\{/);
    assert.doesNotMatch(wf, /pull_request\.(body|title)|head_ref/);
  });
});

describe("Review P1: an empty template or IDs in prose are not evidence", () => {
  test("the unchanged PR template fails for E1", () => {
    const r = evidenceCheck(TEMPLATE, ["E1"]);
    assert.equal(r.ok, false);
    assert.deepEqual(r.empty, ["E1"]);
  });
  test("an unchanged template with no example IDs also fails", () => {
    assert.equal(evidenceCheck(TEMPLATE, []).ok, false);
  });
  test("IDs mentioned in prose or HTML comments next to an unrelated table do not count", () => {
    const body = "E1 and E2 are covered, trust me. <!-- | E3 | x | y | -->\n\n" +
      "| Example | Expected | Actual |\n| --- | --- | --- |\n| other | yes | yes |";
    const r = evidenceCheck(body, ["E1", "E2", "E3"]);
    assert.equal(r.ok, false);
    assert.deepEqual(r.missing, ["E1", "E2", "E3"]);
  });
  test("placeholder cells such as -, … or TBD do not count", () => {
    const body = "| Example | Expected | Actual |\n| --- | --- | --- |\n| E1 | Six prompts | TBD |\n| E2 | … | yes |";
    assert.deepEqual(evidenceCheck(body, ["E1", "E2"]).empty, ["E1", "E2"]);
  });
  test("the real #43 description, with quoted actual output in code, passes", () => {
    const pr43 = "Refs #42\n\n## Golden Loop evidence\n\n| Example | Expected | Actual (at commit 0c1ec72) | Evidence and gaps |\n" +
      "| --- | --- | --- | --- |\n| E1 | Exact phrases | `Owner judgment: meets the need`; `needs revision` | All three appear |\n" +
      "| E2 | Reopen and owner closes | “the issue is reopened until you do” | Stated |\n| E3 | Plain language | Short sentences | No terms |";
    assert.equal(evidenceCheck(pr43, ["E1", "E2", "E3"]).ok, true);
  });
});

describe("Review P2: an owner without an @username fails closed", () => {
  const body = "### Named owner\n\nIngrid Berg (Finance)\n";
  const cs = [comment("collaborator", "Owner judgment: meets the need", "2026-10-26T13:00:00Z", "COLLABORATOR")];
  test("no owner is parsed, and no collaborator's judgment stands in for the owner's", () => {
    assert.deepEqual(parseOwners(body), []);
    assert.equal(ownerJudgment(cs, parseOwners(body)), null);
  });
  test("the reopen comment asks for the owner to be named by @username", () => {
    const text = reopenComment({ closer: { type: "PullRequest", number: 43 }, reason: "no owner is named by @username", owners: [] });
    assert.match(text, /No owner with an @username is named/);
  });
  test("a named owner's judgment still counts", () => {
    const own = [comment("krnese", "Owner judgment: meets the need", "2026-10-26T14:25:52Z", "OWNER")];
    assert.equal(ownerJudgment(own, ["krnese"]).verdict, "meets the need");
  });
});

describe("Review P2: code spans and other repositories", () => {
  test("double-backtick code spans are ignored", () => {
    assert.deepEqual(closingReferences("Quoting ``Fixes #38`` here", "krnese/golden-path"), []);
    assert.doesNotMatch(stripCode("a ``Fixes #38`` b"), /Fixes/);
    assert.deepEqual(closingReferences("Fixes #38 and `x` then ``y``", "krnese/golden-path"), [38]);
  });
  test("a reference to another repository is not this repository's issue", () => {
    assert.deepEqual(closingReferences("Fixes other/repo#38", "krnese/golden-path"), []);
    assert.deepEqual(closingReferences("Fixes krnese/golden-path#38", "krnese/golden-path"), [38]);
    assert.deepEqual(workReferences("Refs other/repo#5 and fixes other/repo#38", "krnese/golden-path"), []);
  });
});
