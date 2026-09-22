# Architecture Review

Load when complexity, composition or an architectural assumption changes.
This procedure grants neither approval nor execution authority.

1. Trace outcome, workload, requirement, decision, capability, implementation and
   proof using derived views. Ask **What requirement earns this?** and what can
   be removed. Do not cite an implementation-shaped requirement as its own proof.
2. Compare the strongest simpler alternative, not merely an obviously inadequate
   one. Check its acceptance behavior before declaring it insufficient.
3. Require unmet requirement, simplest viable/selected options, capability gained,
   alternatives, simpler-option assessment, operational cost and evidence/reasoning.
4. Distinguish expertise, tool, workflow, context, authority and reasoning
   boundaries. Topic count earns neither skill count nor agent count.
5. Review failures, lifecycle/ownership, reversibility, security and evaluation
   cost. Extra agents need execution/context/authority/lifecycle/parallelism/
   control requirements; concurrency needs bounded join and failure behavior.
6. Check relationship ownership. Do not maintain reverse links or transitive
   lists as parallel authority. Diagrams and indexes are derived views.
7. Separate proposed and approved decisions. Active implementation needs approved
   governing decisions; approval authenticity remains a human responsibility.
8. Return risk-ordered findings, requirements, alternatives and missing proof.
   Recommend reject, revise or review; never manufacture approval.

Run [validation](../../../../scripts/validate.mjs). A structural pass does not
prove minimality. The [first evolution decision](../../../../engineering/adr-bootstrap-minimum.json)
records exactly this distinction.