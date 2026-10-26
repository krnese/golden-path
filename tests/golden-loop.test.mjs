// Golden Loop checks: the pure decisions behind .github/workflows/golden-loop.yml.
// Fixtures follow the real shapes seen in the cloud-agent trial (#38 issue, #39 PR, 26 Oct 2026).
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  section, parseOwners, exampleIds, parseJudgment, latestJudgment, closingReferences,
  workReferences, stripCode, evidenceCheck, decideOnClose, reopenComment,
} from "../.github/scripts/golden-loop.mjs";

const ISSUE_38 = `## Outcome
When someone opens a new issue in this repository, they should be offered a short template.

Owner: @krnese

## Examples of a good result
- **E1:** Choosing "New issue" offers a Golden Loop task template.
- **E2:** People can still open a blank issue.
- **E3:** The wording is plain enough for a business reader.

## What must stay true
- Documentation and configuration for issues only.`;

const ISSUE_FORM = `### Desired outcome

Invoices are easier to understand.

### Named owner

@Ingrid-Berg (Finance)

### Concrete examples of a good result

- T07 A duplicated product is named.
- T08 Totals are unchanged.

### What must stay true

Calculations.`;

const PR_39_BODY = `Offer a short Golden Loop agreement that a person or agent can pick up.

- **Task agreement:** Add six required, plain-language prompts.
- **Owner review:** Confirm the wording is clear enough for the next real task.

<!-- START COPILOT CODING AGENT SUFFIX -->

- Fixes #38`;

const GOOD_BODY = `Refs #38

## Golden Loop evidence
| Example | Expected | Actual at a192add | Evidence and gap |
| --- | --- | --- | --- |
| E1 | Six prompts | Six labels | Parsed YAML |
| E2 | Blank issues allowed | blank_issues_enabled: true | Not rendered yet |
| E3 | Plain wording | "What should be different..." | Owner judges |`;

const comment = (login, body, created_at, author_association = "OWNER") =>
  ({ user: { login }, body, created_at, author_association, html_url: `https://example/${created_at}` });

describe("Golden Loop: reading the issue", () => {
  test("finds the named owner in an issue form and in a hand-written issue", () => {
    assert.deepEqual(parseOwners(ISSUE_FORM), ["ingrid-berg"]);
    assert.deepEqual(parseOwners(ISSUE_38), ["krnese"]);
    assert.deepEqual(parseOwners("No owner here, but @someone is mentioned."), []);
  });
  test("lists example IDs from the examples section only", () => {
    assert.deepEqual(exampleIds(ISSUE_38), ["E1", "E2", "E3"]);
    assert.deepEqual(exampleIds(ISSUE_FORM), ["T07", "T08"]);
    assert.match(section(ISSUE_38, "What must stay true"), /Documentation/);
  });
});

describe("Golden Loop: owner judgment", () => {
  test("recognises the three verdicts, with or without bold", () => {
    assert.equal(parseJudgment("**Owner judgment: meets the need.** No changes."), "meets the need");
    assert.equal(parseJudgment("Owner judgement: Needs revision - wording"), "needs revision");
    assert.equal(parseJudgment("owner judgment: cannot yet judge"), "cannot yet judge");
    assert.equal(parseJudgment("Looks good to me"), null);
  });
  test("only the named owner's judgment counts, and the latest one wins", () => {
    const cs = [
      comment("krnese", "Owner judgment: needs revision", "2026-10-26T13:00:00Z"),
      comment("someone-else", "Owner judgment: meets the need", "2026-10-26T13:01:00Z", "COLLABORATOR"),
      comment("krnese", "Owner judgment: meets the need", "2026-10-26T13:02:00Z"),
    ];
    assert.equal(latestJudgment(cs, ["krnese"]).verdict, "meets the need");
    assert.equal(latestJudgment(cs, ["krnese"], "2026-10-26T13:01:30Z").verdict, "needs revision");
    assert.equal(latestJudgment(cs.slice(1, 2), ["krnese"]), null);
  });
  test("with no named owner, a judgment from an outside contributor does not count", () => {
    const cs = [comment("drive-by", "Owner judgment: meets the need", "2026-10-26T13:00:00Z", "CONTRIBUTOR")];
    assert.equal(latestJudgment(cs, []), null);
    assert.equal(latestJudgment([{ ...cs[0], author_association: "MEMBER" }], []).verdict, "meets the need");
  });
});

describe("Golden Loop: closing an issue", () => {
  const byPr = { type: "PullRequest", number: 39 };
  test("a merge that closes the issue before any judgment reopens it (the #38 case)", () => {
    const d = decideOnClose({ closer: byPr, judgment: null });
    assert.equal(d.action, "reopen");
    assert.match(d.reason, /no owner judgment/);
    const text = reopenComment({ closer: byPr, reason: d.reason, owners: ["krnese"] });
    assert.match(text, /merged pull request #39/);
    assert.match(text, /@krnese/);
    assert.match(text, /Owner judgment: meets the need/);
  });
  test("a merge after the owner judged 'meets the need' is left closed", () => {
    const d = decideOnClose({ closer: byPr, judgment: { verdict: "meets the need", author: "krnese", at: "t" } });
    assert.equal(d.action, "none");
  });
  test("a merge after 'needs revision' or 'cannot yet judge' reopens", () => {
    for (const verdict of ["needs revision", "cannot yet judge"]) {
      assert.equal(decideOnClose({ closer: byPr, judgment: { verdict } }).action, "reopen");
    }
  });
  test("a person closing the issue directly, or project automation, is respected", () => {
    assert.equal(decideOnClose({ closer: null, judgment: null }).action, "none");
    assert.equal(decideOnClose({ closer: { type: "ProjectV2" }, judgment: null }).action, "none");
  });
});

describe("Golden Loop: evidence on the PR", () => {
  test("the #39 description has no evidence table and covers no examples", () => {
    const r = evidenceCheck(PR_39_BODY, ["E1", "E2", "E3"]);
    assert.equal(r.ok, false);
    assert.equal(r.hasTable, false);
    assert.deepEqual(r.missing, ["E1", "E2", "E3"]);
  });
  test("an expected/actual table naming every example passes", () => {
    assert.equal(evidenceCheck(GOOD_BODY, ["E1", "E2", "E3"]).ok, true);
  });
  test("a table that skips an example fails and names it", () => {
    const r = evidenceCheck(GOOD_BODY.replace(/\| E3 .*$/m, ""), ["E1", "E2", "E3"]);
    assert.equal(r.ok, false);
    assert.deepEqual(r.missing, ["E3"]);
  });
  test("finds the issues a PR works on, but not code, passing mentions or other repositories", () => {
    assert.deepEqual(closingReferences(PR_39_BODY), [38]);
    assert.deepEqual(closingReferences("Refs #38"), []);
    assert.deepEqual(closingReferences("Closes: #12 and resolves #13"), [12, 13]);
    assert.deepEqual(workReferences("Refs #38. Part of #41. See #40 and other/repo#5"), [38, 41]);
    assert.deepEqual(workReferences(PR_39_BODY), [38]);
  });
  test("a PR that only quotes a closing keyword in code is not in scope (the #40 case)", () => {
    const pr40 = "Refs #35.\n\n- **The issue closed early:** the platform added `Fixes #38`. #38 has been reopened.\n\n```\nFixes #38\n```";
    assert.deepEqual(closingReferences(pr40), []);
    assert.deepEqual(workReferences(pr40), [35]);
    assert.doesNotMatch(stripCode(pr40), /Fixes/);
  });
});
