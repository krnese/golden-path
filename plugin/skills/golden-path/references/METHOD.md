# The Golden Path method (v3)

**A better way of working with the agents you already have, not another system.**

The business-context expert owns two things: the **intent**, and the **acceptance** of the result.
The agent and the controls you already use (Copilot, your CI, branch protection, review) do the rest.

| Step | Business-context expert | Agent (+ developer) |
|---|---|---|
| Intent | States the outcome in business terms | Restates it; asks only material questions |
| Context | Points to authoritative sources | Uses them; does not invent requirements |
| Boundary | Says what must stay true and which effects are allowed | Stays inside; editing ≠ merging ≠ deploying |
| Acceptance | Writes business examples; approves the executable tests made from them | Starts from the owner's latest acceptance; makes it pass **without changing it** |
| Report | Judges the real output; decides on delegation changes | Shows real output per example, uncovered cases, the PR's check results and any delegation change |

**Acceptance tests owned by the expert.** The examples become executable tests that the expert reviews.
The agent reads and runs them but does not change them. Changing one is a decision for the owner.
This follows external evidence that agents with write access to tests will sometimes modify or game them
(ImpossibleBench, ICLR 2026), and that read-only or hidden tests reduce that.

**Owners approve meaning, not code.** When examples are turned into tests (in their own change, never in the
session that implements them), each test name starts with the ID of the example it checks, and the owner gets
a plain table: example, test, what it checks. The owner approves that table; a developer vouches for the code.

**Passing is not the owner's judgement.** Tests check only what the examples wrote down. The report shows the
real output for each example next to the expected result, and the cases the examples do not cover, so the owner
can see what the tests could not. The pull request's check results, not local runs, are the record.

**Start from the latest acceptance.** An owner's acceptance change lands in its own reviewed change. Work that
starts before it is compared with the older acceptance, so check the starting commit first and start a new
session after an owner revision.

**Keep architectural intent with the work.** Put the few important "must stay true" statements, their decision
owner and accepted revision in the existing task/design/review record. Do not create another registry or
treat a commit, draft, agent-authored explanation or passing tests as owner approval. Implementation is free
to evolve inside those statements; changing their meaning is the owner's decision.
The project's authoritative records define its constraints. Illustrations and test fixtures in this kit
do not impose architectural choices on other projects.

**Check effects, not filenames.** Before consequential changes, identify which accepted decisions the proposed
effects could invalidate: interfaces, state ownership, contracts, authority or lifecycle assumptions. Explain
whether the change preserves, modifies or contradicts them, or what remains uncertain. Ordinary preserving
work needs no extra approval. Judge actual purpose and behavior against the accepted decisions, not labels
or an implementation's rewritten rationale. Use bounded investigation to resolve uncertainty; escalate
if it remains material.

Re-read the accepted sources after resume or context loss and before the next consequential change. Give
delegated agents the same source references/revisions and relevant statements, not only a summary of the
implementation. Before reporting, reconcile the cumulative change against the accepted decisions, not just
the latest patch. Rewriting documentation or developer tests does not supersede the original agreement.
Use independently governed acceptance/architectural checks where available; state what they do not cover.
This is a reasoning checkpoint, not a semantic detector or proof that context was understood.

**Delegation change.** When the work seems to need a change to the outcome, constraints, permitted effects,
security/privacy, blast radius or the acceptance examples, do not silently expand the assignment. Report:
what changed, why, consequence, evidence available, unknowns, decision required. Continue only separable,
already-permitted work.

**Evidence status.** The repository's own experiments (archive/research) did not show that method guidance
improves agent behaviour on the tested synthetic cases (NO CHANGE, ceiling effects, small n). This version
therefore keeps guidance minimal and concentrates on what the expert owns. Its incremental value is
still unproved.
