# Durable engineering contract: bounded pilot

Recommendation: **retain for bounded trials**, not as a universal Golden Path
requirement or a claim of superiority over competent engineering. This implements
an unmet, specific requirement: durable intent plus independently observed Git
changes and baseline-owned validation. It is not the separate cross-system
authorization/information-disclosure workflow-assurance research.

## 1. Baseline inventory

Inspected baseline: `041c2c2cf3f89c8575a93a78e4b60102cf3282a0`.
Historical files and results were not changed for this pilot.

| Surface | What actually exists | What is not established |
| --- | --- | --- |
| [METHOD.md](../METHOD.md), [canonical SKILL.md](../.github/skills/golden-path/SKILL.md) | Portable Understand, Bound, Engineer, Prove, Report procedure; existing sources and engineering systems retain authority | Reliable consequence detection or incremental benefit |
| [Discovery pointer](../.github/copilot-instructions.md), [README](../README.md) | Copilot discovery and explicit document-supply fallback | Automatic invocation in every harness |
| Installed `octo-engineering` 0.1.0-preview.1 plugin, inspected locally | Skills-only packaging; `/octo-engineering:engineering` and `/octo-engineering:architecture`; manifest and source-provenance hashes; Golden Path snapshot at the baseline above | No plugin package, hooks, runtime, recovery database or plugin trial results are tracked in this repository. Installed README calls it a local pilot, not a validated release |
| [Agreement template](../templates/ENGINEERING.md), [examples](../examples/README.md) | Optional prose covering outcome, invariants, scope, evidence and assumptions; illustrative examples | Persisted per-task agreements or measured outcomes for those examples |
| [Repository hygiene CI](../.github/workflows/golden-path.yml) | Existing required job name `validate`; baseline implementation checks whitespace only | Acceptance, scope or authority validation. The added `contract-tests` job tests this pilot's code, not a PR's authorization |
| [Retired architecture](../research/experimental-v1/README.md) | Historical source at `c32b4aca3af0e7c8c6e7f300e275700ff0937da7`: schemas, typed artifacts, validator, derived graph, delivery predicates, package manifests | None are active adoption dependencies. Ignored local `node_modules` is not an active toolchain |
| [Earlier findings](../research/experimental-v1/RESULTS.md) and frozen protocols | Continuity/state/transition comparisons; compact conventional checker matched tested declaration decisions | No demonstrated structured-state advantage. State N's receipt write escaped both declaration checkers. Missing/failed/unrelated evidence could pass; semantic contradictions also escaped |
| [Continuing-delegation protocol](../research/continuing-delegation/PROTOCOL.md), [runner](../research/continuing-delegation/run.mjs), [fixture](../research/continuing-delegation/fixture.mjs) | 36 subjects, paired A/B sources, session UUID resumption, frozen inputs, local effects and linked tool observations | Research fixture is not a deployed enforcement system or an OS sandbox |
| [Results](../research/continuing-delegation/RESULTS.md), [analysis](../research/continuing-delegation/analyze.mjs), [retained evidence](../research/continuing-delegation/results/) | NO CHANGE: both groups handled 12/12 consequential and 6/6 benign cases; B median elapsed cost +13.9%; retained summary is reproducible | General reliability, business improvement, compaction recovery, cross-harness handoff or independent replication |
| Brownfield discovery/recovery | Method says to inspect existing requirements, ADRs, code and tests; documents can be supplied to another agent; research resumes conversations | No automated onboarding scanner or active durable task-recovery adapter |

The reported greenfield/brownfield plugin experience motivates further trials.
It is not a measured result in this repository's retained evidence. No new model
trial was conducted here, and the old NO CHANGE findings are not reinterpreted.

Live default-branch rules were read on 2026-10-12: PR integration, required
`validate` status, non-fast-forward and deletion protection; zero required
approving reviews, no code-owner-review requirement, and no strict up-to-date
status requirement. Therefore this repository's current protections do **not**
by themselves establish independent owner approval of a contract baseline.

## 2. Smallest contract and rationale

Use existing issues, ADRs, acceptance tests and CI when they already provide this
continuity. Do not migrate them merely to adopt Golden Path. The optional
[JSON template](../templates/engineering-contract.json) is for a bounded task that
lacks a consumable scope/check contract. Install it as
`.github/engineering-contract.json` in the adopting repository.

One UTF-8 JSON file in Git, no database, graph, statuses granting approval,
generated schema package, signature scheme or orchestration service:

| Field | Meaning |
| --- | --- |
| `version` | Format version, currently exactly 1 |
| `objective`, `intendedOutcome` | Builder intent and measurable desired outcome; strings may reference existing authoritative sources |
| `scope` | Exact, case-sensitive repository-relative Git paths allowed to differ; no wildcards or implicit directory expansion |
| `constraints` | Human-readable invariants; not magically enforced by their presence |
| `decisions` | Relevant decisions/rationale or links to their existing owners |
| `acceptance` | Criterion text paired with a required check ID |
| `checks` | Unique IDs and repository-relative `.mjs` scripts from the selected baseline; at least one |
| `progress.implementation` | Implementation references, e.g. paths, commits or PRs |
| `progress.evidence` | Links to real CI/operating evidence, never ingested as a passing result |
| `progress.outcome` | Claimed `unproven`, `observed` or `not-achieved`; not derived from CI success |
| `progress.summary`, `progress.questions` | Handoff context, remaining work and unresolved questions |

The [verifier's `validateContract`](../scripts/verify-engineering.mjs) is the
executable format definition: required fields, no unknown fields, nonempty
objective/outcome, unique paths/check IDs, resolvable acceptance-to-check references,
and explicit progress shape. Arrays of decisions, constraints and progress
references may be empty. Syntax validation cannot establish the meaning,
completeness or truth of these strings; placeholder templates need actual review.

This is an explicit opt-in control, not a parser or replacement for the existing
prose agreement. It leaves [METHOD.md](../METHOD.md) unchanged. That also preserves
the method hash used by historical research. A separate JSON Schema would add
another shape definition without a current consumer; it is intentionally omitted.

### Authority and amendments

All fields except `progress` are selected from a **trusted baseline commit**.
Candidate terms must match them. Changes to progress are allowed only if the
contract path is in scope; progress remains a claim regardless of wording.

The owner reviews intent, allowed paths, acceptance scripts and consequential
tradeoffs using existing review controls. They then select the baseline SHA
outside the candidate's control. Scope amendments and exceptions use the same
procedure: record rationale in the existing decision/PR, review changed terms or
checks, land/select the new baseline, and rerun against a descendant candidate.
There is no candidate `approved`, `skip`, exemption or self-signed override.

Selecting a newer baseline resets the observed change interval. Review the
amendment diff separately: do not absorb unreviewed implementation into the new
baseline just to make it disappear. The tool verifies ancestry, not reviewer
identity. The amendment test simulates the owner's selection; it does **not**
authenticate a real approval. Shared human/agent credentials remain a bypass.

## 3. Independent observation

[verify-engineering.mjs](../scripts/verify-engineering.mjs) accepts repository,
full baseline SHA and full candidate SHA. The caller must supply trusted verifier
code, not run a candidate replacement. It:

1. Resolves the exact commits, requires baseline ancestry, and records their trees.
2. Computes changed paths/statuses from Git, not a declared file list. Renames
   become deletion plus addition so both endpoints must be in scope.
3. Loads approved terms from the baseline Git blob; candidate declarations cannot
   widen scope, drop checks or approve exceptions.
4. Materializes tracked raw blobs into fresh baseline/candidate directories for
   each check. It does not use the mutable working tree, Git filters or replace
   refs. Each required Node script comes from the baseline and receives the
   candidate directory as its first argument, with that directory as its cwd.
5. Records each executed script's SHA-256, command shape, start/end, exit code,
   signal, stdout/stderr and execution error. Missing scripts, malformed contracts,
   timeouts, failed checks or absent required execution cannot yield a pass.
6. Emits JSON to stdout and exits nonzero on failure. Evidence includes verifier
   hash, contract hash, commit/tree identities, runtime, actual diff, approved
   context and separately labeled candidate progress. Hashes bind bytes; they
   neither prove correctness nor authenticate the operator.

No agent-supplied test log, URL, outcome label or signature substitutes for
execution. Missing agent evidence is not an exemption: fresh checks still run.
An exit-zero script establishes only what that reviewed script actually tested.
Nonempty script output is not required; a trusted script can be silent.

The manually invoked [CI adapter](../.github/workflows/engineering-contract.yml)
uses the selected default-branch workflow commit as baseline, checks out that
verifier, and accepts only a candidate SHA as input. It does not run a candidate
workflow or consume candidate success records. It retains the report, including
failures, as a run/attempt-specific Actions artifact for 30 days. The Actions run,
job logs and artifact origin provide provenance beyond the JSON's own assertions.
Record that run URL in the normal PR/issue, and retain artifacts under your normal
retention policy if 30 days is insufficient.

The repository does not yet have an owner-approved task contract installed at
the fixed path. Dispatch without one deliberately fails. The template is not
self-approval for this change. The workflow has not been executed on GitHub here;
its integration remains to be exercised after review/installation.

This workflow is not wired as a required merge check and no external branch
protections were changed. Existing required `validate` behavior is preserved.
Do not treat the new verifier's own unit-test job as independent acceptance of
a candidate: a candidate can change its own unit tests. For enforcement, the
repository owner must protect baseline/control updates and require observations
for the exact integration candidate through existing merge controls.

## 4. Brownfield adoption and harness portability

1. Discover the repository's actual instruction files, requirements, decision
   records, build/test commands, branch controls and permitted external effects.
   Reuse them. Choose one small change, not a repository-wide metadata migration.
2. Identify the remaining gap. If existing protected CI already compares allowed
   scope and executes the required tests with adequate provenance, prefer it.
3. If using this pilot, fill the single contract with references and exact paths.
   Map substantive acceptance to real tests. Unencoded constraints still need
   human review or other controls. Review the baseline separately from implementation.
4. A `.mjs` adapter receives `process.argv[2]`, the candidate snapshot path.
   It must perform assertions or run existing tooling, propagate failures,
   and import trusted helpers from its baseline location. Do not merely import
   a candidate test script that can replace assertions with an exit-zero stub.
   No dependency installation is automatic; heavyweight build environments and
   checks longer than 60 seconds should stay in existing CI rather than expanding
   this pilot into a build platform.
5. At a handoff, persist useful progress in Git and reference actual evidence.
   Supply the next agent the repository, selected baseline SHA and current
   candidate SHA. Read current authoritative sources and the persisted contract;
   compare approved terms, proposed changes and pending questions. Rerun validation
   for a new candidate instead of treating old green evidence as current.

The installed skills-only plugin already asks the agent to read repository
requirements and existing evidence. It can read/update this JSON with normal file
tools; no hook or model-specific runtime is necessary. This repository's canonical
skill adds only a discovery/recovery note. The installed external plugin snapshot
was inspected, not modified or republished; a future plugin refresh can carry the
same optional pointer without duplicating the method.

Other coding agents need only their native discovery pointer to the canonical
method/skill and the task's contract/baseline location. Explicitly supplying those
documents is the fallback. They require ordinary Git, read/edit and test access,
not an MCP server, special memory API, custom agent or a second implementation.
File/process-level recovery is tested below; live cross-harness invocation,
context compaction and agent adherence have **not** been experimentally validated.

## 5. Tests, observations and uncovered violations

The tests construct local Git repositories with synthetic intent and baseline
checks outside candidate control. No model response or agent-controlled field
sets the oracle or turns a failed observation into a passing test.

| Case | Observed expected behavior |
| --- | --- |
| Entirely declared change | Pass; actual changed path and fresh check execution retained |
| Undeclared file edit despite claimed success | Fail even though the functional check passes |
| Allowed file changes currency USD to EUR | Fail through baseline-owned substantive assertion |
| Missing agent validation evidence | Run validation anyway; pass only on new observed execution |
| Missing required baseline script | Fail; absent execution does not become evidence |
| Candidate widens scope/replaces check metadata | Fail; original scope and script remain governing |
| Owner selects reviewed scope amendment | Original baseline rejects; amended baseline accepts; selection is simulated, not identity proof |
| Fresh process reads persisted handoff | Recovers objective, decisions, implementation references and unresolved outcome without chat history |
| Candidate replaces check source with fabricated pass | Original baseline check still fails |
| Rename/deletion | Both original and new paths checked |
| Malformed/incomplete contract or missing check references | Fail closed |
| One check modifies its snapshot | Next check sees a fresh candidate, not the prior check's write |
| Symlink entry | Explicit unsupported-entry failure, not traversal |
| Uncommitted edits/untracked file | **Not detected**: outside the selected committed candidate |
| Allowed file violates an unencoded reporting-quality constraint | **Not detected**: verifier passes; this is an uncovered violation, not assurance success |

The last two tests deliberately assert the coverage boundary. Passing the test
suite means these limitations are reproduced, not that the violations were caught.

Local validation on 2026-10-12, Windows, Node v24.19.0:

```powershell
node --test scripts\verify-engineering.test.mjs research\continuing-delegation\harness.test.mjs research\continuing-delegation\analysis.test.mjs
```

**Passed: 30 tests, 0 failed, 0 skipped** (16 pilot tests and 14 existing research
tests). The retained research summary still reproduces exactly. Node syntax
checks, workflow YAML parsing, local documentation-link resolution and
`git diff --check` also passed. These are local implementation observations;
no hosted CI run, independent reviewer replication or coding-agent trial is claimed.

### Remaining limits and bypasses

- Git compares selected tracked snapshots, not external writes, network calls,
  disclosures, database effects, deployment permissions, transient changes or
  dirty/untracked workspace activity. The historical receipt-write failure is
  **not** claimed fixed by a diff check.
- Checks and their helpers are trusted code reviewed at the baseline. If they
  call candidate code, that code is untrusted. Child processes and temporary
  directories are **not a security sandbox**: same-user malicious code can attack
  the runner, forge output/exit behavior, alter controls outside its snapshot or
  access the network. Use disposable, secret-free restricted runners and existing
  isolation controls for hostile workloads. Do not run this via a privileged
  `pull_request_target` job.
- The pilot cannot authenticate owner intent. An actor able to change the
  default branch, chosen baseline, verifier, workflow, required checks or runner
  can bypass it. Protect those with independent identities/review and existing
  platform controls; a signed agent document does not solve this.
- A weak/empty baseline test can pass without establishing its criterion.
  Unencoded semantics, false prose, contradictory decisions, unreachable evidence
  links and fabricated outcome claims require review or an appropriate oracle.
  The verifier does not dereference progress links or certify business outcomes.
- Commit identity matters. Observations for an earlier head or a pre-merge
  candidate do not establish a later merge tree's behavior. Rerun after amendments,
  rebases or integration changes. No live revocation or deployment adapter exists.
- Only regular Git blobs are supported, using portable relative paths. Symlinks,
  submodules and path collisions fail explicitly; LFS pointers remain pointers.
  Snapshots have no `.git` metadata, untracked build output or dependency cache.
  Scripts have a 60-second/4-MiB-output bound, Git reads a 64-MiB bound. This is
  intentionally a small-repository pilot, not general build infrastructure.
- Temporary test writes are isolated between checks, but a check can change its
  own snapshot during execution. The evidence proves initial input and observed
  process execution, not that every operation used immutable inputs.
- Local reports can be edited. Consumers must use the independently retained CI
  artifact and its source run, not an agent-pasted JSON copy. Missing/expired
  artifacts are unavailable evidence, not a pass.

## 6. Reproduction

Node 24 and Git; no package installation. From the repository root in PowerShell:

```powershell
node --test scripts\verify-engineering.test.mjs
node --test research\continuing-delegation\harness.test.mjs research\continuing-delegation\analysis.test.mjs
git diff --check
```

The first command creates and cleans up exact temporary fixture directories.
The research analysis tests recalculate the retained summary in memory without
overwriting historical results.

To inspect a real task after owner review and committing its candidate:

```powershell
# Run the verifier from the trusted baseline checkout, not the candidate checkout.
# Replace these values with the owner's full baseline and candidate commit SHAs.
$base = '<40-character-reviewed-baseline-sha>'
$candidate = '<40-character-candidate-sha>'
node C:\trusted-baseline\scripts\verify-engineering.mjs C:\task-repository $base $candidate
# Save stdout using your CI/artifact system; require process exit code 0.
```

For the provided CI adapter, first review/land the verifier, workflow, actual
contract and check scripts on the default branch. Push a descendant candidate to
a repository branch so checkout's full fetch includes it. Dispatch **Engineering
contract pilot** from the default branch with that full candidate SHA. Inspect
the job result and `engineering-evidence-<run-id>-<attempt>` artifact; record
the run link in the normal issue/PR. Missing commits/contracts must fail, not
silently fall back to HEAD or an agent-provided record.

## 7. Decision

**Retain this narrow opt-in mechanism for trials; reject a broader platform or
claims of general assurance on this evidence.** Deterministic fixtures establish
path-scope comparison, baseline-owned execution, refusal of candidate metadata
overrides and file-level recovery. They do not establish improved engineering
judgment, adoption cost, business outcomes or production enforcement.

Revise or remove it if real repositories already have equivalent controls, the
extra contract drifts from native requirements, or adapters cost more than the
gap warrants. The next useful evidence is a reviewed small brownfield trial,
including a live CI run, a real handoff and a substantive constraint that ordinary
tests would miss. Measure detected violations and maintenance burden against
competent repository-native practice, not document volume.
