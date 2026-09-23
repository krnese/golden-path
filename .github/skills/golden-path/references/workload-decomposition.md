# Workload Decomposition

Load when outcome, scope, failure conditions or acceptance is unclear.
This reference supplies expertise, never authority.

1. Identify the intended result, beneficiary, accountable owner and constraints.
   Establish baseline, target and measurement window when relevant to the outcome;
   a small artifact task may need only concrete correctness criteria. Do not
   invent business metrics or make assumptions authoritative.
2. Decompose by observable responsibility and input/output boundary, not job
   titles, tools or agents. Name representative success, degraded conditions,
   misuse, failure outcomes and explicit non-goals.
3. Identify input/output, data sensitivity, dependencies, latency/quality/cost
   targets, reversibility and operational owner.
4. Define measurable workload criteria, then requirements referencing them.
   Evaluations own their tested requirement/capability links; do not copy those
   links onto the workload or capability.
5. Identify actions/resources, authority, identity, approval and failure handling
   without granting permission. Decide what evidence will prove correctness.
6. Mark `usesAI` for actual reasoning behavior, including this repository's
   engineering assistance. It does not prescribe runtime AI.
7. Return outcome/workload/requirement IDs, knowns, open decisions, non-goals and
   proof. Do not select technology before deriving the capability need.

Use [the schema](../../../../contracts/engineering.schema.json). A workload
requiring no judgment should remain deterministic. The user's workloads are
recorded in `project/`; `engineering/` holds Golden Path's own framework workload.

## Discover Intent Progressively

Use this procedure for scripts, templates, application changes, investigations and
automation alike. A requested technology or artifact is useful context, not a
complete statement of intent. Do not challenge an explicit technology constraint
without a concrete reason.

Maintain a lightweight working understanding in the conversation/session:

| Dimension | Establish when relevant |
| --- | --- |
| Outcome | What should become easier, possible or correct, and for whom? |
| Behavior | Inputs, outputs, selection rules, exceptions and failure handling |
| Deliverable | Explanation/example, saved implementation, integration or operational result |
| Context | Existing implementation, platform, conventions, dependencies and constraints |
| Authority | Permitted reads, local changes, configuration, publication and execution |
| Completion | Observable acceptance criteria and the evidence needed to demonstrate them |
| Unknowns | Unresolved decisions, provisional assumptions and what blocks the next step |

These are reasoning prompts, not mandatory questions or a new authoritative
ledger. Use canonical artifacts for durable intent when needed; keep tentative
understanding in session context. Apply existing contracts and review rules
proportionately without inventing architecture for a small task.

### Persist the Adopter's Project State

The user's project state belongs in `project/`, one JSON artifact per stable ID
using the same schema as `engineering/`. At the early intent threshold below,
persist the smallest valid chain so another session can reconstruct it: outcome,
workload, requirement, a `proposed` decision, a logical capability and the
evaluation that will prove it. This initial state is a working understanding that
becomes more precise as requirements and evidence emerge; it does not wait for
future design concerns to be resolved. Record assumptions as assumptions, never as
approved architecture. Handle these artifacts yourself and describe what you
recorded in plain language; the user should not need to know the artifact types.
The canonical engineering model is a persistence model, not an interaction model:
repository completeness must not become conversational completeness.
Keep the adopter's manifests, scripts, dependencies and tool configuration inside
its bound implementation directory. Do not edit framework-owned files (root
`package.json`, `package-lock.json`, `.gitignore`, `README.md`, `.github/`) for the
adopter's needs; if a change there is genuinely required, say so and treat it as a
framework change the user must approve. Record evidence only for observations
another participant can retrieve; session output is not evidence (see the
[evaluation design](evaluation-design.md) reference).
Never mark a project decision
`approved` without the user's explicit approval, and never cite framework decisions,
policies, requirements or evaluations from project artifacts: framework provenance
is not project authority. Bind implementation by directory (for example `src/`)
rather than listing every file. V0.1 cannot represent project-owned `agent` or
`skill` artifacts; if the system being built contains agents, record them as
capabilities and implementation for now and name this limitation.

### Ask the Next Material Question

**Questions are just-in-time dependencies of engineering decisions, not an intake
checklist.** Ask when the answer can materially change the next engineering
decision, safety or authority, handling of sensitive data, external effects,
significant cost or another consequential or irreversible choice. Otherwise prefer
a reasonable reversible assumption, state it briefly when useful, and continue.
The test is consequence and decision dependency, not topic: access control or a
data source can be immediately material for one workload and safely assumed for
another. A necessary question is better than a bad assumption.

1. Reuse answers already given and safely inspect relevant repository context.
   Do not ask the user for facts available through authorized, low-risk discovery.
2. Distinguish facts, explicit constraints and provisional assumptions. Surface
   uncertainty when it changes behavior, scope, risk or acceptance.
   A named technology, service, region or request to deploy is not by itself a
   workload outcome. When the problem and intended users are unknown, establish
   them before asking the user to choose implementation or delivery mechanics.
3. Establish what success means early for the user or business, proposing a
   measurable criterion when the user has not stated one. Keep that success
   distinct from derived system acceptance criteria, which may refine or
   operationalize it but must not silently redefine it. Once the outcome, the
   primary user or beneficiary, success and enough of the immediate deliverable
   are understood, summarize that working understanding in plain language. If it
   rests on a success criterion you inferred, or substantial implementation would
   follow and the requested deliverable is materially ambiguous, ask the user to
   confirm or correct it in that same message; otherwise continue. Then persist it
   before continuing into design questions. This is not a checklist: infer what
   the request already says, assume where safe, and ask only for what prevents a
   useful next step. "Build me a working local prototype", "help me design..." and
   "explain how I could..." are clear; "I want to build..." may not be, before
   substantial implementation.
4. Select the unresolved choice with the greatest effect on correctness, scope or
   risk that blocks the next useful step. Ask one focused question in plain
   language, with a recommended option when helpful. Explain why only when that
   helps the user decide, never in Golden Path terminology.
5. Incorporate the answer, preserve settled decisions and proceed with clear,
   authorized work. Defer questions that only affect a later stage.
6. Before substantial implementation or external execution, briefly state the
   agreed deliverable, important exclusions and proof. Do not request repeated
   approval for unchanged, already authorized work.

For "I want to deploy an App Service in Azure, swedencentral", retain App Service
and the region as supplied constraints and first ask what the application should
make possible and who will use it. Do not lead with IaC versus live deployment,
subscription/identity intake, runtime, pricing tier or a recommendation to prepare
templates. Those choices follow the relevant workload needs. Reading an authority
contract, including a tagged file, must not displace the missing outcome question.
Authority restrictions still block unauthorized effects; they do not require
refusing safe intent discovery. If the user already supplied the outcome and
behavior, skip this question and resolve only the next material gap. If execution
is the next step, apply the authority boundary before any external action.

For "I need a script to clean up files", discover what "clean up" means and which
files qualify before selecting a deletion mechanism. Establish whether the user
wants an example, a saved implementation or an executed result when that is
unclear. Do not assume deletion, scheduling or deployment. For a fully specified
request to save and test a local script, implement it without repeating intake.

### Reassess During the Conversation

Revisit the affected dimensions when the user changes the outcome, corrects an
assumption, introduces sensitive data, asks for unattended operation or external
execution, or when investigation/tests contradict the current understanding.
Explain the specific change and resolve only newly material unknowns.

For example, changing a local reporting script into a nightly job introduces
questions about runtime, identity, failure handling and operational ownership.
It does not implicitly authorize installing a scheduler or granting permissions.
Separate preparing an artifact from configuring identities/tools and executing
against real resources. Route authority changes through the existing
[authority review](authority-review.md).

Treat a request for explanation or critique as discussion, not permission to
implement a remedy. If the user says stop, stop task actions; do not finish a
pending write merely because earlier turns authorized it. If scope narrows,
retain only the still-authorized work. Do not erase existing work without consent.

At completion, compare actual artifacts and evidence with the latest agreed
result. Report unmet criteria, blocked work and unrun proof explicitly; a code
sample is not a saved implementation, and saved code is not a verified deployment.