# Architecture Review

Load when complexity, composition or an architectural assumption needs review,
including whether previously approved architecture remains justified.
This procedure grants neither approval nor execution authority.

1. Trace outcome, workload, requirement, decision, capability, implementation and
   proof using derived views. Ask **What requirement earns this?** and what can
   be removed, including within Golden Path itself. Re-evaluate existing mechanisms
   against current requirements, constraints, evidence and operating cost; prior
   approval does not establish continuing necessity. Do not cite an
   implementation-shaped requirement as its own proof.
2. Compare the strongest simpler alternative, not merely an obviously inadequate
   one. Check its acceptance behavior before declaring it insufficient.
3. Require unmet requirement, simplest viable/selected options, capability gained,
   alternatives, simpler-option assessment, operational cost and evidence/reasoning.
4. Keep the logical responsibilities in
   [capability selection](capability-selection.md) distinct from runtime topology.
   Topic count earns neither skill count nor agent count; current bootstrap
   bindings are not universal architecture requirements.
5. Review failures, lifecycle/ownership, reversibility, security and evaluation
   cost. Extra agents need execution/context/authority/lifecycle/parallelism/
   control requirements; concurrency needs bounded join and failure behavior.
6. Check relationship ownership. Do not maintain reverse links or transitive
   lists as parallel authority. Diagrams and indexes are derived views.
7. Separate proposed and approved decisions. Active implementation needs approved
   governing decisions; approval authenticity remains a human responsibility.
8. Return risk-ordered findings, requirements, alternatives and missing proof.
   Recommend addition, change, retention, consolidation, replacement or removal
   as justified; no change is a valid result. For removal, identify affected
   behavior, controls, references and proof; fewer components alone is not success.
   Preserve historical rationale in Git and decisions, not obsolete implementation.
   Recommend reject, revise or review; never manufacture approval.

Run [validation](../../../../scripts/validate.mjs). A structural pass does not
prove minimality. The [first evolution decision](../../../../engineering/adr-bootstrap-minimum.json)
records exactly this distinction.