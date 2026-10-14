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
