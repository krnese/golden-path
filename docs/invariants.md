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
| I15 Proposed != approved | Separate statuses; approval attribution required; active implementations require approved derived decisions; changed authority surface needs a new decision | Genuine accountable-human approval, GitHub integration controls and complete semantic drift detection; owner approval is not independent peer review |
| I16 Governed delivery admission | Typed delivery records, exact candidate/plan/operation/target binding, authorization validity, approval presence, adapter support and authority ceiling, unresolved-value denial and synthetic allow/deny regressions | Correct semantic effect classification, authentic identity/approval, real policy enforcement, adapter correctness and actual deployment/recovery evidence |
| I17 Framework provenance is not project authority | `project/` and `engineering/` artifacts cannot reference each other (V0.1 isolation), so framework approvals, policies and evaluations cannot activate, authorize or satisfy project state; `project/` rejects framework agent/skill kinds; project directory bindings cannot overlap other bindings | Whether a forker's edits to framework state are appropriate; upstream updates into forks; typed framework-project relationships and runtime-agent representation remain deferred |
| I18 Evidence is retrievable or visibly unverified | Evidence locations that are provably machine-local (drive, absolute, home, network-share or `file:` paths, or paths outside the repository) or inside ignored areas (`.local/`, `node_modules/`, `coverage/`, `.git/`) are rejected; an existing regular repository file is repository-verified and owned by that evidence, rejecting symlinks, duplicate owners and canonical artifacts; every other location is reported as external with retrievability unverified, with derived counts | Retrievability of external sources, that a repository file is committed (CI on the committed tree proves that), and whether a free-text location is really session output rather than a durable identifier |

## Gate Boundaries

- Schema rejects unknown/mirrored/transitive fields, missing fields and unsupported
  classifications. Canonical discovery rejects aggregate ledgers and mismatched IDs.
- Graph validation rejects broken/wrong-kind references, cross-workload proof,
  missing write policies, unjustified recorded agent boundaries and invalid status claims.
- Bindings reject duplicate or overlapping path authority, missing paths, unsafe
  paths, symlinks and unbound recognized executable/workflow/agent/skill surfaces.
  Only project implementations may bind a directory (trailing `/`), never under
  `.github/`, `engineering/`, `project/` or excluded roots. Incidental
  unbound files are reported for review. Canonical artifacts identify themselves;
  no second inventory or stored graph is authoritative.
- Frontmatter checks use a YAML parser, validate discovery metadata and prevent
  bootstrap delegation/tool authority in skills. They do not sandbox the agent.
- Base comparison detects authority, identity, boundary, authorization and policy
  reference changes for stable capability IDs. It cannot detect renamed/deleted
  capabilities, policy-body effects or arbitrary semantic drift. Historical
  artifacts are discovered from the Git tree without a ledger compatibility layer.
- The governed-delivery gate is read-only. It validates supplied records and
  returns allow or deny; it does not authenticate principals, issue authorization,
  invoke an adapter or observe an external result. An allow result is contract
  admission, not deployment evidence.
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

All eighteen invariants retain semantic or external limits. I1-I9, I11-I12 and
I15-I18 have deterministic structural checks; I10 and I14 have bounded structural
safeguards; I13 depends on human diff review. No claim of complete enforcement is
made for any principle merely because its fields are present.

## Required External Setup

Repository state declares the contract; platform rules implement only part of it.
The [approved single-maintainer decision](../engineering/adr-github-governance-controls.json)
requires PR-based integration, the `validate` check from GitHub Actions, and
force-push/deletion protection on upstream `main`, with no bypass actors.
GitHub requires zero approving reviews in V0.1. The accountable owner separately
approves consequential scope before implementation and decides final integration
after inspecting the resulting revision and evidence. Independent peer review,
CODEOWNERS and related review flags remain deferred until earned. These upstream
settings do not configure protection in a fork; workflow YAML is not protection.

Approvals and passing test records can be forged as text. Merge controls and
review are essential; this repository does not claim tamper-proof enforcement.

The [2026-09-24 baseline](../engineering/evidence-external-governance-baseline.json)
records missing protection on upstream `main`, despite a successful CI check.
It is a point-in-time observation, not the current configuration of every fork.
The [external-governance evaluation](../engineering/eval-external-governance.json)
separates effective configuration and merge-blocking evidence from local checks,
instruction behavior and hook interception. Its baseline is a failed governance
result, not a failed capture or proof that remediation has occurred.

The separate [administrator observation](../engineering/evidence-external-governance-admin-observation.json)
preserves that baseline while resolving earlier visibility limits after an
explicit identity change. It confirms missing branch controls, 90-day retention
and no identified independent eligible reviewer for an owner-authored PR.
Administrative access did not authorize remediation. A subsequent explicit
owner approval authorized only implementation of the minimum controls and safe
probes, not integration of the repository diff.

The [implementation observation](../engineering/evidence-external-governance-implementation.json)
records active ruleset `23936296`, exact effective-rule readback and a non-merging
failure/recovery probe. In [probe PR #1](https://github.com/krnese/golden-path/pull/1),
the existing validator rejected an inert unbound file and the required checks
blocked integration eligibility. Removing that file produced successful checks
and `CLEAN` eligibility with zero reviews. The probe was closed without merging,
and upstream `main` retained its original content SHA. This demonstrates required
check blocking and recovery, not permission to integrate. Force-push, deletion
and direct-update rejection on an isolated equivalent target remain untested;
those controls have configuration evidence only. No destructive test ran against
live `main` and no additional ruleset was installed to manufacture that proof.

The aggregate evaluation remains inconclusive; its successful configuration and
check probes do not substitute for unrun proof or the integration decision
withheld at capture time. Earlier failed observations remain unchanged. GitHub's returned
extra-approval-for-unattributed-changes default is recorded separately; it is
inactive when required review count is zero. An owner cannot submit a qualifying
approval on their own PR, and no nominal reviewer or bypass was introduced.

GitHub sees authenticated principals, not whether a human or an agent exercised
the same owner's credentials. With the current shared identity, these rules
cannot mechanically prevent an agent from acting as the owner, fabricating
approval text or changing the rules. The agent has no authority to do so, but
that prohibition is not proved by a green check or a valid approval record.
Do not claim that these platform controls enforce human judgment, that a green
check proves owner approval, or that a mergeable PR is authorized for integration.
Owner review is not independent peer review. The invariant remains: the
repository and its agents may propose evolution; only the accountable human may
approve a consequential transition. Implementation approval is not integration
approval.

## Completed Capability Investigations

The 2026-09-24 review retained the existing architecture rather than adding
capabilities to demonstrate available runtime features:

- **Bounded parallel investigation:** the candidate task did not earn parallel
  decomposition. The project-directory-binding review and the one alternative
  governance review were rejected at task selection; no comparison arms or
  investigators ran. This is not evidence that subagents improve or impair
  engineering quality. Single-agent remains the default; parallel investigation
  must earn its boundary. No agent topology or delegation setting changed.
- **Action Admission:** the portable semantic remains valid, with deterministic
  allow/deny contract behavior in the existing read-only delivery gate.
  Execution-time interception through the current Copilot Agent Host repository
  hook path remains unproven and requires platform clarification. An initial
  Local-only discovery stopped on a harness mismatch; that result remains valid
  under its original prerequisite. In the subsequently approved Agent Host
  discovery, native `preToolUse`, permission handling and successful inert tool
  execution were observed, but the observation-only repository hook produced no
  receipt in either checkpoint in the same existing session. No new session or
  host restart was tested. Missing receipts establish neither hook execution nor
  absence of platform support, and do not identify the cause.

[VS Code's hook documentation](https://code.visualstudio.com/docs/agent-customization/hooks)
points Copilot Agent Host users to the Copilot CLI hook contract. Activation,
loaded-hook diagnostics and command failure behavior in the observed integration
remain unresolved; native lifecycle events are not command-hook execution proof.
Action Admission belongs to Golden Path, payload and interception behavior to
the harness adapter, and session coordination to Agent Host/AHP. Runtime
independence has not been demonstrated.

These are bounded review conclusions, not scored behavioral or operational
acceptance evidence. Raw discovery diagnostics and probe source remain local
session observations, not independently published repository evidence. The
temporary observation hook and recorder were removed from the integration
candidate. No runtime enforcement adapter, custom SDK host, extension, service
or workaround was retained. The reference implementation remains deterministic
admission and validation plus the separately observed CI/merge controls, not
execution-time enforcement.