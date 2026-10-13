# The Golden Path method (v3)

**A better way of working with the agents you already have, not another system.**

The business-context expert owns two things: the **intent**, and the **acceptance** of the result.
The agent and the existing harness (Copilot, its hooks, your CI) do the execution.

| Step | Business-context expert | Agent (+ developer) |
|---|---|---|
| Intent | States the outcome in business terms | Restates it; asks only material questions |
| Context | Points to authoritative sources | Uses them; does not invent requirements |
| Boundary | Says what must stay true and which effects are allowed | Stays inside; editing ≠ merging ≠ deploying |
| Acceptance | Writes business examples; approves the executable tests made from them | Makes them pass **without changing them** |
| Report | Decides on delegation changes | Reports evidence, unknowns and any delegation change |

**Protected acceptance tests.** The examples become tests under paths listed in
`.golden-path/config.json` (`acceptance.paths`). The agent cannot edit them (preToolUse guard), and the stop
gate fails if any of them changed versus the session's base commit. Changing one is a decision for the owner.
This follows external evidence that agents with write access to tests will sometimes modify or game them
(ImpossibleBench, ICLR 2026), and that read-only or hidden tests reduce that.

**Delegation change.** When the work seems to need a change to the outcome, constraints, permitted effects,
security/privacy, blast radius or the acceptance examples, do not silently expand the assignment. Report:
what changed, why, consequence, evidence available, unknowns, decision required. Continue only separable,
already-permitted work.

**Evidence status.** The repository's own experiments (archive/research) did not show that method guidance
improves agent behaviour on the tested synthetic cases (NO CHANGE, ceiling effects, small n). This version
therefore keeps guidance minimal and relies on enforcement of what the expert owns. Its incremental value is
still unproved.
