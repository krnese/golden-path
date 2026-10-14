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

Use the matched-experiment guide in [LEVEL-3-EXPERIMENTS.md](LEVEL-3-EXPERIMENTS.md). The primary comparison
is Golden Path vs a plain agent (same agent command, model, tasks and acceptance tests; kit removed from the
worktree). Lessons on/off measures only the benefit of retained lessons, not of Golden Path as a whole.
