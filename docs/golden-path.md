# Golden Path Governance

## An Executable Engineering System

The Golden Path applies to the system producing software as well as the software
it produces. Agents may help define plans, build implementations, run tests,
evaluate behavior and propose evolution. Humans remain responsible for intent,
constraints, architectural decisions, granted authority and the resulting system.
Agentic engineering is not a requirement that every resulting application use AI.

The lifecycle introduced in the [README](../README.md) is an engineering loop,
not a prescribed runtime topology. Decomposition identifies bounded workloads;
requirements and acceptance criteria earn logical capabilities before architecture
is selected. Build and proof connect implementation to those decisions. Release
controls govern the transition to operation; operating evidence informs learning.
Reuse means carrying forward justified capabilities, procedures and expertise,
not copying an architecture whose requirements no longer apply.

Reasoning, expertise/skills, executable capabilities/tools/MCP, knowledge, context,
authority, state, policy/control, evaluation and observability are distinct from
the runtime topology implementing them. The doctrine must remain usable across
current and future agent runtimes. Copilot discovery paths, tool names and CI
bindings implement this bootstrap; they are not universal lifecycle requirements
or a claim of compatibility with every runtime. Replacing a binding must preserve
the applicable authority, traceability and proof obligations, not its topology.

The repository demonstrates this discipline with versioned artifacts, a governing
procedure, deterministic validation and defined behavioral evaluations. Its
[coverage limits](invariants.md) distinguish those mechanisms from controls and
outcomes that still need human review or operational evidence.

## Purpose and Principles

The repository itself is the reference implementation. The initial workload is
human-accountable repository engineering, not a business application architecture.
Future workloads can be deterministic, AI-assisted, or agentic only as earned.

1. **Outcome before implementation.** Determine benefit and workload before
   choosing technology; nouns such as "agent" do not justify architecture.
2. **Workload before technology.** Derive capability from requirements, never
   reverse-engineer requirements to justify a selected product.
3. **Capability does not define composition.** Separate reasoning, procedural
   expertise, executable capability, knowledge, control, context, authority,
   state, evaluation and observability.
4. **Expertise is not agency.** Use one governing skill with selective references;
   independent skills need demonstrated reuse/context requirements. Neither grants authority.
5. **MCP is a capability boundary.** Multiple servers do not imply multiple agents.
6. **Agent boundaries must be justified.** Execution, context, authority,
   lifecycle, bounded parallel reasoning or otherwise-inexpressible control may
   earn a boundary. Job titles and capability count do not.
7. **Workflows control; agents reason.** Known sequences use deterministic
   control. Do not make the model discover steps the business already knows.
8. **Use AI for judgment.** Use deterministic systems where behavior must be invariant.
9. **Authority is explicit.** Tool availability grants nothing. Separate discovery,
   invocation, authorization, approval, execution and evidence.
10. **Humans remain accountable.** Consequential architecture, authority,
    security and production changes remain explicitly reviewable.
11. **Evaluate evidence, not confidence.** Generated implementation is not proof;
    reasoning behavior needs representative evaluations.
12. **Architecture follows evidence.** Production observations can challenge
    assumptions and earn evolution, not silently alter intended state.
13. **Learning is codified.** Appropriate requirements, tests, evaluations, skills,
    instructions, policy, decisions or implementation are retained or changed
    through review according to evidence, not a requirement to produce more artifacts.

## Earned Architecture

**Complexity must be earned continuously.** Ask "What requirement earns this?"
for existing as well as proposed capabilities and boundaries. Changed requirements,
constraints, evidence or operating costs can invalidate an earlier justification;
prior approval is not permanent proof of necessity. Compare against the strongest
simpler alternative, including reuse and removal, rather than assuming more
composition is progress. Golden Path itself, including its governance artifacts
and checks, is subject to this review. Removal must still preserve required
behavior and controls; fewer components alone is not proof of improvement.

The following distinctions guide selection; they are not stages every workload
must traverse or new contract categories:

| Need established by a requirement | Simplest candidate to consider |
| --- | --- |
| Exact, repeatable behavior is sufficient | Deterministic implementation |
| Judgment or interpretation is needed | Bounded model reasoning |
| Reasoning needs independent context | Isolated reasoning with a bounded input/output contract, not necessarily an agent |
| Reasoning needs specialized knowledge | Reusable domain expertise/context |
| A reusable procedure needs independent invocation semantics and a stable contract | A skill |
| A bounded delegated goal needs adaptive multi-step execution, private working context, capability selection and its own lifecycle | A subagent |
| A workload needs additional effects on resources | Explicitly justified and governed authority, independent of agent count |

**This is not a maturity model. Higher complexity is not better. Stop at the
lowest level that satisfies the workload.** These options can be combined only
as needed. Capability count does not imply agent count, reasoning does not imply
agency, tools do not imply agents, and context separation does not automatically
imply agent separation. A known multi-step procedure can be a deterministic
workflow; specialized knowledge can be context rather than a separately invoked
skill. Neither requires a new actor.

For example, evidence that sequential independent investigations miss a latency
requirement can earn concurrency, but not automatically subagents. Compare
concurrent deterministic calls with independent reasoning workers. Define bounded
dispatch, deadlines, cancellation, aggregation and partial-failure behavior;
measure end-to-end latency, quality and cost. Parallel execution is a hypothesis
to test, not proof that a target will be met or permission to add remediation
authority. No particular agent count or speedup is a universal result.

## Branch Rule

Each significant branch needs a canonical `decision` artifact with requirement
IDs, unmet requirement, simplest viable option, selected option, capability gain,
alternatives, simpler-option assessment, operational responsibility and reasoning.
The simpler option may be sufficient: the rule must permit simplification.

[The first evolution decision](../engineering/adr-bootstrap-minimum.json) is the
authoritative account of the bootstrap review and approval. It preserves why
seven independent skills, a central ledger, mirrored relationships and extra
registries were rejected. It also justifies the retained agent, procedure,
typed artifacts, validator, tests and minimal CI. This document explains the
mechanism; it does not maintain a second set of decision statuses or relationships.

`proposed` is not `approved`. Approval records attribution, date, source,
statement and scope. The actual user approval is preserved in the decision;
there is no fabricated PR URL or claim of authenticated identity. Future reviews
should attach their durable source. Approval authenticity remains human-reviewed.
Active implementations require approved decisions derived through capabilities.
Draft prototypes stay explicitly draft; production implementations cannot be draft.
`active` describes repository use, not release, behavioral proof or blanket authority.

For a consequential change, create a new decision and preserve prior reasoning
through Git and decisions. Do not retain obsolete implementation as documentation.
The original bootstrap was uncommitted; this migration does not manufacture a
historical commit. The approved decision preserves its architectural reasoning.

## Change Protocol

Before implementation: (1) identify outcome/workload; (2) understand intent and
acceptance; (3) identify changed requirements; (4) derive logical capability;
(5) evaluate reuse/simplification; (6) apply the Branch Rule; (7) determine
authority impact; (8) define proof; (9) record consequential decisions.
Then (10) implement the scoped change; (11) prove; (12) report.

Intent discovery continues throughout the conversation. Establish the current
deliverable, completion evidence and authorized scope, using supplied answers and
safe repository discovery before asking focused questions. Revisit only affected
decisions when intent or evidence changes; proceed without unnecessary intake
when work is clear. An artifact request does not automatically mean a chat example
or authorize downstream deployment. Discussion and critique are not execution
approval; stop or narrow work when directed. The
[workload decomposition reference](../.github/skills/golden-path/references/workload-decomposition.md)
owns the detailed procedure.

Apply the [earned-architecture distinctions](#earned-architecture) to capability
and composition choices. Tools, workflows, persistent state and independent
agents also need justification; their availability is not a requirement.

Use Git/PR reporting for owner, affected IDs, before/after authority, evidence
and next action. There is no parallel change or learning registry. Working tasks
stay in the session or `.local/`; consequential decisions belong in canonical
artifacts. Use the [PR template](../.github/pull_request_template.md) for review.

Report what changed, why/requirement, artifacts, architecture impact, authority
impact, observed proof, remaining uncertainty and review needed. Keep planned
checks separate from evidence actually obtained.

## State Model

Separate what supplies expertise, what records intent, what realizes it, and what
tests it. These responsibilities are distinct even when all are versioned in Git.

| Responsibility | Meaning |
| --- | --- |
| Skills | Reusable procedural knowledge: how to perform a class of work; not authoritative engineering intent or an authority grant |
| Domain expertise/context | Reusable knowledge relevant to reasoning, not necessarily independently invocable |
| Engineering state | Authoritative, versioned statements of what has been decided about the engineered system and why; proposals remain visibly distinct |
| Implementation | Software and configuration realizing those decisions, including agent definitions and executable controls where justified |
| Evidence | Observations of what actually happened and whether requirements were satisfied; not approval or desired state |

An engineering artifact may govern the use of a skill or bind an implementation
to a decision. That record does not make the skill's procedural text or the
implementation itself the source of approved requirements. The following state
boundaries describe provenance and promotion, not additional artifact kinds:

| State | Meaning | Location and promotion |
| --- | --- | --- |
| Authoritative engineering | What we decided must be true and how it should be evaluated; proposals visibly distinct | Versioned canonical outcomes, workloads, requirements, decisions, capability/policy declarations and evaluation plans; reviewed relationships to skills, agents and implementation |
| Learned | What Copilot learned about the repository | Repository memory when available; not authoritative; promote consequential facts through evidence-backed changes |
| Working/session | What humans and agents are investigating or changing | Session, issues/PRs, ignored `.local/`; no automatic persistence as doctrine |
| Observed/evidence | What actually happened | CI/evaluation/operational records with revision and provenance; may propose but never silently redefine intent |

Approved intent and proposed intent coexist in Git with explicit statuses; mere
presence in Git does not make a proposal approved. Evidence references can be
reviewed in Git, but observations remain observations, never implicit decisions.
Memory availability is optional and introduces no runtime store.

## GitHub as an Engineering System of Record

Source history records **what changed, its attributed author and when**. Versioned
engineering intent and single-owner relationships let this repository additionally
expose:

- Why does this architecture exist?
- Which requirement earned each capability or boundary?
- What authority does it possess?
- What assumptions, alternatives and decisions produced it?
- What evidence demonstrates that it works?
- What would be affected if a requirement changes?
- Why was a mechanism retained, consolidated, replaced or removed?

Requirements, decisions, scoped authority and evaluation/evidence references
provide the reasoning behind the implementation. Derived traceability supports
impact analysis; Git and review history preserve its evolution. Connected
artifacts expose an argument to inspect, not proof that its reasoning is sound
or its business outcome achieved.

This is the repository's architectural model for using GitHub as an engineering
system of record for both **what** and **why**. It is not a claim that GitHub
automatically understands architecture, authenticates evidence or provides these
semantic guarantees as a product feature.

## Contracts and Traceability

The closed [schema](../contracts/engineering.schema.json) defines eleven artifact
kinds. Each file in `engineering/` contains one artifact and is named for its
stable `id`; `schemaVersion` is 2. Discover files deterministically without a
manifest. Git commits version the coherent set; there is no graph database,
central ledger, automatic repair or committed authoritative index.

Relationship ownership is part of the contract:

| Owner | Direct relationship | Derived, not stored on the target |
| --- | --- | --- |
| Workload | `outcomeId`; local acceptance criteria | Outcome's workloads |
| Requirement | `workloadId`, workload-local `acceptanceIds` | Workload's requirements and evaluated criteria |
| Decision | `requirementIds`; optional supporting `evidenceIds` | Governing workload and requirements' decisions |
| Capability | `decisionId`; applicable `policyId` | Requirements/workload; policy's capabilities |
| Implementation | `capabilityIds`, exact file paths | Governing decisions/requirements/workload |
| Evaluation | Requirements it tests and capabilities it exercises | Capability/requirement evaluation coverage and workload |
| Evidence | `evaluationId` | Workload/outcome and evaluation's observed runs |
| Policy | Requirements it constrains | Workload and consuming capabilities |
| Agent | Capabilities it can use and discovery path | Governing decisions/requirements/workload |
| Skill | Governing decision, discovery path and reference files | Purpose and workload |

Evaluation requirement links express the tested obligations; capability links
express the exercised surface. These are distinct direct relationships, not
two authorities for the same edge. Likewise, a decision's optional authority
change declaration is a historical transition, not a reverse capability index.
Do not add workload IDs or decision lists where ancestry already determines them.
All non-outcome artifacts currently derive exactly one workload; separate
cross-workload responsibilities until a requirement earns a shared contract.

`npm run trace -- <id>` constructs the graph and prints labeled direct edges in
the connected component, traversable in both directions. Indexes and transitive
workload resolution exist only in memory; rendered views are non-authoritative.
Reverse navigation does not require storing reverse links. Connectedness is
not proof of causal correctness.

Create outcome/workload and requirements, then decisions, capabilities and
evaluation plans before implementation. Unfinished proposals may fail full
validation while being edited; complete typed references before review/merge.
Use the schema as the shape reference. Never copy synthetic test evidence or
fixture approvals into authoritative artifacts.

Significant files have a single implementation/agent/skill binding. Canonical
artifact files identify themselves and need no separate registry. Missing paths,
duplicate path owners, unsafe paths, unbound recognized executables, workflows,
agents and skills fail validation. Other unbound files are reported for review,
not automatically forbidden. A binding demonstrates traceability, not necessity.
Excluded root directories are `.git`, `node_modules`, `.local`, `coverage`.
Symlinks are rejected. Hidden capabilities inside existing source or unsupported
file types still require human review; do not hide code in exclusions.

## Authority

**Use AI for what requires judgment. Use deterministic systems for what must
remain invariant.** Agents may reason, investigate, propose and execute within
granted authority. Known workflows belong in deterministic control rather than
model-discovered sequences.

Where applicable, schemas, capability allowlists, identity/resource scope,
limits, validation, policy and release gates should be enforced mechanically.
Prose can explain an invariant but is not a substitute for enforcement. This
repository checks a documented structural subset; it does not supply a general
runtime authorization system. See [invariant coverage](invariants.md).

Governance is not a requirement for human approval of every operation. It
establishes reviewed boundaries within which agents can work quickly and
increasingly autonomously. Policy approval is not the absence of authorization,
and autonomy does not remove human accountability.

| Classification | Effects |
| --- | --- |
| READ | Inspect permitted resources without mutation |
| RECOMMEND | Analyze and advise, no applied change |
| PROPOSE | Produce a proposed change without activation |
| WRITE | Mutate explicitly authorized scoped resources |
| HIGH_IMPACT_WRITE | Consequential, privileged, production or hard-to-reverse mutation |

WRITE and HIGH_IMPACT_WRITE require identity, authorization principal/scope,
enforcement and denied behavior plus policy. Policies declare rules, approval
mode/rationale/enforcement, failure handling and observability. High-impact
operations cannot use `none` approval. Automated policy approval may be proposed
only with justification; humans decide its adequacy and where human approval is mandatory.

The initial local WRITE scope is requested repository editing and isolated test/CI
scratch writes under the user's request. It excludes merge, push, deployment,
publishing, cloud writes, permission changes and access to secrets. Terminal tool
access is not a sandbox or a substitute for runtime authorization. Future
external capabilities must earn actual identity and enforcement mechanisms.

`--base <sha>` discovers canonical artifacts at the Git base and compares stable
capability IDs. Changes to classification, identity, boundary, authorization or
policy reference need a new governing decision with an `authorityChanges`
declaration; active implementations require that decision to be approved.
There is no old-ledger compatibility layer: an incompatible base fails visibly
and requires explicit migration review; a base with no artifacts is bootstrap.
Renamed/deleted IDs, policy-body changes and hidden execution effects can evade
surface comparison. Review the full diff. CI neither authenticates approval nor
acts as an authorization server. Declaring a capability never grants permission.

Changing recommendation into automatic remediation changes effects from
RECOMMEND to WRITE, potentially HIGH_IMPACT_WRITE. Evidence justifying faster
investigation does not justify this authority transition. Before execution,
define exact actions, identity, scope, policy approval, fail-closed denial,
idempotency, timeouts, partial-failure handling, recovery and auditable results
at the actual execution boundary. Model confidence is not authorization.

## Prove, Release and Run

**Evaluate evidence, not confidence.** Define proof before building, and keep
three questions distinct:

| Form of proof | Question | Appropriate evidence |
| --- | --- | --- |
| Implementation correctness | Does the implementation behave according to its contract? | Deterministic tests and, where judgment is involved, representative behavioral evaluations |
| Engineering alignment | Does the implementation remain consistent with authoritative engineering state and decisions? | Structural validation, traceability, base-revision checks and semantic architecture/authority review |
| Outcome evidence | Does the system improve the workload or business outcome? | Measured acceptance results against a relevant baseline, with quality guardrails, operating conditions and attributable observations |

These are conceptual proof obligations, not replacements for the schema's
evaluation kinds. A passing test can support correctness without establishing
alignment or business benefit. A structural pass cannot establish architectural
necessity; model confidence cannot establish correctness. Report failures,
inconclusive results and unexecuted evaluations separately from observed success.

`npm run check` runs schema, derived-relationship, policy-shape, file-binding and
customization discovery checks followed by deterministic regressions. CI also
compares the base revision and runs `npm audit --audit-level=moderate`.
Dependency audit requires registry access and is not a comprehensive security scan.
Review validator/schema/workflow changes carefully: a PR can weaken its own gates.

The behavioral [bootstrap rubric](../evaluations/bootstrap.md) must be exercised
with Copilot and reviewed by a human. Tests using synthetic contracts only prove
validator behavior, not model behavior. No hosted model runner is justified yet.

Before activation/release: review decisions, authority and proof; run workload
tests and applicable security/behavioral evaluations; ensure production workloads
declare operational signals, retention and owner; define rollout, failure,
rollback and on-call responsibilities in the earned workload artifacts. No
generic deployment scaffold exists until a deployment requirement earns one.
`active` is a declared engineering state, not evidence that a release occurred.

Evidence artifacts contain evaluation ID, subject revision, UTC timestamp,
result, environment, observations and an accessible retained location. That may
be a reviewed repository file or a durable review/CI URL; no hosted service is
required. Keep raw transcripts/results there, not mirrored into intent fields.
Record redacted input/output, model/configuration where relevant and reviewer
assessment. When uncommitted files are tested, record a content/diff hash that
includes untracked files; HEAD alone does not identify the tested subject.
Never invent evidence, reviewers or URLs.

Production evidence must reference an operational evaluation, which owns signal,
owner and retention. Its workload/outcome are derived. Operators
must define retention/access and practical outcome correlation before production.
CI logs use repository retention settings; administrators should set a suitable
retention policy (initial recommendation: 90 days). Only evidence references
are proposed into Git; no bot commits observations or rewrites contracts.

## Golden Loop

The governed engineering loop applies to workloads and to Golden Path itself:

Observe -> Evaluate -> Learn -> Hypothesize -> Propose -> Human decision ->
Implement -> Prove -> Codify

This is a conceptual lifecycle, not an installed automation, a runtime topology
or a replacement for artifact statuses. Define proof before implementation;
authorized investigation or draft experiments may inform the human decision.
Consequential implementation requires the appropriate approval before execution,
and resulting proof remains subject to review before codification. Merge and
deployment apply only when needed and remain separately authorized.

The loop may add, change, retain, consolidate, replace or remove architecture.
A justified no-change conclusion is valid: preserve its rationale in the existing
review history without manufacturing implementation work or a new registry.
Prior decisions remain explainable through Git and consequential decision records
even when their implementation is removed or superseded. Do not retain obsolete
code or dangling current bindings merely to preserve history.

Recurring corrections and operating evidence may reveal incorrect requirements,
architecture assumptions, procedures, context, capabilities, control,
composition, detection, code or visibility. Load the governing skill's learning
reference to target the owning artifact. Prompt changes are one possibility.

Use evidence, a hypothesis, retained or changed owning artifacts, proof and human review.
Architectural learning belongs in a consequential decision; other learning may
belong in a requirement, test, policy, reference or code. Do not add a learning
record solely to say learning occurred. I13 is advisory at bootstrap: reviewers
inspect the rationale, any diffs and results rather than trusting a `codified` status field.

No runtime self-improvement agent, background writer, hook or external integration
is installed. Proposed improvements pass through the same software engineering
controls as any other change. The goal is self-improving engineering, not an
unconstrained runtime system rewriting itself. Learning may challenge desired
state, but must not silently redefine it. Reuse the reviewed lesson or capability
where its requirements apply; do not turn a local observation into a universal
architectural rule.