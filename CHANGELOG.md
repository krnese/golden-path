# Changelog

← [Golden Path README](README.md) · [Documentation index](README.md#documentation)

History of the kit. The current way to adopt it is in the [README](README.md); the evidence summary is in
[docs/evidence.md](docs/evidence.md). Version numbers follow `plugin/plugin.json`.

## Unreleased

- **Golden Loop: the evidence check reads tables as GitHub renders them.** Copilot's last review of #44 found
  three parser gaps. A GFM delimiter cell may have a single hyphen (`| - | - | - |`), so a valid filled table
  is no longer reported missing. HTML comments are found outside inline code only: `` `<!-- retained -->` `` in
  a cell is visible output, and an unterminated `<!--` hides everything after it, as on GitHub. Tables inside
  fenced code blocks (backticks or tildes, any length, with or without an info string) are code, not
  evidence; inline-code cells outside fences are kept. New tests: `tests/golden-loop-parser-gfm.test.mjs`;
  existing tests unchanged.

- **Golden Loop: fix the six review findings on #41; a PR can no longer change the check that judges it.**
  The evidence check now runs on `pull_request_target`, so the workflow file and the script both come from the
  base branch; it checks out only the base commit with a read-only token and runs no PR code. The first version
  used `pull_request`, which takes the workflow file from the PR, so a PR could have made the check a no-op.
  Evidence now requires a table row per example with Expected and Actual filled in: the unchanged template row,
  placeholders and IDs mentioned only in prose no longer count. Without an owner named by @username, no judgment
  is recognised (the issue template now asks for one). Issue lookup failures are UNVERIFIED and fail instead of
  "not applicable". Double-backtick code spans and other repositories' `owner/repo#N` references are ignored.
  The second cloud-agent trial (#42 → #43), which used the first version, is recorded in
  [docs/evidence.md](docs/evidence.md). New tests: `tests/golden-loop-review.test.mjs`; existing tests unchanged.
  A further review on #44 tightened the table parser: Expected, Actual and the example must be distinct
  columns, rows without outer pipes count, formatted placeholders (`**TBD**`, `` `…` ``) don't, and an unmatched
  backtick no longer hides a real reference. New tests: `tests/golden-loop-parser.test.mjs`.

- **Golden Loop: the owner's decision stays in the loop, and agent evidence must reach the PR.** A cloud-agent
  trial (#38 → #39) showed two failures at the handoff to review: the agent's per-example evidence stayed in its
  session log, and a platform-added `Fixes #38` closed the issue on merge before the owner had judged it. The
  skill's Report step now asks for the report in the PR description and for `Refs #N` instead of a closing
  keyword. This repository adds a PR template, the `golden-loop` label on its issue template, and a
  [Golden Loop workflow](.github/workflows/golden-loop.yml) that reopens a `golden-loop` issue closed by a merged
  change before the owner's `Owner judgment: meets the need`, and fails a PR working on such an issue whose
  description lacks expected versus actual for every example. It runs the trusted script (default branch or PR
  base), is not a required status, and checks the presence of evidence, not its truth. Replayed against #38's
  real history it would have reopened the issue. (Superseded in part by the entry above: the PR trigger let a
  PR change the workflow file.) New tests:
  `tests/golden-loop.test.mjs`.

- **Installer: `--protected` for developer tests outside `tests/`, and a warning when they'd go unguarded.**
  A pilot on an existing repository whose tests live in `test/` showed that with the default `tests/**` an agent
  could edit or weaken developer tests unnoticed (no `ask`, no weakening block). `--protected "<glob>"`
  (repeatable, first install) sets the guarded paths; the installer warns on stderr when the protected paths
  don't exist and names a likely folder and the exact flag. Existing configs are still never overwritten; a
  rerun with `--protected` says it was not applied. The gate script is unchanged. New tests:
  `tests/installer-protected.test.mjs`.
- **CI template: set up the project before running its tests.** In the same pilot, the `--with-ci` check
  failed on GitHub with `ERR_MODULE_NOT_FOUND` because it ran the adopter's tests without installing anything.
  The workflow now sets up Node.js 24 (pinned) and runs `.golden-path/ci-setup.sh` if present, otherwise
  `npm ci --ignore-scripts` for a `package-lock.json`. Adopters put their setup in that script instead of editing
  the kit file. ADOPTION notes that rulesets and Code Owner enforcement aren't available on private repos under
  GitHub Free (seen in the pilot) and gives a read-only `gh api` check of the effective rules. New tests:
  `tests/ci-template.test.mjs`.

- **Owner loop: evidence the owner can judge, and the verdict on the PR.** The skill's Acceptance step now
  checks that the session starts from the owner's latest acceptance, and asks that drafted acceptance be its own
  owner-approved change with each test named after its example's ID and a plain example/test/what-it-checks table.
  The Report step asks for the real output for each example next to the expected result, the cases the examples
  do not cover, and a pointer to the PR's check results. The `--with-ci` workflow writes the gate's verdict
  (outcome, PR base, each check, whether protected acceptance changed, failing tests, any revision authorisation)
  to the job summary; missing output is shown as UNVERIFIED. The local ledger is still never uploaded.
  The gate script is unchanged. New tests: `tests/feedback-loop.test.mjs`.

- **Landing page: Fluent-inspired visual treatment.** Segoe UI and upright headings,
  cool neutral surfaces, blue actions, subtle borders and lighter shadows replace
  the warm serif/cream/forest-green palette. The gold path and owner-feedback loop,
  invoice story, controls, recorded evidence and static fallbacks remain. SVG colors
  share the stylesheet's theme rather than retaining the previous palette.

- **Landing page: a visual story, not six text panels.** A short AI-led promise and visible first-task
  action lead into changing invoice, acceptance, implementation and review artifacts. Six captions
  match six stages; failure, code repair and pass happen within the checks stage. A moving paper
  token carries work and evidence, with a separate coral repair route and a prominent gold owner-feedback
  return. The approved examples stay fixed during repair. Technical mechanics and full trial records
  are expandable, while enlarged before/after evidence and honest limits stay visible. Copilot
  verification is a support label, not a claim about other integrations. Protected acceptance and
  deployment settings are unchanged.

- **Landing page: intent first, with an interactive invoice story.** Explain the installed components,
  expert–engineer partnership and value alongside existing tests and repository controls. A six-step,
  clearly illustrative walkthrough shows repair back to implementation and owner feedback back to the
  next approved acceptance increment. Playback is opt-in, with pause, replay, keyboard exploration,
  reduced-motion and no-JavaScript fallbacks. Recorded evidence and limits remain separate; enlarged
  before/after details and transcripts make the real trial easier to inspect. Protected acceptance,
  runtime behavior and deployment settings are unchanged.

- **A clearer first-use experience and static landing page.** The README explains the everyday
  conversation, and [Your first task](docs/USER-GUIDE.md) leads with goals, agreed examples and real
  results rather than this repository's test suite. A dependency-free [landing page](site/README.md)
  shows the checked loop, actual trial evidence, repository authority and honest limits. Builds
  support GitHub Pages and a later custom domain; source checks do not automatically deploy or merge.
  No runtime behavior or protected acceptance tests changed.

- **Positioning, adoption and licensing.** Golden Path is positioned as a lightweight kit for
  owner-controlled acceptance, for engineering leads working with domain owners. README makes L2 the
  primary path and distinguishes check-only installation from configured acceptance and GitHub review.
  New [adoption checklist](docs/ADOPTION.md) covers setup, owner-readable evidence, verification and revisions.
  The evaluation guide adds a competent-practice baseline and owner/developer effort measures, without
  claiming a pilot has run. Mechanism, workflow and incremental-benefit evidence are distinguished.
  Added the [MIT License](LICENSE), copyright 2026 Kristian Nese, and aligned plugin metadata.
  No runtime behavior or protected tests changed.

- **Gate: no-change fast path; deliberate fast check; clearer timeouts.** A stop with HEAD still at the session base and a clean working tree (gitignored gate state/ledger ignored) allows immediately and records `gate_skipped_no_changes` — no check or acceptance command runs (not a pass; git failure falls back to running checks). The configured `check` must be a fast command that fits `hook_budget_sec` on a developer machine; full suites belong in CI. This repo's check is now the packaging + installer + self-install subset (~2s locally); the full kit suite stays in the required CI jobs. A check that overruns is UNVERIFIED, says plainly it is not a test failure, and still counts toward terminal FAILED. Installer treats CRLF-only drift as identical to LF kit sources (`.gitattributes` already pins `eol=lf`; stale Windows checkouts no longer look like real drift).

- **Gate: terminal FAILED after retries; this repo's check no longer picks up the demo.** After `max_blocks` the session stays FAILED: later stops in the same session allow at once, run no checks, keep outcome FAILED, and record `gate_terminal` (not a pass). A new session restarts the budget. The red-block reason now says results do not expand the user's assignment — repair only within the authorized scope, otherwise report the blocker and stop. This repository's `.golden-path/config.json` `check` is now `node --test tests/*.test.mjs` (kit + self-install only); the invoice demo's intentionally red acceptance stays out of the hook and is still asserted in CI and the demo kit test. New kit tests for terminal exhaustion, no post-terminal checks, new-session restart, ledger permanence, and scope wording.
- **Background article** ([docs/background.md](docs/background.md)): why Golden Path exists and how it evolved,
  from the outcome-first V0 lifecycle through the retired structured-state architecture, the NO CHANGE studies,
  the demoted learning loop and retired research runner, to today's bridge (Intent → Context → Boundary →
  Acceptance → Implementation → Proof → Report). States the central principle (separate the AI interface from the
  repository controls that hold authority; the anchor is not any particular AI, including GitHub Copilot) and its
  caveat (only if branch protection or rulesets and CODEOWNERS are enabled and not bypassable). Four Mermaid
  diagrams labelled Verified / Partly verified / Proposed; historical ideas, findings, current implementation and
  future direction are labelled separately, with first-hand and public sources. Added to the README
  documentation index.
- **Background: repository ruleset honesty.** `docs/background.md` now records that the Kit guarantees
  jobs and the whitespace check are required on `main`, that `.github/CODEOWNERS` names `@krnese` (PR #23),
  and that Code Owner review stays off on purpose for a single maintainer (see `docs/LEVEL-2.md`).
- **Repository: CODEOWNERS for the kit, enforcement off on purpose.** Added `.github/CODEOWNERS` (owner
  `@krnese`) covering the default, `plugin/`, `.github/` (hooks, skills, prompts, workflows, scripts,
  instructions, CODEOWNERS itself), `AGENTS.md`, `.golden-path/config.json`, `tests/` and the invoice demo's
  acceptance and tasks. "Require review from Code Owners" stays off because the repository has a single
  maintainer who can't approve their own PRs. `docs/LEVEL-2.md` gains "Code Owner review for single-maintainer
  repos" with the safe way to enable it (second owner first, or an admin pull-request-only bypass).
- **Gate: clearer acceptance-integrity failures; start a new session after an owner change.** In round 2 of the
  golden-loop trial the owner committed new acceptance (T06) inside a running Copilot session, and the gate
  correctly recorded FAILED against the session-start base, without saying which base it used or what to do. A
  failing acceptance-integrity result now names the base and how it was chosen (`Compared with base 65ef920
  (session start)`; also `first stop` or `--base`), and records `base_sha`, `base_source` and
  `committed_since_base`. When the changed files are already committed between base and HEAD, the stop gate
  tells the user to start a NEW chat/session so the owner commit becomes the base, and tells the agent not to
  revert or rewrite those commits; `check --base` points to the authorised-revision PR. The check itself is
  unchanged (fail closed, no automatic re-base). New kit tests; LEVEL-2, VERIFY-IN-VSCODE (check 8c) and one
  skill line updated.
- **Golden loop walkthrough** ([docs/examples/golden-loop/README.md](docs/examples/golden-loop/README.md)): the
  real two-round trial (T05, T06) with screenshots, gate verdicts, who decided at each step, what it proves and
  doesn't, and Windows steps to run it yourself. README: new opening, "See it work", capabilities, a 30-second
  quickstart and an updated "What's verified today"; overview claims updated for the trial.
- **T06 (Marketing) acceptance: plain-language reasons, name every duplicated product.** New `tasks/T06.md`,
  EXAMPLES section and `acceptance/marketing/t06.test.mjs`; added to the demo acceptance command (red until
  implemented). Supersedes T05's "summary reason names every flag code" clause (T05 test amended). FREEZE re-pinned.
- **Invoice demo ported to Node.js (no Python) and T05 (Marketing) enabled.** The app (`invoice.mjs`, exact
  `Decimal` money on BigInt, half-up rounding, JS numbers refused like Python floats), the developer tests
  (`tests/invoice.test.mjs`) and all acceptance tests (Finance `acceptance/t01..t04.test.mjs`, Marketing
  `acceptance/marketing/t05.test.mjs`) are `node:test` ports of the Python files with the same examples and
  assertions, one file per increment. New cross-platform builder `examples/make-demo.mjs` (`make-demo.sh` is now a
  wrapper). The acceptance command runs T01 and T05 (`node --test --test-reporter=tap acceptance/t01.test.mjs
  acceptance/marketing/t05.test.mjs`), so the L2 stop gate holds the agent to both; both stay red until
  implemented. Tasks, EXAMPLES, `FREEZE.sha256`, refusal scenario, kit demo test (now also on Windows) and CI
  (demo on Ubuntu and Windows) updated. The ported acceptance files need owner approval (Finance, Marketing).
- **Self-install (dogfooding).** The repository has its own kit installed at Level 2 (skill, instructions
  block, hook, `.golden-path/config.json` with `node --test` as the check), so a fork or clone works with
  Copilot in VS Code on open. `plugin/` stays the source of truth; `tests/self-install.test.mjs` (also a CI
  step on Ubuntu and Windows) fails if the installed copies drift. README: "Two ways to use Golden Path" and an overview
  diagram (`docs/assets/golden-path-overview.png`, HTML source alongside) whose claims are checked in
  `docs/overview-claims.md`; parts not yet validated are labelled in the text. Kit files keep LF on Windows
  (`.gitattributes`) so the installer's hashes match.
- README rewritten for adopters: pitch, how it works, three levels with quickstarts, limits, examples.
  History moved here; level 2 detail moved to [docs/LEVEL-2.md](docs/LEVEL-2.md); evidence moved to
  [docs/evidence.md](docs/evidence.md).
- New example: [Connecting your own reasoning boundaries](docs/examples/hybrid-workflow.md).

## 3.1.0-preview.1

- **Review fixes (PR #13).** Authorised acceptance-revision path: a separate PR labelled
  `golden-path:acceptance-revision` passes only with an APPROVED review on the current head commit by a
  Code Owner of every changed acceptance file (CODEOWNERS and config read from the base commit). One time
  budget (`hook_budget_sec`) covers the whole hook run including git and provenance reads. An invalid,
  shallow or unreadable baseline is UNVERIFIED, never PASS. The Python research runner is retired to
  `archive/research-runner`; Level 3 is documentation only and the installer rejects `--level 3`. The CI
  template test tolerates CRLF checkouts on Windows. Local-model skill notes on privacy, Agent Host BYOK,
  unloading models and verified Foundry Local facts.
- **Optional local-model skill (PR #12).** `golden-path-local-models`, recommend-only, installed with
  `--with-local-models`.
- **Windows CI (PR #11).** A timeout kills the whole process tree; the guard uses canonical paths (8.3
  names, symlinks); CRLF-safe frontmatter test.
- **v3.1 hardening and Node.js port (PR #10).** Gate and installer ported to Node.js 22+ with built-ins
  only; kit tests ported to `node --test`; integrity checks compare against a fixed base commit;
  regressions for base, budget, owner review, L1 wording and CRLF. Node installer for the demo and a
  scripted refusal scenario. Research scoring against a fixed baseline SHA. Brownfield evidence corrected:
  test additions are not tampering. Pitch reframed; branch protection and review named as the durable
  boundary.

## v3 (PR #9)

- Adoption levels, one hook script, expert-owned protected acceptance tests.
- Learning, ledger summary and A/B runner moved to `research/` as opt-in Level 3 (later retired).
- Invoice demo with expert-written acceptance examples and a scripted refusal scenario.

## v2 (PR #8)

- Rebuilt as a distributable `.github`-native kit: one skill, one agent, hooks, as an Agent Plugin.
- Idempotent, conflict-refusing copy-in installer.
- Invoice demo adopter repo with frozen tasks; kit and demo tested in CI.
- v1 content archived under [archive/](archive/INDEX.md).

## v1 (PRs #2 to #7)

- Method-only Golden Path (Understand → Bound → Engineer → Prove → Report), governance controls and the
  falsification studies summarised in [docs/evidence.md](docs/evidence.md). Archived in
  [archive/README-v1.md](archive/README-v1.md).
