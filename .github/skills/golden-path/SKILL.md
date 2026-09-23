---
name: golden-path
description: 'Use for outcome decomposition, capability selection, architecture and authority review, evaluation design, implementation or learning analysis. Follow the Golden Path and load only the relevant supporting references.'
---

# Golden Path

This skill supplies procedure, never authority. Use the governing
[protocol](../../../docs/golden-path.md) and typed
[artifact schema](../../../contracts/engineering.schema.json); do not treat memory as approval.
The [approved bootstrap decision](../../../engineering/adr-bootstrap-minimum.json)
explains why there is one skill and no centralized authoritative ledger.

1. **Identify:** Name the affected outcome and workload. Start with business
   benefit and constraints, not the requested technology. Framework state in
   `engineering/` governs how engineering is done; the adopter's project state
   lives in `project/`. If the request concerns the user's system and `project/`
   has no workload, the outcome is unknown: discover it, never adopt the framework's.
2. **Understand:** Read intended behavior, scenarios, failures and measurable
   acceptance criteria. Surface missing decisions before proposing architecture.
3. **Detect change:** Identify the new or changed requirement and its ID.
4. **Derive capability:** Consider deterministic implementation, instruction or
   context, skill, tool/API/MCP, model reasoning, deterministic workflow,
   persistent state, subagent, independent agent, additional autonomous
   authority. This is an order of consequence, not a mandatory ladder.
5. **Evaluate existing architecture:** Prefer reuse or simplification; separate
   capability need from composition. Recheck what earns retained complexity,
   including Golden Path itself; retention, consolidation, replacement and removal
   are valid outcomes. Known sequences belong in deterministic control.
6. **Apply the Branch Rule:** Record what requirement earns each branch, the
   capability gained, alternatives, simpler-option limitation, operational cost
   and evidence or reasoning. No justification means no branch.
7. **Determine authority:** Compare before/after classifications, identities,
   resource scope, approval and policy enforcement. Escalation is consequential.
   Missing or denied authority requires safe refusal; satisfied authority is not
   a reason to stop when an approved conforming capability can continue.
8. **Determine evidence:** Define a falsifiable proof before implementation:
   tests, behavioral evaluations, security/policy checks and operating signals.
9. **Record decisions:** Update contracts, proposed decisions and change reports.
   Use canonical decision artifacts and the normal Git/PR change report, not a
   separate change registry. Keep human approval explicit; never self-approve.
10. **Implement:** Make the smallest authorized change. Bind significant new
    implementation surfaces once; derive their workload and decision ancestry.
    Use deterministic adapters for known external sequences, within their
    declared authority ceiling, and preserve their actual result as evidence.
11. **Prove:** Run focused checks then required repository gates. Report failed,
    inconclusive and unrun evaluations honestly.
12. **Report:** Explain what changed, why/requirement, artifacts, architecture,
    authority, evidence, remaining uncertainty and review needed.

## Progressive Intent and Scope

Before consequential work, establish the intended result, current deliverable,
completion evidence and authorized scope. Use conversation and repository evidence
before asking questions. Ask only about unresolved choices that materially affect
the next step; proceed with clear, authorized work rather than requiring a full
intake questionnaire. Load [workload decomposition](./references/workload-decomposition.md)
when intent or scope needs clarification.

When a request names a technology, service or region but leaves the workload
unknown, first ask what problem it should solve and for whom. Preserve supplied
constraints; do not substitute a choice of IaC versus deployment, runtime/SKU
selection or an authorization questionnaire for outcome discovery. Check authority
before effects, but missing execution authority does not prevent safe discussion
of intent. If intent is already established, do not ask for it again.

A request for an artifact may not describe the full outcome; a possible downstream
need is not automatically in scope. Distinguish explanation, local implementation
and operational execution without requiring the user to know those categories.
Do not substitute a snippet for an agreed saved implementation or add deployment
to a request for an example.

Revisit the working understanding when new information changes the goal, behavior,
risk, deliverable or authority. Preserve settled decisions; ask about the changed
part, not the whole task again. Briefly confirm scope at meaningful implementation
or execution boundaries. Discussion, criticism and "why?" are not approval to
change or execute. Stop or narrow work immediately when directed.

## Selective References

Load only the reference needed for the current decision; do not load all six by default.

| When needed | Reference |
| --- | --- |
| Outcome, scope or acceptance is unclear | [Workload decomposition](./references/workload-decomposition.md) |
| A requirement needs a logical capability | [Capability selection](./references/capability-selection.md) |
| Complexity or composition is proposed | [Architecture review](./references/architecture-review.md) |
| Execution, identity, permission or scope changes | [Authority review](./references/authority-review.md) |
| Define proof before implementation | [Evaluation design](./references/evaluation-design.md) |
| Evidence or corrections suggest durable change | [Learning analysis](./references/learning-analysis.md) |

References are supporting expertise, not independent skills or authority grants.
Extract another skill only when independent reuse/invocation or demonstrated
context needs earn it. Persist consequential reasoning, not every session note.