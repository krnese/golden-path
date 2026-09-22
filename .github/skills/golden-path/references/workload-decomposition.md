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
requiring no judgment should remain deterministic.

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

### Ask the Next Material Question

1. Reuse answers already given and safely inspect relevant repository context.
   Do not ask the user for facts available through authorized, low-risk discovery.
2. Distinguish facts, explicit constraints and provisional assumptions. Infer
   routine reversible details from established conventions; surface uncertainty
   when it changes behavior, scope, risk or acceptance.
   A named technology, service, region or request to deploy is not by itself a
   workload outcome. When the problem and intended users are unknown, establish
   them before asking the user to choose implementation or delivery mechanics.
3. Select the unresolved choice with the greatest effect on correctness, scope or
   risk that blocks the next useful step. Ask one focused question in plain
   language; explain the consequence or offer a recommended option when helpful.
4. Incorporate the answer, preserve settled decisions and proceed with clear,
   authorized work. Defer questions that only affect a later stage.
5. Before substantial implementation or external execution, briefly state the
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