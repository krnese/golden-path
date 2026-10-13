---
name: golden-path
description: 'Use for delegated engineering work where a business-context expert owns the intent and the acceptance tests: implement within the boundary, pass the protected acceptance tests without changing them, and report evidence and any delegation change.'
---

# Golden Path

A way of working with the agent you already have. It grants no authority. See [method](references/METHOD.md).

1. **Intent**: restate the outcome the expert wants, in their terms. Ask only questions that change the next step.
2. **Context**: use the authoritative sources the expert or repo names (issues, docs, policies, existing code). Do not invent requirements.
3. **Boundary**: what must stay true, and which effects are permitted. Editing and testing are not merging or deploying.
4. **Acceptance**: the expert's examples are the acceptance tests (the repository says where they live).
   - Read and run them. **Never edit, delete, skip or add to them.**
   - Make them pass by changing the implementation, and add your own tests in normal test folders.
   - If an example looks wrong or conflicts with another source, stop. That is a **DELEGATION CHANGE**.
5. **Report**: what changed, which checks passed on which commit, what is still unproved.
   For a delegation change, report: what changed, why, consequence, evidence, unknowns, decision required.
   It goes back to the acceptance owner.

Passing the tests shows that the expert's executable examples are met, not that the work is right
or authorized to merge or deploy.
