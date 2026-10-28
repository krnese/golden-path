export function proposalText({ outcome, behavior, exception, failure, boundary, ownerDecision }, report) {
  const fields = { outcome, behavior, exception, failure, boundary };
  for (const [name, value] of Object.entries(fields)) {
    if (typeof value !== "string" || !value.trim() || value.length > 2000) throw new Error(`Complete ${name} in 2,000 characters or fewer; say "not yet known" if uncertain.`);
  }
  if (!["review", "approve-behavior"].includes(ownerDecision)) throw new Error("Choose whether you are requesting review or expressing an owner decision.");
  return [
    "Golden Path — behavior examples for owner review",
    `Desired outcome: ${outcome.trim()}`,
    `Proposed example 1 — normal behavior\nGiven the business situation above, when the normal request is made, the observable result should be:\n${behavior.trim()}`,
    `Proposed example 2 — exception\nWhen an exception or edge case occurs, the expected behavior is:\n${exception.trim()}`,
    `Proposed example 3 — failure\nWhen the work cannot complete, the person affected should see:\n${failure.trim()}`,
    `Boundary / consequence to preserve:\n${boundary.trim()}`,
    ownerDecision === "approve-behavior" ?
      "My explicit owner decision: I approve the behavior examples above for drafting executable acceptance in a separate reviewed change. This does not approve any tests not yet reviewed, authorize implementation, merge or deployment." :
      "These are proposals, not approved acceptance. Ask the accountable owner to correct and explicitly approve their meaning.",
    `Existing source: ${report?.contract || "not linked; identify the authoritative request before implementation"}. Inspected HEAD: ${report?.head || "unavailable"}.`,
    "Keep this in the existing request/review record, not a new App contract. Ask focused questions where expected behavior, exceptions, failure conditions or consequential decisions remain unclear. Do not invent missing examples.",
    "Draft executable acceptance only as a separate owner-reviewed change, with an example-to-test explanation. Do not modify owner-approved tests or implement this proposal in the same step. Begin implementation only after the owner approves the executable acceptance and the existing process permits it.",
    "Re-read the repository artifacts and actual verification evidence before claiming any example is implemented or verified. Explain missing evidence in plain language. An owner message is not a verified approval record until the existing review process establishes it.",
  ].join("\n\n");
}

export function plainEvidence(report) {
  const current = report.evidence.freshness === "current";
  const acceptance = report.evidence.checks.find((x) => x.name === "acceptance");
  if (!current) return "We do not have up-to-date verification for this work. Older successes do not tell us whether this version works.";
  if (!acceptance || acceptance.status === "unavailable") return "No business acceptance check is available. Developer checks may have run, but we cannot say your examples are satisfied.";
  if (acceptance.status === "passed") return "The recorded acceptance command succeeded for this local version. That covers only what its tests check; review the original output and judge whether the examples are sufficient.";
  if (acceptance.status === "failed") return "The recorded acceptance command failed. Do not claim the requested behavior works; inspect the failure and fix implementation without changing approved examples.";
  if (acceptance.status === "skipped") return "The acceptance check was skipped. It has not demonstrated the requested behavior.";
  return "The acceptance result could not be verified. Missing certainty is not success; ask for the missing evidence.";
}
