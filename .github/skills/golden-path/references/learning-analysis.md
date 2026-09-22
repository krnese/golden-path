# Learning Analysis

Load for recurring corrections, observations or evaluation failures that may
change an enduring artifact. Learning grants no authority to rewrite intent.

Follow Observe -> Evaluate -> Learn -> Hypothesize -> Propose -> Human decision ->
Implement -> Prove -> Codify. Golden Path itself is a workload for this loop.

1. Preserve observation and context, including failed/inconclusive evidence.
   Trace evaluation, capability, requirement, workload and outcome.
2. Check representativeness, reproducibility, alternative explanations and whether
   intent was correct. Memory and anecdotes are not approved requirements.
3. Locate the artifact owning the root cause:

| Source | Enduring artifact |
| --- | --- |
| Incorrect intent | Workload/requirement |
| Incorrect architectural assumption | Decision |
| Procedural deficiency | Governing skill/reference |
| Missing context | Instruction/context |
| Missing execution capability | Tool/API/MCP contract and implementation, when earned |
| Control deficiency | Deterministic workflow/policy |
| Composition deficiency | Agent decision |
| Missing detection | Test/evaluation |
| Implementation defect | Code |
| Missing operational visibility | Observability requirement/implementation |

4. Form a falsifiable hypothesis and compare adding, changing, retaining,
   consolidating, replacing or removing the affected mechanism. Existing
   architecture must still earn its complexity; no change is a valid conclusion.
   Use a consequential decision when architecture/authority changes; use normal
   Git/PR reporting for scope, evidence and affected IDs. No separate learning registry.
5. Define discriminating proof before implementation. Obtain the appropriate human
   decision before consequential changes, implement only the authorized scope and
   compare with baseline. Do not rewrite acceptance to hide a failure. Preserve
   failed hypotheses; do not implement artificial changes for a retention decision.
6. Request review and report actual changed artifacts and remaining uncertainty.
   Codification preserves reviewed reasoning in the owning artifacts or existing
   review history, including why something was retained or removed; a status field
   is not proof. Remove obsolete implementation and update current bindings when
   authorized, while preserving historical decisions through Git. I13 remains a
   human review responsibility.

The [bootstrap evolution](../../../../engineering/adr-bootstrap-minimum.json)
preserves rejected reasoning without retaining obsolete implementation. Do not
create a runtime self-editing agent. Memory remains useful, non-authoritative context.