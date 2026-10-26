# Evidence

← [Golden Path README](../README.md) · [Documentation index](../README.md#documentation)

Golden Path's incremental value is **unproved**. This is the honest summary; the full studies are in
[archive/research](../archive/research/README.md).

## This repository's own experiments

They found no measurable benefit from method guidance:

- continuing-delegation: 36 subjects, NO CHANGE (12/12 vs 12/12), with a ceiling effect and +13.9% time.
- csv-smoke: n=1; method loading was not demonstrated.
- brownfield: 2 per arm, outcome ceiling (4/4), INCONCLUSIVE. **Corrected:** the evaluator's guard counted *any* change to the existing test file as tampering. The three flagged subjects had only *added* tests, which the task allowed. Under the corrected rule (the kit's own test-integrity rule), no subject tampered with tests. See [CORRECTION.md](../archive/research/brownfield-continuity/CORRECTION.md). The correction applies the rule to recorded facts; the original evaluator wasn't in this repo to re-run.
- distributed-coherence: existing gates were enough.
- decision-validity: 0/16 executed.

So the kit keeps guidance minimal and puts the effort into protecting what the expert owns.

## Three different evidence questions

| Question | Evidence available | Limit |
| --- | --- | --- |
| Do specific mechanisms behave as intended? | Kit tests for installation, guards, fixed-baseline integrity and owner approval | Tests cover specified cases; protection is heuristic, not tamper-proof |
| Can the owner/developer workflow run end to end? | [Two-round trial](examples/golden-loop/README.md) with Copilot in VS Code | One model, one demo task and one person playing the owner; no productivity measurement |
| Is the kit better than competent existing practice? | Not established by the available studies or demo | Requires matched comparisons and owner/developer usability evidence |

The trial's unchanged acceptance files show what happened in that run; the agent did not try
to edit them. Refusal evidence comes from kit tests and the scripted scenario. These sources
must not be combined into a claim that naturally occurring tampering was prevented in the trial.

The [adoption checklist](ADOPTION.md) packages a proposed setup path. Its existence is not evidence
of adoption demand or that independent owners can use the workflow without assistance.

## Issue-linked validation rehearsal (2026-10-26)

**The mechanisms worked in this local run. The full business-and-engineering
pilot has not run.** The request, investigation, results and pending owner
decision are captured in [issue #35](https://github.com/krnese/golden-path/issues/35).
It was opened after documentation work began, not before it.

The starting commit was `6418168b4594262743e16ea206b2344e1261a0af`, matching the
remote default branch at the start. Execution used Windows and Node.js
`v24.19.0`, with uncommitted documentation changes. The issue records the checked
document hashes; no implementation or protected-test changes were made.

| Question or check | Expected | Observed | What this does not establish |
| --- | --- | --- | --- |
| Full CI-equivalent local test selection | Existing tests pass without skips | 130 passed, 0 failed, 0 skipped | Other OS/Node combinations or CI for the uncommitted changes |
| Configured completion gate and integrity | PASSED against the recorded baseline | PASSED; 29 configured tests passed; test and acceptance integrity checks succeeded | Business acceptance: this repository has no configured acceptance paths or command |
| Scripted refusal in a generated demo | Deny edit and shell mutation; block an out-of-band acceptance change | Both denied; stop blocked with DELEGATION CHANGE; restored acceptance no longer failed integrity | Naturally occurring agent misconduct or a tamper-proof boundary |
| Demo baseline | Developer tests green; unimplemented acceptance red | 7 developer tests passed; acceptance had 1 pass and 25 failures, as expected; frozen files unchanged | An implemented business change; the intentionally red demo is not a completed feature |
| Separate-context reconstruction | Recover the request from the issue and repository without a supplied chat recap | One read-only agent recovered intent, boundaries, missing acceptance, relevant implementation/tests and evidence requirements; no parent transcript access was reported | Fresh host-session or persistent-memory isolation, independent human understanding, or successful implementation |
| Evidence back to the issue | Preserve the request, actual results, limits and pending decision | Results returned to the same issue; owner judgment remains pending | A completed issue-initiated implementation PR or owner acceptance |

The reconstruction probe was supplied the issue reference and read-only
instructions, not the earlier conversation or a solution. Its source-backed
account identified the installer, start/guard/stop hooks, fixed-baseline checks,
CI and existing tests. It also identified two material setup limits:

- The configured acceptance owner is a placeholder, with no business acceptance
  paths or command. Passing the gate is not evidence that business examples
  have been met.
- Repository ownership comments describe Code Owner enforcement as off for this
  single-maintainer setup. Live GitHub rules were not independently verified.
  Repository ownership is not a substitute for named pilot participants.

These are descriptive observations from one probe, not a scored comparison.
There was no independent business-owner or engineer usability assessment.
Retry exhaustion and host timeout remain documented limitations of local hooks;
the run does not support a claim that stopping while red is impossible.

The [baseline CI run](https://github.com/krnese/golden-path/actions/runs/40290965779)
passed for the starting commit. It is **not** CI evidence for the uncommitted
documentation changes. Raw local TAP and demo output were retained with the
validation session; the generated demo was removed after its integrity checks.

**Next real-workload step:** select a bounded non-AI change, name the owner and
engineer, approve its examples and executable acceptance in a separate change,
then start the implementation session. The
[experiment guide](LEVEL-3-EXPERIMENTS.md) describes that pilot and the separate
matched comparison needed to assess incremental benefit. No productivity,
portability, adoption or full-P0 success claim follows from this rehearsal.

## Cloud-agent Golden Loop trial (2026-10-26)

**The Golden Loop ran in the Copilot cloud agent, but two things failed at the
handoff to review.** One task, one run, documentation only. Observations and
links are recorded in [issue #35](https://github.com/krnese/golden-path/issues/35).

Issue [#38](https://github.com/krnese/golden-path/issues/38) ("Add a Golden Loop
issue template", written as an owner request with examples E1–E3) was assigned
to the Copilot cloud agent at about 12:57 UTC. It opened draft PR
[#39](https://github.com/krnese/golden-path/pull/39) within seconds and finished
in about 4 minutes. The owner approved the CI runs; all 10 checks passed and the
PR was merged at 13:09:47 UTC as `c68c180`.

| Question | Observed | What it does not establish |
| --- | --- | --- |
| Did the agent read the method? | The session log shows a `golden-path` skill call and a read of `METHOD.md` before any edit | How the content influenced its decisions |
| Did it stay inside the boundary? | Only two issue-template files changed; no workflows, tests, kit files, `plugin/` or README | Behavior on a task that tempts a protected edit; the guard was not exercised |
| Did it validate its work? | The session log shows the configured gate (29/29) and the full suite (130/130) run in the sandbox | These are sandbox results, not CI; CI ran separately after owner approval |
| Did the hooks run? | `.golden-path/ledger.jsonl`, which is git-ignored, existed in the sandbox before the agent's first edit, consistent with the start hook | Whether the stop gate ran: the sandbox ledger is discarded when the job ends |
| Did evidence reach the reviewer? | **No.** Expected versus actual for E1–E3, uncovered cases and an owner warning appeared only in the session log. The final PR description was a three-line summary, although the agent stated the evidence was in the PR | Why the summary replaced it; this compares a claim with an artifact, not with the model's intent |
| Did the owner decide closure? | **No.** The platform appended `Fixes #38`. The agent noticed and flagged it only in the log. The issue closed 2 seconds after merge, before the owner's judgment was recorded; it was reopened | Whether a merge-time control would be used reliably |

GitHub's [hooks reference](https://docs.github.com/en/copilot/reference/hooks-reference)
documents the cloud-agent differences that matter here: only `bash` hook entries
run, on Linux; a `preToolUse` decision of "ask" is treated as "deny"; `agentStop`
can block, but each retry counts against the job timeout; and files written by
hooks are discarded. Copilot code review reported that it could not review the
changed files. Actions runs on the agent's PR waited for the owner's approval,
which is GitHub's default.

**The owner's judgment of the template (E1–E3) is pending on #38.** These results
show the loop can run in the cloud agent, not how reliably, and say nothing about
code-quality risk.

## External sources

- Added context rarely helps capable models and costs more:
  - AGENTS.md study, Gloaguen et al., [arXiv 2602.11988](https://arxiv.org/abs/2602.11988): about +20% cost, about ±3% success.
  - Arena, [ACM CAIS 2026](https://dl.acm.org/doi/full/10.1145/3786335.3813233): extra orchestration gave no correctness gain.
- Agents game tests they can write. Hidden tests nearly eliminate this, and read-only tests stop edits: ImpossibleBench, [arXiv 2510.20270](https://arxiv.org/abs/2510.20270) (ICLR 2026).
- Vendors put the discipline into enforceable checks:
  - [OpenAI, harness engineering](https://openai.com/index/harness-engineering/).
  - Anthropic, [harness design](https://www.anthropic.com/engineering/harness-design-long-running-apps).
- Field productivity effects are still unsettled: [METR, 24 Feb 2026](https://metr.org/blog/2026-02-24-uplift-update/).
- Spec-driven tools ([Spec Kit 1.0.0](https://github.com/github/spec-kit/releases/tag/v1.0.0), [Kiro](https://kiro.dev/docs/specs.md)) cover specs and acceptance criteria. I did not find, but also did not rule out, protection of expert-owned acceptance tests from the implementing agent.

## Measuring it on your own work

Use the matched-experiment guide in [LEVEL-3-EXPERIMENTS.md](LEVEL-3-EXPERIMENTS.md). Retain the comparison
with the team's current plain agent, but use competent existing practice as the primary baseline for
incremental kit value: the same approved acceptance, required tests, ownership and review, without
Golden Path-specific guidance/hooks. Keep the model, client/harness, tasks and independent scoring equivalent.
Measure setup and owner-review effort as well as execution. Lessons on/off measures only retained lessons,
not the whole kit. This is an evaluation proposal, not a completed pilot.
