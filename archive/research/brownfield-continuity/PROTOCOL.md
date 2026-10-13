# Brownfield continuity: frozen pilot protocol

Research only. No change to the active Golden Path method or plugin.

## Hypotheses and estimands

**H1 (requested):** persisting and independently verifying intent, constraints,
decisions and evidence improves autonomous engineering across interruptions.
The inspected active implementation does not supply this persistence or
verification mechanism. H1 cannot be tested as an implemented-product comparison
here. Do not invent a contract, require treatment-only handoff notes, or revive
the retired structured-state architecture to make this claim testable.

**H2 (executable pilot):** the existing Golden Path engineering skill improves
validated completion, decision recovery or efficiency after loss of conversation
state, relative to competent ordinary engineering with the same durable sources.
Optional records created by either subject are an observed mediator, not a scored
method requirement. This pilot estimates the total effect of the skill package,
not a separately identified persistence effect.

The evaluator is a deterministic external process, not the implementing agent.
It checks observable HTTP responses and persisted SQLite state. Experiment
authorship, fixture selection and interpretation are not independently blinded.

## Fixture

Equipment Tracker is an existing local-only prototype in the adjacent
`gp-adopter-trial-2` workspace. Its application existed before this experiment;
the app is untracked there, so its parent Git revision is NOT its source identity.
The retained application file hashes and copied bytes identify the source.
Never edit the adjacent repository.

Keep the original HTTP server, SQLite repository, browser client, five existing
HTTP regression tests, app README, dependency manifest and lockfile. Project the
package scripts to application start/test only; omit the old Golden Path
governance framework, its instructions, schemas and tests from BOTH conditions.
This avoids seeding the control with a historical treatment. Retain the original
manifest separately for auditing. Runtime dependencies are Node HTTP/SQLite;
inherited AJV/YAML devDependencies are locked but unused by the application tests.
No dependency installation is required for these tests.

The change spans HTTP request handling, repository APIs, SQLite schema/transactions,
response recovery and regression tests. Existing documentation describes use but
not these retry semantics. It is a small brownfield prototype, not production
scale or a randomly sampled mature application.

## Assignment and architectural constraints

The shared task is in `task.md`; `revision.md` is disclosed at restart only.
All criteria are public requirements. Evaluator implementations, particular
inputs and assertions remain outside subject repositories. Hidden criteria must
not introduce an undisclosed requirement.

Implement optional `Idempotency-Key` on POST `/api/assignments` so a client that
loses a response can safely retry after process restart. Use SQLite, not a
process-local cache. An unkeyed request must retain existing behavior. Duplicate
retries must not create another assignment or audit event. Keyed writes, stored
response and lifecycle event must commit or roll back together. Existing SQLite
files must remain usable without destructive migration. No new service, package,
framework, authentication change or browser change is requested.

The initial conversation supplies an owner decision, identically to both arms:
retain the ORIGINAL successful response snapshot; do not reconstruct the replay
from current assignment state. This decision is intentionally not in the initial
task file. Subjects may preserve it using normal engineering practice. The
restart task revision introduces a new explicit constraint: the key remains bound
after return and reassignment; no expiry or reassignment reuse. The restart prompt
asks the subject to recover and report the earlier response decision but does
not repeat it. Missing decision context must be reported, not fabricated.

## Conditions and isolation

* **A:** competent CLI agent with ordinary repository context, source, Git, test
  tools, editing tools, task and normal engineering instructions. No Golden Path.
* **B:** same, plus the existing plugin engineering skill and bundled method.
  Explicitly invoke that skill on both starts. Do not mandate extra documents.
* Extract the engineering skill and its references byte-for-byte from the
  installed skills-only OCTO plugin. Exclude its unrelated architecture skill.
  Retain the original plugin manifest. This is a transport-only, engineering-only
  extraction, NOT a newly developed continuity mechanism or a full-bundle trial.
* Fresh `COPILOT_HOME` for EVERY phase. Disable external MCPs, global custom
  instructions, remote control/export and auto-update. Do not copy user settings,
  memories, session files or credentials. Standard CLI tools remain available in
  both arms; shell-only restrictions would handicap competent engineering.
* Only fixture files are agent-visible working context. Experiment sources,
  evaluator, other subjects and results must not be read. This is instruction/
  working-directory isolation, NOT an OS sandbox; audit tool paths for leakage.
* Same installed CLI, default model selection, reasoning/context settings and
  permissions. Record actual models from events; do not pool changing models.
  No model override is prescribed. Tokens are measured; elapsed-time ceilings
  are the enforced resource budget. Do not claim equal realized token expenditure.

## Frozen execution plan

Before any scored subject, `freeze` hashes protocol, tasks, evaluator, runner,
fixture, tests and treatment files. All later commands verify these hashes.
No post-freeze evaluator repair; a needed repair starts a new experiment version.
Unscored infrastructure preflight must establish clean control, treatment skill
invocation, method reading and usable tool evidence. If this fails, stop the
comparison and report the prerequisite failure.

Four independent subjects: two A/B pairs, order A-B then B-A. Sequential execution
avoids within-host concurrency confounding. No pilot subject is reused. No
post-hoc reruns, feedback from hidden tests, or exclusion of unsuccessful subjects.
Record infrastructure failures separately without silently replacing them.

Per subject:

1. Fresh fixture and session. Implement the assignment. T1 has a 180-second
   ceiling. On the first change to either production backend source, allow ten
   seconds then forcibly terminate the CLI process tree. This mutation-relative
   rule is identical across arms; record actual partial files and event evidence.
   An early clean exit or no mutation is NOT an actual implementation interruption.
2. Replace the task with its shared revision, preserving all subject files.
3. Start a new session UUID with a new home, no transcript or generated summary.
   Give the same continuation prompt, plus skill invocation in B. T2 has a
   300-second ceiling. This is actual fresh-context restart / conversation-loss
   simulation. It is NOT native context compaction, a second independent agent
   identity, or a cross-harness transfer.
4. Independently run the original five regressions, hidden outcome tests and
   patch-whitespace check. Record exact commands, outputs, candidate file hashes,
   initial/partial/final patches, public tool events, final responses and usage.
   No hidden evaluation feedback goes to a subject.

No human repair turns. Human clarifications requested by subjects are counted;
the fixed restart/revision is an experimental stimulus, not a repair. Runner or
host failures must be visible. Standard CLI authentication is a prerequisite;
credentials must never enter files or prompts.

## Evaluation and measurement

Primary binary endpoint: all six outcome tests AND all five unmodified original
regressions pass, architecture preserved, and no evaluated-source/test tampering.
The original tests are run again from evaluator-owned bytes, not subject copies.
Report each criterion, not just a summed score:

1. Retry with equivalent normalized inputs returns 201 and identical original
   JSON; exactly one assignment and one `assigned` event.
2. Changed payload with the same key returns 409 `idempotency_conflict`, no writes.
3. Close/reopen SQLite/server; replay still succeeds without another event.
4. Return, reassign to another employee, retry first key: original snapshot,
   no resurrection or new event; changed payload still conflicts.
5. Fault-inject event insertion failure: assignment AND replay state roll back;
   removing the fault permits a real creation, then safe replay.
6. Concurrent retries converge; old databases reopen and unkeyed duplicate
   assignment behavior remains 409 `active_assignment_conflict`.

Continuity: original snapshot decision respected by behavior; permanent key
constraint respected; decision recovered/reported versus honestly missing or
contradicted. Semantic report scoring requires a cited public excerpt; no credit
for Golden Path labels. Compare partial/final patches and persisted notes.

Efficiency: T1/T2/total wall time (including killed phase), tool calls, CLI
reported input/output/cache tokens and billing-unit fields when available.
Unavailable interrupted-phase usage or dollar pricing is null, never zero.
Repeated inspection commands and overwritten/reverted work are descriptive
proxies, not objectively measured wasted reasoning. No fabricated cost estimate.

Evidence quality: match claimed test commands to completed successful tool
events; evaluator tests do not establish an agent's claims. Retain final response,
failed commands, actual validations, risk disclosures and candidate hashes.
Record extras/unintended changes and test modifications. Report original and
subject-added tests separately.

## Decision rule, fixed before execution

This is a feasibility/descriptive pilot, not a powered significance test.

* H1: **UNTESTED** regardless of H2 results, because its proposed durable contract
  is absent.
* If either arm cannot be isolated, interrupted or measured credibly:
  **INCONCLUSIVE** for that comparison; publish partial evidence.
* If both arms pass 2/2: **CEILING EFFECT**, not equivalence.
* Preliminary H2 benefit only if B passes 2/2 and A passes 0/2, with no additional
  consequential side effects and median total time <=125% of A. This earns
  replication, not a product claim.
* Otherwise report the exact differences as **NO DEMONSTRATED BENEFIT** or
  **INCONCLUSIVE** when evidence is missing. If outcomes tie and time increases,
  explicitly report overhead without demonstrated benefit.

Do not change thresholds, budgets or repetitions after observing subject output.

## Scope extensions not executed by this pilot

Native compaction requires an observable harness compaction event plus before/
after context evidence. A restart is only a context-loss simulation. Cross-harness
transfer requires two verified independent harnesses, same pinned model/tool
capabilities/budget and identical file-only handoff. None is currently assumed
supported. Repeat the frozen workload in each verified harness/model stratum with
new subjects; never call same-CLI restarts cross-harness support.

To test H1 in a later, separate development phase, first specify an implemented
durable mechanism and recovery path. Then preregister a factorial comparison
(competent practice / skill-only / durable-state-only / combined), keep builder
facts equal, permit ordinary notes in controls, and independently evaluate state
freshness, recovery and application outcome. Do not retrofit that mechanism into
this comparison or pool it with H2.

## Known limitations frozen in advance

One local prototype, one defect/feature, two repetitions per arm, deterministic
order, one available CLI and its default model; selected rather than randomized
fixture; no production load, native compaction or cross-harness test. Agent-
visible optional notes and partial code can reveal the earlier decision. Source
documentation and public requirements may create a ceiling. Forced termination
may interrupt tool serialization and lose token usage. CLI permissions are not
an OS sandbox. The extractor tests only engineering skill packaging; full bundle
adoption was not tested. Independent deterministic evaluation is not independent
experiment ownership. A negative or inconclusive result is acceptable.
