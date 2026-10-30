---
name: golden-path
description: 'Use for Golden Path setup, visual App enablement, new-project bootstrap, team and brownfield adoption, and delegated engineering work: preserve owner-approved acceptance, implement within the boundary, and return evidence for owner judgment.'
---

# Golden Path

A way of working with the agent you already have. It grants no authority. See [method](references/METHOD.md).
For first use, bootstrap, team or brownfield adoption, follow [guided adoption](references/ADOPTION.md); ground each change's agreement in shared authoritative records and reuse existing controls.

1. **Intent**: restate the outcome the expert wants, in their terms. Ask only questions that change the next step.
2. **Context**: use the authoritative sources the expert or repo names (issues, docs, policies, existing code); do not invent requirements. Keep the few "must stay true" statements, decision owner and accepted revision in those records, not only chat.
3. **Boundary**: before consequential changes, compare proposed effects with those statements: preserves, modifies, contradicts or uncertain. Re-read the accepted sources after resume/context loss; carry them into delegation.
   Reconcile the cumulative diff before reporting. A material conflict or unresolved uncertainty is a **DELEGATION CHANGE**: pause affected work, explain the impact and seek the owner's decision; continue only separable permitted work. Do not rewrite the agreement or its checks to justify implementation. Editing and testing are not merging or deploying.
4. **Acceptance**: the expert's examples are the acceptance tests (the repository says where they live).
   - Before writing code, check that your starting commit has the owner's latest acceptance (compare with the
     default branch). If it is behind, tell the user to update and start a new session.
   - Read and run them. **Never edit, delete, skip or add to them.**
   - Make them pass by changing the implementation, and add your own tests in normal test folders.
   - If an example looks wrong or conflicts with another source, stop. That is a **DELEGATION CHANGE**.
   - If the owner changes them while you work, stop and ask the user to start a new session; never undo their change.
   - Asked to draft acceptance from examples? Do it as its own change for the owner to approve, never in the session
     that implements it. Start each test name with its example's ID and give the owner a table: example, test, what it checks.
5. **Report**: what changed, which checks passed on which commit, what is still unproved.
   - For each owner example, show the real output next to the expected result: passing tests are not the owner's judgement.
   - List cases the examples do not cover and what you chose for them.
   - Point to the pull request's check results; your local runs are not the record.
   - Put this report in the pull request description, where the owner reviews it; your session log is not seen.
   - Reference the owner's issue without a closing keyword (`Refs #N`): the owner closes it after judging the result.
   For a delegation change, report: what changed, why, consequence, evidence, unknowns, decision required.
   It goes back to the acceptance owner.

Passing the tests shows that the expert's executable examples are met, not that the work is right
or authorized to merge or deploy.
