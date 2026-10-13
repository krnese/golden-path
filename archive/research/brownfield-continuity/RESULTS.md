# Results: continuity mechanism untested; skill pilot inconclusive

> **Correction (13 Oct 2026):** the "existing test file edited" guard below misclassified legitimate test
> additions. Under the corrected rule no subject tampered with tests. See [CORRECTION.md](CORRECTION.md).

**Recommendation: REVISE the continuity claim and the next experiment.**
Do not claim that the current Golden Path direction has demonstrated durable
engineering continuity. Do not introduce a mandatory contract on this evidence.
Keep the existing optional skill available, but its incremental value remains
unproved. These observations do not justify abandoning all lightweight guidance.

## What ran

On 2026-10-12:

* Audit of the initially inspected Golden Path worktree at revision
  `041c2c2cf3f89c8575a93a78e4b60102cf3282a0` and the actual installed local
  OCTO Engineering plugin `0.1.0-preview.1`.
* A frozen, existing Equipment Tracker application snapshot; seven application
  files, HTTP server, SQLite repository, browser client and five original tests.
  The app was untracked in the adopter workspace. Parent commit identity alone
  would not reproduce it; retained file bytes/hashes do.
* A/B clean-home infrastructure preflight, followed by four independent subjects,
  order A1, B1, B2, A2. No model-subject reruns or human repair turns.
* GitHub Copilot CLI **1.0.95**, reported **claude-sonnet-5.5** in every phase,
  Node **24.19.0**, Windows. Same default model selection and permissions; no
  model override, external MCP or custom global instructions.
* Actual process-tree termination ten seconds after first backend mutation,
  followed by a new session UUID and a new configuration home, with repository
  files only. The revised permanent-key requirement was applied identically.
* Independent HTTP/SQLite outcome evaluation and original regression tests,
  outside the subject's context. Original test bytes replaced subject versions
  in a separate evaluation copy. No hidden feedback reached a subject.

Public tool events verify engineering-skill invocation and actual method reading
in all four treatment phases; neither occurred in any control phase.

The [freeze](freeze.json) predates scored execution. All 20 decision-bearing
source hashes verified unchanged after execution. Protocol, resource ceilings,
two repetitions per arm, task and evaluator were not repaired or retuned.
The [provenance](source-provenance.json) records the application projection and
unchanged engineering-only plugin extraction. The unrelated architecture skill
was deliberately excluded, not silently added to treatment capabilities.

The baseline passed **5/5 existing tests**, but failed **all 6 retry outcome
tests**. There was an actual missing application capability, not merely a failed
compile or an agent claiming success.

## Comparative observations

| Subject | T1, seconds | T2, seconds | T2 finished | Original regressions | Outcome tests | Frozen guard |
| --- | ---: | ---: | --- | ---: | ---: | --- |
| A1: conventional | 34.727 | 82.355 | Yes | 5/5 | 6/6 | Fail: existing test file edited |
| B1: engineering skill | 43.572 | 51.998 | Yes | 5/5 | 6/6 | Fail: existing test file edited |
| B2: engineering skill | 40.102 | 55.615 | Yes | 5/5 | 6/6 | Fail: existing test file edited |
| A2: conventional | 36.170 | 304.211 | No: budget exhausted | 5/5 | 6/6 | Pass |

T1 ended by the planned forced interruption in all four subjects. T2 A2 was
terminated at the 300-second budget; the 304.211-second observation includes
process-tree shutdown overhead. A2's externally evaluated code passed despite
its own added test suite failing/hanging and the absence of a completed report.
External correctness is not equivalent to the agent having validated completion.

| Descriptive measure | Control A | Treatment B |
| --- | ---: | ---: |
| Final code passes all six independent outcome tests | 2/2 | 2/2 |
| Final code passes all five evaluator-owned regressions | 2/2 | 2/2 |
| Fresh-context implementation session finishes | 1/2 | 2/2 |
| Original replay-snapshot behavior maintained | 2/2 | 2/2 |
| Permanent-key revised constraint maintained in tested cases | 2/2 | 2/2 |
| Completed reports identify code-based decision recovery | 1/1 completed | 2/2 completed |
| Completed reports acknowledge missing conversational agreement | 1/1 completed | 2/2 completed |
| Total public tool requests, both phases | 47 | 49 |
| Median time **spent**, both phases | 228.732 s | 95.644 s |
| Median time to agent-validated completion | Not estimable: one censored run | 95.644 s |
| Complete run token/cost accounting available | 0/2 | 0/2 |

The treatment had two more tool requests, not fewer. Its observed time spent was
lower and both treatment sessions finished, whereas one control did not.
That is a potentially useful descriptive signal, **not** an established causal
efficiency improvement: two subjects, one timeout, fixed order, cache/host/model
latency, different partial implementations and invalid primary qualification
prevent a reliable treatment-effect estimate. Do not turn censored time spent
into a percentage reduction in time to validated completion.

### Genuine application outcome

The six deterministic tests establish, for these inputs:

1. Equivalent normalized retries return the identical original 201 response.
2. Changed payloads with an existing key return 409 `idempotency_conflict`.
3. Keys/responses survive actual close/reopen of the SQLite file and HTTP server.
4. Return and reassignment do not alter an earlier replay or resurrect its state.
5. An injected event-write failure leaves zero assignments/events; after removing
   the fault, a retry creates one assignment, followed by safe replay.
6. Eight concurrent HTTP retries converge on one response, one assignment and
   one lifecycle event. Existing-schema data survives migration and the old
   unkeyed active-assignment conflict remains.

Every final candidate passed each test. This is a **ceiling on the six tested
outcomes**, not equivalence, universal correctness, or proof of all requirements.
Both conditions achieved the intended core reliability result. The evaluator
did not cover every key size, input, process crash location or live operational
failure. Closing/reopening the application in-process is not an OS process crash
or power-loss durability test.

### Continuity recovered from implementation, not a contract

Before interruption, subjects embedded the replay decision in a source comment
and response-storage implementation. Fresh contexts could recover that evidence.
None of the completed reports claimed the lost conversation itself survived.
They correctly distinguished implementation evidence from an independently
recorded owner agreement.

Representative public final excerpts, retained in [summary](results/summary.json):

* A1: "The only surviving source is the interrupted session's uncommitted code
  in `app/db.mjs`." It reported no notes, stash or recorded discussion.
* B1: "Not recovered: the earlier conversation and any explicit agreement."
  It treated the source as an implementation choice, not a confirmed agreement.
* B2: "No design note, commit message or other record of an agreement survived."

No separate pre-interruption agreement/handoff record was created by either arm.
This demonstrates recovery from ordinary source evidence in this workload,
not reliable persistence of engineering intent by Golden Path. A2 had no
completed decision-recovery report, although its final code retained the choice.
The revised constraint was public repository state at restart, not an invisible
fact the new agent could not access.

## Failures, measurement defects and side effects

### Frozen protected-file guard invalidated the primary comparison

The task allowed focused test additions and prohibited **removing** existing
tests. The driver incorrectly treated **any** change to the original test file
as protected-file tampering. A1/B1/B2 added tests there; A2 added a separate test
file. The evaluator-owned original five tests still passed in all candidates.
The raw guard thus qualified A2 but rejected the other three for a legitimate
editing choice.

This was an undisclosed, overbroad restriction, not evidence that those agents
violated the task or that A2 engineered better. We retained the raw
1/2 A versus 0/2 B guard results, **did not fix the frozen evaluator, did not
requalify subjects**, and classify the primary comparison **INCONCLUSIVE**.
Any corrected guard requires a separately frozen experiment with new subjects.
The independent outcome/regression observations remain reproducible diagnostics.

### Control A2's added validation really failed

A2 repeatedly launched/stopped validation commands and exhausted T2's budget.
After scoring, an explicitly unscored diagnostic ran its added test file:
three tests printed pass and three printed failure; the process did not exit
within 30 seconds and was explicitly terminated by its session/process tree.
A single-test TAP reproduction identified **hookFailed / EPERM in `rmSync`**:
temporary SQLite cleanup ran before the server/database was fully closed.
The logs and exact commands are in [diagnostics](results/diagnostics.json).
The subject was not given this diagnosis or repaired.

A1 encountered a related cleanup problem, then made cleanup best-effort with a
broad suppressed catch, allowing its final 11-test run to pass. Its report
incorrectly claimed that the server never closes its database handle: every
candidate retains `server.on('close', () => database.close())`. This is an
evidence/risk-reporting error, not an application failure shown by the frozen tests.

### Treatment introduced an unrequested limit

Both B candidates independently added a 255-character idempotency-key limit.
Both final reports acknowledged that it was their own choice, not in TASK.md.
A post-run, unscored 256-character-key HTTP diagnostic observed:

| Candidate | Actual status |
| --- | ---: |
| A1 | 201 |
| A2 | 201 |
| B1 | 400 `invalid_idempotency_key` |
| B2 | 400 `invalid_idempotency_key` |

This is an extra API constraint and compatibility risk against an assignment
specifying non-empty keys without that bound. It was NOT secretly added to the
six scored tests after observing outputs. It prevents claiming that treatment
had no unintended effects or that passing the six tests established complete
acceptance. A declaration of the deviation in a report is not prior acceptance.

### Evidence export and shared workspace

The CLI nests private reasoning metadata inside some assistant-message events.
The post-run publisher strips those fields recursively; its regression test
checks this exact shape. Published archives were checked for remaining private
reasoning fields and common credential patterns: none found. This export-only
correction changed neither frozen inputs nor subject/evaluation outcomes.
Runtime homes and complete session directories are not exported.

Unrelated changes to active Golden Path files appeared in the shared worktree
after the initial audit. This experiment did not make or revert them. Inspected
subject mutation paths stayed within their fixture repositories; the tested
skill/fixture/evaluator copies retained their frozen hashes. The audit and
conclusions concern the initially inspected mechanism, **not** any subsequently
added contract or script. Do not treat this experiment as validation of those
concurrent changes.

## Token and execution-cost evidence

| Subject | T2 input, including cache | T2 output | CLI T2 nano-AIU |
| --- | ---: | ---: | ---: |
| A1 | 483,366 | 8,251 | 19,588,120,000 |
| B1 | 242,816 | 5,482 | 14,433,180,000 |
| B2 | 312,067 | 5,264 | 14,571,490,000 |
| A2 | Unavailable | Unavailable | Unavailable |

All forcibly terminated T1 phases lack terminal usage/checkpoint accounting.
A2 T2 does too. These are partial phase measurements, **not group totals**;
missing usage is null, not zero. Cached input dominates the available input
counts. No dollar cost is claimed: a billing-unit field is not a price or invoice.
Repeated A2 investigations/test attempts are visible in public events, but their
token cost and cognitively wasted work cannot be reconstructed reliably.

## Integrity, interpretation and limitations

* **H1, durable continuity contract: UNTESTED.** The initially inspected active
  implementation has no durable contract store, automatic recovery or independent
  engineering-state verification. Successful skill loading cannot test their value.
* **H2, existing skill total effect: INCONCLUSIVE primary comparison.** The
  frozen guard was invalid, the substantive six-test outcome had a ceiling, and
  the extra API constraint means overall task success was not perfect.
* No predeclared preliminary benefit threshold is met. No equivalence or
  statistical-significance claim is warranted. Observed completion/time differences
  merit replication only after fixing the experimental measurement design.
* One small local prototype, selected rather than randomly sampled; two repetitions,
  one default model and one CLI. Shared model/cache/service dependencies can
  correlate runs despite fresh sessions. Fixed order is not randomization.
* File-only fresh-context restart was real. Native compaction and cross-harness
  handoff were not executed and must not be relabeled as tested.
* Deterministic external outcome evaluation was independent of each implementer,
  but experiment ownership, hidden-test design, semantic report review and
  interpretation were not independently blinded.
* Source comments made decision recovery relatively easy. The pilot did not
  demonstrate that a harder unresolved decision would persist correctly.
* Tool working-directory/prompt isolation is not an OS sandbox. Available tool
  traces and clean preflight support isolation; there is no claim of a security
  boundary or an authorization/disclosure study.
* Freeze hashes detect changed retained inputs, not an independently witnessed
  preregistration timestamp. `.gitattributes` preserves artifact byte hashes
  across Git checkouts without changing the frozen sources.

## Next decision

**REVISE**, rather than promote or force an architectural conclusion.

1. Remove the implication that today's plugin implements a durable continuity
   contract; the implementation audit establishes that it does not.
2. Correct the overbroad test-file guard in a new experiment version. Add
   acceptance coverage for optional API limits and validation lifecycle cleanup;
   do not silently repair or rerun these subjects.
3. Replicate with randomized order, more independent runs and multiple workloads,
   including a decision whose rationale is not already encoded in source.
4. Add native compaction and a genuine second-harness handoff only when model,
   tool, budget and context controls can be independently verified.
5. If H1 remains the desired direction, first specify and implement that mechanism
   in a separately approved development phase, then compare competent practice,
   skill-only, durable-state-only and combined conditions. Ordinary documentation
   and notes remain permitted in every control.

Until then, the credible finding is narrow: both conditions produced working
retry-reliability code for the tested cases; the skill did not demonstrate a
correctness/continuity advantage, the primary experiment was inconclusive, and
one potentially favorable completion signal came with unrequested behavior.
No existing Golden Path mechanism change is earned by this pilot.

## Retained reproduction package

[Summary](results/summary.json), [baseline outputs](results/baseline.json),
[public scored evidence](results/evidence.json.gz),
[preflight evidence](results/preflight.json.gz), per-subject patches/evaluation
outputs and compressed partial/final source snapshots are retained under
[results](results). [Reproduction instructions](README.md) restore and re-evaluate
the candidates without the adjacent application or any original session home.
The post-run [summarizer](summarize.mjs) is reporting automation, not a changed
frozen evaluator or a new engineering platform.

### Verification of the retained package

After publication, all four final snapshots were restored into fresh directories.
All **41 candidate file hashes** matched their recorded evaluation identities
(10 each for A1/B1/B2, 11 for A2). Only then were evaluator-owned original test
bytes copied into each reproduction directory.

For every restored candidate, with `GP_CANDIDATE` pointing to it:

```powershell
node --test research\brownfield-continuity\evaluate.test.mjs <restored-candidate>\app\equipment.test.mjs
```

Result: **11/11 passed, zero failures, exit 0 in all four reproductions**.
The deliberately injected SQLite error appears in stderr as expected; the
rollback test passes only after checking the actual 500 response and zero writes.
This is reproducibility of the retained candidate/output observations, not new
model subjects or a correction of the invalid primary guard.

Research driver/reporting checks:

```powershell
node --test research\brownfield-continuity\experiment.test.mjs research\brownfield-continuity\analysis.test.mjs
node research\brownfield-continuity\experiment.mjs verify
```

Result: **6/6 passed**, and **20 frozen source hashes unchanged**. Export checks
found no private reasoning metadata or common credential patterns. Eight patch
artifacts were gzip-packed and byte-round-trip verified against original outputs;
their content, scores and source freeze were unchanged.
