# Evaluation Design

Load to define proof before implementation. This expertise grants no execution
or data-access authority.

1. Begin with acceptance metrics and requirement IDs. Define a falsifiable check.
2. Use deterministic tests for invariants and behavioral evaluations for judgment.
   Contract fixtures are not observations of Copilot behavior.
3. Cover typical success, missing/ambiguous intent, edge/failure cases, regressions,
   prompt injection, authority denial and human override without sensitive payloads.
4. Evaluations own tested requirement/capability IDs, method, scenarios, pass
   criteria and procedure. Do not duplicate coverage on the targets. Add repeat
   counts and statistical thresholds only when a reliability requirement earns them.
5. Evidence owns its evaluation link, subject revision/content hash, timestamp,
   result, environment, observations and accessible location. Preserve redacted
   input/output, exposed model/configuration versions and human scoring at that
   location. Local reviewed files are valid; never invent a hosted URL.
6. An operational evaluation owns signal, operator and retention. Derive workload
   and outcome from its requirements; evidence inherits that scope via the evaluation.
7. Separate planned from executed proof. Failures/inconclusive results remain
   evidence. Verify authorization at the execution boundary when it exists.

Use [the A-F rubric](../../../../evaluations/bootstrap.md). Passing `npm test`
does not execute those fresh-session behavioral scenarios.