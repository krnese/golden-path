# Learning Analysis

Load for recurring corrections, observations or evaluation failures that may
change an enduring artifact. Learning grants no authority to rewrite intent.

Follow Observe -> Evaluate -> Learn -> Hypothesize -> Propose -> Prove -> Review -> Codify.

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

4. Form a falsifiable hypothesis and propose the smallest artifact change. Use a
   consequential decision when architecture/authority changes; use normal Git/PR
   reporting for scope, evidence and affected IDs. No separate learning registry.
5. Add discriminating proof, make the authorized change and compare with baseline.
   Do not rewrite acceptance to hide a failure. Preserve failed hypotheses.
6. Request review and report actual changed artifacts and remaining uncertainty.
   Codification means the owning artifact changed through review, not that a
   status field says it did. I13 remains a human diff-review responsibility.

The [bootstrap evolution](../../../../engineering/adr-bootstrap-minimum.json)
preserves rejected reasoning without retaining obsolete implementation. Do not
create a runtime self-editing agent. Memory remains useful, non-authoritative context.