import assert from "node:assert/strict";
import { test } from "node:test";
import { proposalText, plainEvidence } from "../guided-content.mjs";

const answers = {
  outcome: "Find incorrect invoices before payment.",
  behavior: "An invoice with matching totals can be reviewed.",
  exception: "A duplicate invoice is flagged for a person.",
  failure: "If validation is unavailable, show that it was not checked.",
  boundary: "Never make a payment automatically.",
  ownerDecision: "review",
};
test("guided answers become inspectable behavior proposals without inventing approval or implementation authority", () => {
  const prompt = proposalText(answers, { head: "abc", contract: "task.md" });
  for (const value of Object.values(answers).filter((x) => x !== "review")) assert.ok(prompt.includes(value));
  assert.match(prompt, /proposals, not approved acceptance/);
  assert.match(prompt, /separate owner-reviewed change/);
  assert.match(prompt, /Do not modify owner-approved tests/);
  assert.match(prompt, /Do not invent missing examples/);
  assert.match(prompt, /task.md/);
  assert.equal(answers.ownerDecision, "review");
});
test("explicit owner expression approves meaning only, not unreviewed tests or a new approval record", () => {
  const prompt = proposalText({ ...answers, ownerDecision: "approve-behavior" });
  assert.match(prompt, /My explicit owner decision/);
  assert.match(prompt, /does not approve any tests not yet reviewed/);
  assert.match(prompt, /not a verified approval record/);
  assert.match(prompt, /not linked/);
});
test("focused questions do not accept missing or whitespace-only expectations", () => {
  for (const name of ["outcome", "behavior", "exception", "failure", "boundary"]) {
    assert.throws(() => proposalText({ ...answers, [name]: " " }), new RegExp(name));
    assert.throws(() => proposalText({ ...answers, [name]: "a".repeat(2001) }));
  }
  assert.throws(() => proposalText({ ...answers, ownerDecision: "approve-tests" }));
});
test("guided verification language keeps stale, failed, skipped and missing evidence distinct", () => {
  const report = (freshness, status) => ({ evidence: { freshness, checks: [{ name: "acceptance", status }] } });
  assert.match(plainEvidence(report("stale", "passed")), /Older successes/);
  assert.match(plainEvidence(report("current", "unavailable")), /cannot say your examples are satisfied/);
  assert.match(plainEvidence(report("current", "failed")), /without changing approved examples/);
  assert.match(plainEvidence(report("current", "skipped")), /has not demonstrated/);
  assert.match(plainEvidence(report("current", "unverified")), /not success/);
  assert.match(plainEvidence(report("current", "passed")), /covers only what its tests check/);
});
