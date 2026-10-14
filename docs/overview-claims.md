# What the overview diagram claims, and what backs each claim

Every element of [`docs/assets/golden-path-overview.png`](assets/golden-path-overview.png) (source:
[`golden-path-overview.html`](assets/golden-path-overview.html)), checked against the kit. **Solid** in the
image = shipped and tested, or a GitHub control you configure. **Dashed** = your process or optional; the kit
provides no tooling. Test names are in `tests/kit.test.mjs` unless noted.

| Element | Status | Backing |
|---|---|---|
| Human accountability: intent first, merge decision last | Method + GitHub controls | Skill (`plugin/skills/golden-path/SKILL.md`); merge is your branch protection |
| Product / domain expert own acceptance examples | Shipped (method + demo) | `examples/invoice-demo/acceptance/EXAMPLES.md`; frozen by `examples/make-demo.sh` ("frozen tasks and acceptance examples verified") |
| Legal / Compliance, Marketing & Sales as owners | Method only, no tooling (dashed) | Nothing in the kit is specific to them |
| Owners approve their part | GitHub control you configure | CODEOWNERS + "Require review from Code Owners" ([docs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)); tests "Code Owner approval on the current head authorises", "label without approval (triage adds label) fails" |
| Shared acceptance record | Adjusted: it is files, not a separate record | Demo: `examples/invoice-demo/tasks/T01.md` (intent) + `acceptance/EXAMPLES.md` + `acceptance/test_acceptance.py` (acceptance); constraints and claims are your process (dashed) |
| Coding agent "any harness, any model" | Adjusted to "your agent and model" | Verified: Copilot in VS Code (hook schema tests "hooks.json uses the documented schema…", "a snake_case (VS Code style) stop payload is understood"). Other agents get the skill/instructions only; untested |
| Implement / test / remediate "until checks pass" | Shipped and tested, **L2 only**, bounded | "the stop gate blocks while checks are red, then allows once they are green"; "block limit is recorded as FAILED…" (`max_blocks`, default 5). L1 enforces nothing |
| Model choice: local or cloud | Adjusted: optional skill that only recommends | `plugin/optional/skills/golden-path-local-models` (`--with-local-models`); test "local-model skill: separate, … recommends only" |
| PR: protected acceptance tests | Shipped and tested (L2 guard + gate) | "editing, creating or absolute-path editing an acceptance test is denied and names the owner"; "a changed acceptance test blocks the stop"; "weakening a protected test blocks the stop…" |
| PR: evidence | Method (skill's Report step); optional CI template | `--with-ci` → `.github/workflows/golden-path-check.yml` in your repo; test "CI template compares against the fixed PR base commit" |
| Durable boundary: CI, branch protection, code-owner review | GitHub controls you configure | [Protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches); the kit adds no gate of its own |
| Outcomes: reviewable PR, shipped behaviour | Result of the above | Not produced by the kit on its own |
| Golden loop (evidence back to owners, plan updates) | **Not in the kit** (dashed) | Your process; earlier wording "agents draft updates to marketing, sales and product plans" removed |
| Discipline: measured outcomes | Labelled: Level 3 is guidance only | `docs/LEVEL-3-EXPERIMENTS.md`; installer refuses `--level 3` (test "level 3 is docs only…") |

## End-to-end check (2026-10-14)

In a fresh clone: `bash examples/make-demo.sh <dir>` then `node simulator/refusal_scenario.mjs` →
an agent edit and a `sed -i` on `acceptance/test_acceptance.py` were **denied** (naming the owner); stopping
after an out-of-band change was **blocked** with a DELEGATION CHANGE; after `git restore` the stop was still
blocked because T01 was red. Implementing T01 in `invoice.py` plus a new test in `tests/` made the stop
**allowed** (`{}`). Editing the existing `tests/test_invoice.py` returned **ask**. README L1 and L2 install
commands ran cleanly in empty repos.
