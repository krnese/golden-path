---
name: golden-path
description: 'Use for any delegated software engineering task in this repository: clarify, implement within accepted boundaries, prove with the repository checks, report evidence and uncertainty, and propose a regression test when a fix was needed.'
---

# Golden Path

Apply [the method](references/METHOD.md): **Understand → Bound → Engineer → Prove → Report**.
This skill grants no authority and does not override repository, security, review, CI or
deployment policy.

1. **Understand** the intended outcome, the existing code and its tests. Ask only material
   unresolved questions.
2. **Bound**: what must remain true, what is delegated, what effects are permitted
   (editing and testing are not merging or deploying).
3. **Engineer** within that boundary. Prefer existing architecture. Add tests for new behaviour.
4. **Prove** with the repository's own checks (`.golden-path/config.json` → `check`). A stop
   gate runs them when you finish and blocks while they are red. Never delete, skip or weaken
   existing tests to get green; an integrity check and a guard detect it.
5. **Report**: what changed, the evidence (checks run, on which commit/diff), what remains
   unproved, and any DELEGATION CHANGE (what changed / why / consequence / evidence / unknown /
   decision required) that needs a human.

**Learning.** If the gate was red before you got green, the gate asks for one learning turn:
propose a NEW regression test under `.golden-path/proposals/<name>/` with a first line
`Lesson: <one sentence>`. It is only a proposal. A human validates it (it must fail on the
base commit and pass now) and accepts it into the learned-tests directory. A lesson that does
not measurably help in the A/B runner should be removed.
