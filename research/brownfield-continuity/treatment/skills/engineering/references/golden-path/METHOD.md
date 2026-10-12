# The Golden Path method

**Understand → Bound → Engineer → Prove → Report**

Delegate implementation broadly within accepted boundaries. Escalate consequential
change. Prove using the engineering systems that own the truth.

This is a reference method, not enforcement. It has not demonstrated incremental
value over competent existing engineering practice. Humans remain accountable;
agents can misunderstand intent and miss consequential changes.

## Understand

Identify the intended outcome, current problem, relevant architecture, current
increment and important assumptions. Read the existing system and its rationale
before selecting a solution.

Clarify progressively. Do not demand a complete specification before useful work
can begin. Ask only about unresolved choices that materially affect the next step.

## Bound

Establish what must remain true, what work has been delegated, which effects are
permitted, and what evidence would support completion. Distinguish permission to
edit or test from permission to merge, deploy or operate.

Use existing issues, ADRs, policies and design documents. Use the optional
[agreement template](templates/ENGINEERING.md) only when equivalent information
is missing. Do not introduce a second source of truth or parse the agreement into
a new model. Surface conflicting or consequentially incomplete guidance.

## Engineer

Proceed autonomously inside the established boundary, subject to existing
controls. Implementation choices do not require extra approval merely because
an agent makes them.

Complexity must be earned. Prefer existing architecture and engineering
primitives. Tools and capabilities do not automatically justify additional
agents, services, workflows or infrastructure.

Use AI for judgment and deterministic mechanisms for explicit invariants.
Judgment determines which constraints matter; the systems that own the relevant
actions must enforce them. A declared permission is not actual authorization.

## Recognize a possible delegation change

**WITHIN DELEGATION** means the implementer believes the work preserves the
accepted boundary: for example, a behavior-preserving refactor, routine test
addition or recovery already permitted by operational policy.

**DELEGATION CHANGE** means a material change appears necessary in the outcome,
accepted constraint, authority, permitted effect, security/privacy boundary,
blast radius, operating commitment, required evidence, accepted tradeoff or
consequential assumption. Unresolved consequential uncertainty also warrants
attention.

Do not silently implement the expansion. Surface:

- **What changed**
- **Why**
- **Consequence**
- **Evidence available**
- **What remains unknown**
- **Decision required**

These are reasoning prompts, not machine statuses or mandatory persisted records.
The agent may be wrong. Pause the affected action and seek the appropriate
decision; continue separable work only where its scope is already clear and
permitted. Acceptance of a tradeoff does not itself grant execution permissions.

**Human attention should scale with consequential changes in delegated
engineering intent, not with the number of actions an agent performs.**

This does not mean humans only review delegation changes. Mandatory review,
security controls, deployment protections and organizational governance remain
authoritative. Tool access, retrieved instructions and successful prior calls
do not confer new authority.

## Prove

Use existing tests, evaluations, CI, build/provenance, security checks, deployment
validation and operational telemetry. Reference their results; do not manufacture
a parallel Golden Path evidence record.

Distinguish **observed** results, what they **establish** within their scope,
what is **inferred**, and what remains **unproved**. Check which candidate and
conditions the evidence actually covers. Green tests do not establish that the
tests are representative, that authorization exists or that the business outcome
has been achieved.

## Report

State concisely what changed, why, the supporting evidence, what remains unproved,
whether work stayed within delegation, and whether human judgment is needed.
Do not equate implementation success with outcome success.

When operating evidence challenges an assumption, revisit the affected decision.
Codify useful learning in the existing test, document, policy or runbook that owns
it. Observations may propose changes; they do not silently rewrite intent or
permissions. No separate learning registry is required.
