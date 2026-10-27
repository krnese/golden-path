# What the overview diagram claims, and what backs each claim

← [Golden Path README](../README.md) · [Documentation index](../README.md#documentation)

Every element of [`docs/assets/golden-path-overview.png`](assets/golden-path-overview.png) (source:
[`golden-path-overview.html`](assets/golden-path-overview.html)), checked against the kit. The image maps
responsibilities, not required software layers or a universal intent format. Its broader experience and runtime
claims are design aims, not demonstrated portability. Test names are in `tests/kit.test.mjs` unless noted.

| Element | Status | Backing |
|---|---|---|
| Experiences: developer, business, knowledge worker, operator | Illustrative starting points; not four verified integrations | [Background](background.md#7-separate-the-interface-from-the-authority) states the design position. No experience adapters ship in the kit. |
| Expressed intent can carry different outcomes, context, constraints and evidence expectations | Method and architectural position | Skill's Intent, Context and Boundary steps. Reliable translation across all these experiences has not been demonstrated. |
| Requester and decision authority may differ | Method; authority stays with existing owners and controls | The method grants no authority. The [experiment guide](LEVEL-3-EXPERIMENTS.md) separates outcome ownership, technical review and merge/deployment permission. |
| Engineering contract: outcome, context, boundaries, effects, uncertainty, authority, evidence and judgement | Agreement in existing records, not a schema or new store | [Contract definition](LEVEL-3-EXPERIMENTS.md#a-few-terms) and the method. Demo: `tasks/T05.md`, `acceptance/marketing/EXAMPLES.md` and the executable tests. The kit does not certify semantic completeness. |
| Agree enough for the next consequential action | Method, not an automated readiness validator | Context and Boundary precede permitted work. Bounded investigation can clarify the increment; protected executable acceptance must still be approved separately before its implementation session. |
| Implementation: investigate, build and test within the agreement | Method plus bounded L2 feedback | Tests "the stop gate blocks while checks are red, then allows once they are green", "the red block reason limits repair to the authorized scope", and "block limit is recorded as FAILED…". L1 provides guidance only. |
| Surface consequential changes for a decision | Method; narrow acceptance-integrity backstop | The delegation-change rule covers outcomes, constraints, effects and acceptance. The gate detects acceptance changes against a fixed base; it does not detect every semantic or external-effect change. |
| Evidence: expected vs actual, named revision, sources, conditions and gaps | Report convention; some mechanism checks | Skill's Report step; optional CI job summary. The repository's Golden Loop workflow checks evidence presence, not truth. See [evidence](evidence.md) and `tests/golden-loop.test.mjs`. |
| Passing examples supports, but does not decide, outcome acceptance | Method; observed in the invoice trial | [Round 1](examples/golden-loop/README.md#5-evidence-real-output-back-to-the-owner) passed T05 while output still left gaps for Marketing to judge. |
| Judgement: meets the need, needs revision, cannot yet judge | Owner decision; repository-specific issue-loop support | [Issue loop](LEVEL-3-EXPERIMENTS.md#keep-the-golden-loop-in-the-issue); `tests/golden-loop.test.mjs`. The workflow reopens merge-closed issues without the recognised owner decision; it is not a universal judgement or authorisation service. |
| Existing records and configured engineering controls | Ordinary repository records and GitHub controls you configure | Tasks, policies, examples, tests and PRs retain their roles. [Adoption checklist](ADOPTION.md) covers CODEOWNERS, required CI, branch protection and current-head approval. No installation grants merge, deployment or external-effect permission. |
| Golden loop: evidence informs the next intent; owners approve consequential revisions | Observed on bounded tasks; broader reliability unproved | [Two-round demo trial](examples/golden-loop/README.md) and [cloud-agent documentation trials](evidence.md#cloud-agent-golden-loop-trial-2026-10-26). Protected acceptance revisions require separate approval and a new implementation session. |
| Local hooks provide bounded feedback | Shipped and tested, L2 only | [Level 2](LEVEL-2.md): retry exhaustion is FAILED, unavailable evidence is UNVERIFIED, host timeouts can fail open. Hook availability does not establish equivalent runtime enforcement. |
| Copilot observations; broader experience and runtime portability remain to be tested | Explicit evidence limit | [Evidence summary](evidence.md) separates mechanism tests, workflow feasibility and unproved incremental value. [Level 3](LEVEL-3-EXPERIMENTS.md) proposes further experiments; no general portability result is claimed. |

## End-to-end check (2026-10-14)

(Run on the earlier Python version of the demo, before it was ported to Node.js; file names below are
the Python ones. The port keeps the same steps; the kit's demo tests and CI re-run the refusal scenario.)

In a fresh clone: `bash examples/make-demo.sh <dir>` then `node simulator/refusal_scenario.mjs` →
an agent edit and a `sed -i` on `acceptance/test_acceptance.py` were **denied** (naming the owner); stopping
after an out-of-band change was **blocked** with a DELEGATION CHANGE; after `git restore` the stop was still
blocked because T01 was red. Implementing T01 in `invoice.py` plus a new test in `tests/` made the stop
**allowed** (`{}`). Editing the existing `tests/test_invoice.py` returned **ask**. README L1 and L2 install
commands ran cleanly in empty repos.
