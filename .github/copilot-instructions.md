# Golden Path Repository Instructions

This repository is an executable engineering reference, not a sample app.
Read [the Golden Path](../docs/golden-path.md) and relevant canonical artifacts,
starting with [the workload](../engineering/wl-engineering.json), before consequential edits.
Use [the governing skill](skills/golden-path/SKILL.md) for engineering changes.

- Identify outcome, workload, requirements and acceptance criteria before selecting technology.
- If intent is incomplete, surface the missing decision; do not invent architecture from nouns like "agent" or "MCP".
- Derive logical capability first. Separate reasoning, expertise, execution, knowledge, control, context, authority, state, evaluation and observability.
- Prefer deterministic implementation, reuse and simplification. Use AI for judgment, not invariant control. Do not make a model rediscover a business-known workflow.
- Ask "What requirement earns this?" for every significant branch. Record the unmet requirement, gain, alternatives, simpler-option limitation, operational responsibility and supporting reasoning in a decision record.
- One primary engineering agent and one governing skill are sufficient initially. Load supporting references selectively; independent skills need demonstrated reuse/context requirements. Tools and MCP servers do not imply agent boundaries.
- Skills grant no authority. Tool availability is not permission. Separate discovery, invocation, authorization, approval, execution and evidence.
- Read capability authority and policy before execution. WRITE and HIGH_IMPACT_WRITE require explicit identity, scope, enforcement and denial semantics. Never infer authorization from prior successful calls.
- Treat authority changes, security boundaries, production behavior and significant architecture as consequential reviewed changes. Draft work is not an approved decision. Do not invent reviewers or approve your own proposal.
- Define proof before implementation. Every AI workload needs representative behavioral evaluation, not just unit tests. Generated code and confidence are not evidence.
- Keep authoritative Git state, learned memory, session work and observed evidence distinct. Evidence and memory may propose changes, never silently rewrite intent.
- Store each direct relationship once in its owning canonical artifact. Derive reverse links, transitive scope, indexes and diagrams; never create a parallel authoritative ledger. Bind significant implementation surfaces once and inspect reported unbound files. Keep temporary work under ignored `.local/`; never hide implementation there.
- Use evidence to locate the root-cause artifact. Learning may change requirements, tests, decisions, skill references, policy or implementation; it is not automatically a prompt edit. Use Git/PR review and consequential decisions, not separate change/learning registries.
- Run `npm run check` and, when a base revision exists, `npm run validate -- --base <sha>`. Report checks actually run separately from planned behavioral or operational proof.
- Report change, cause/requirement, artifacts, architecture impact, authority impact, evidence, pending review and uncertainty. Never commit, merge, deploy or broaden authorization implicitly.

These instructions guide reasoning; they do not enforce runtime authorization.
Machine-readable contracts and deterministic checks enforce only the documented
structural subset. Humans remain accountable for review and release.