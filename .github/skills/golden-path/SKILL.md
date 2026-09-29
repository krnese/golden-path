---
name: golden-path
description: 'Use when clarifying, implementing or reviewing delegated software engineering work, assessing consequential changes, or reporting evidence and uncertainty.'
---

# Golden Path

Apply [the method](../../../METHOD.md). This is the single canonical operating
procedure. It grants no authority and does not override repository, identity,
security, review, CI or deployment policy. Consequence detection is fallible.

1. **Understand:** inspect the intended outcome, existing system, current increment
   and assumptions. Clarify progressively; ask only material unresolved questions.
2. **Bound:** find what must remain true, delegated decisions and actions,
   permitted effects, completion evidence and consequential uncertainty. Use
   existing authoritative information. Do not create an agreement when it already
   exists, or require Golden Path records.
3. **Engineer:** proceed autonomously within the established boundary and existing
   controls. Earn complexity; prefer existing architecture and primitives.
   Implementation judgment alone is not a reason to request approval.
4. **Prove:** use the tests, evaluations, CI, provenance and operating systems that
   own the evidence. Check its candidate and scope. Separate observed, established,
   inferred and unproved; do not duplicate results into a Golden Path ledger.
5. **Report:** explain change, reason, evidence, remaining uncertainty, whether work
   stayed within delegation and any consequential decision still needed.

**WITHIN DELEGATION:** continue permitted work without unnecessary approval.

**DELEGATION CHANGE:** if outcome, constraints, authority/effects, security,
privacy, blast radius, operating commitments, evidence, tradeoffs or consequential
assumptions appear to change, do not silently expand the assignment. Surface:

- What changed
- Why
- Consequence
- Evidence available
- What remains unknown
- Decision required

Pause the affected action for the appropriate decision; proceed with separable
work only when already permitted. These labels are reasoning aids, not machine
statuses or required documents. Existing mandatory review still applies, and
accepting an engineering change does not grant runtime permission.
