# Invariant Coverage

All gates are structural unless stated otherwise. A record is an assertion,
not proof that a runtime control exists or that an approver is genuine.
`npm run check` exercises current state; CI adds base-revision authority comparison.

| Invariant | Enforceable now | Still advisory / future proof |
| --- | --- | --- |
| I1 Capability -> workload | Capability -> decision -> requirement -> workload is derived and validated; significant file bindings checked | Detecting undeclared capabilities inside existing source |
| I2 Measurable workload acceptance | Nonempty metric/target, unique criteria, requirement links and derived evaluation coverage | Whether a metric is truly measurable and its target useful |
| I3 Earned architecture branch | Decision owns required requirement links and Branch Rule fields; implementation decisions are derived | Continuing justification of existing architecture, including Golden Path itself; safe retention, consolidation or removal requires evidence and review, not a structural pass |
| I4 Executable authority declared | Every capability requires an authority enum, identity and boundary | Classification matches actual effects |
| I5 Write authorization | WRITE/HIGH_IMPACT_WRITE require principal, scope, enforcement, denial and policy | Real authorization enforcement and negative runtime tests |
| I6 High-impact policy/approval | Policy required; `none` approval rejected; rationale/enforcement required | Human approval appropriateness, authenticity and execution ordering |
| I7 AI behavioral evaluations | AI workload requires a behavioral evaluation with scenarios and pass criteria via derived scope | Representativeness, actual execution, quality and reliability |
| I8 Production operational evidence | Production workload requires operational evaluation; that evaluation owns signal/retention/operator; draft production implementations rejected | Collectors, alerts, release gates, on-call operation |
| I9 Skills cannot grant authority | Skill contract authority is NONE; frontmatter tool/authority fields rejected | Prose instructions cannot be interpreted as grants; editor/runtime enforcement |
| I10 Tools do not imply agents | Bootstrap delegation disabled; unbound agent definitions rejected | The principle itself requires judgment; a tool boundary does not justify an agent |
| I11 Earned agent boundaries | Non-primary boundary requires accepted basis, requirement and evidence links; only one primary | Evidence demonstrates need, safe concurrency and lifecycle isolation |
| I12 Outcome-traceable production evidence | Evidence -> operational evaluation -> requirement -> workload -> outcome is derived and validated | Trustworthy source, retention, correct correlation and actual business causality |
| I13 Codified learning | No automatic codification claim; normal schema/tests apply to changed artifacts | Human reviews root cause, justified retention or change, proof, approval and preserved historical rationale; no parallel learning registry |
| I14 Observations cannot silently redefine intent | Read-only validator, no state-writing automation; nonmutation regression; contents-read CI token | Human review of evidence promotion; external tools and privileges remain outside this scaffold |
| I15 Proposed != approved | Separate statuses; approval attribution required; active implementations require approved derived decisions; changed authority surface needs a new decision | Genuine independent approval, GitHub protections and complete semantic drift detection |

## Gate Boundaries

- Schema rejects unknown/mirrored/transitive fields, missing fields and unsupported
  classifications. Canonical discovery rejects aggregate ledgers and mismatched IDs.
- Graph validation rejects broken/wrong-kind references, cross-workload proof,
  missing write policies, unjustified recorded agent boundaries and invalid status claims.
- Bindings reject duplicate path authority, missing paths, unsafe paths, symlinks
  and unbound recognized executable/workflow/agent/skill surfaces. Incidental
  unbound files are reported for review. Canonical artifacts identify themselves;
  no second inventory or stored graph is authoritative.
- Frontmatter checks use a YAML parser, validate discovery metadata and prevent
  bootstrap delegation/tool authority in skills. They do not sandbox the agent.
- Base comparison detects authority, identity, boundary, authorization and policy
  reference changes for stable capability IDs. It cannot detect renamed/deleted
  capabilities, policy-body effects or arbitrary semantic drift. Historical
  artifacts are discovered from the Git tree without a ledger compatibility layer.
- The six scenario regression tests are synthetic policy tests. The manual
  behavioral evaluation has no claimed result until a human runs and reviews it.
- CI tests and dependency audit are the initial security checks. Threat modeling,
  secret scanning, SAST, runtime authorization tests and platform-specific policy
  gates must be earned and added as executable workload surface grows.

## Bootstrap Coverage

The validator reports unbound files. A zero count means every current bootstrap
file has an owning artifact or is itself canonical; graph checks establish each
non-outcome artifact's path to a workload and outcome. Requirements and outcomes
are roots of justification, not components that need circular self-justification.
Existing evidence kinds and future operational rules have tests, but no runtime
collector, production workload or fabricated evidence record is installed.

All fifteen invariants retain semantic or external limits. I1-I9, I11-I12 and
I15 have deterministic structural checks; I10 and I14 have bounded structural
safeguards; I13 depends on human diff review. No claim of complete enforcement
is made for any principle merely because its fields are present.

## Required External Setup

An administrator should require the `Golden Path / validate` check before merge,
require human PR reviews, prevent bypass as appropriate, and protect governance,
contracts, validation, agent and workflow changes with accountable reviewers.
Configure CODEOWNERS only when real owners/teams are known; no fictitious teams
or approval identities are scaffolded. Branch protection is not installed by YAML.

Approvals and passing test records can be forged as text. Merge controls and
review are essential; this repository does not claim tamper-proof enforcement.