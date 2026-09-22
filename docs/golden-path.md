# Golden Path Governance

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
    instructions, policy, decisions or implementation must change through review.

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

Consider, in increasing architectural consequence: deterministic implementation,
instruction/context, skill, tool/API/MCP, model reasoning, deterministic workflow,
persistent state, subagent, independent agent, additional autonomous authority.
This is not a mandatory maturity ladder. Higher is not better.

Use Git/PR reporting for owner, affected IDs, before/after authority, evidence
and next action. There is no parallel change or learning registry. Working tasks
stay in the session or `.local/`; consequential decisions belong in canonical
artifacts. Use the [PR template](../.github/pull_request_template.md) for review.

Report what changed, why/requirement, artifacts, architecture impact, authority
impact, observed proof, remaining uncertainty and review needed. Keep planned
checks separate from evidence actually obtained.

## State Model

| State | Meaning | Location and promotion |
| --- | --- | --- |
| Authoritative engineering | What we decided must be true; proposals visibly distinct | Git contracts, requirements, decisions, policies, evaluations, skills, agent definitions and implementation |
| Learned | What Copilot learned about the repository | Repository memory when available; not authoritative; promote consequential facts through evidence-backed changes |
| Working/session | What humans and agents are investigating or changing | Session, issues/PRs, ignored `.local/`; no automatic persistence as doctrine |
| Observed/evidence | What actually happened | CI/evaluation/operational records with revision and provenance; may propose but never silently redefine intent |

Approved intent and proposed intent coexist in Git with explicit statuses; mere
presence in Git does not make a proposal approved. Evidence references can be
reviewed in Git, but observations remain observations, never implicit decisions.
Memory availability is optional and introduces no runtime store.

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

## Prove, Release and Run

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

Observe -> Evaluate -> Learn -> Hypothesize -> Propose -> Prove -> Review -> Codify.

Recurring corrections and operating evidence may reveal incorrect requirements,
architecture assumptions, procedures, context, capabilities, control,
composition, detection, code or visibility. Load the governing skill's learning
reference to target the owning artifact. Prompt changes are one possibility.

Use evidence, a hypothesis, changed owning artifacts, proof and human review.
Architectural learning belongs in a consequential decision; other learning may
belong in a requirement, test, policy, reference or code. Do not add a learning
record solely to say learning occurred. I13 is advisory at bootstrap: reviewers
inspect actual diffs and results rather than trusting a `codified` status field.

No runtime self-improvement agent, background writer, hook or external integration
is installed. Proposed improvements pass through the same software engineering
controls as any other change.