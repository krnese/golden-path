# Changelog

← [Golden Path README](README.md) · [Documentation index](README.md#documentation)

History of the kit. The current way to adopt it is in the [README](README.md); the evidence summary is in
[docs/evidence.md](docs/evidence.md). Version numbers follow `plugin/plugin.json`.

## Unreleased

- **Companion release review fixes.** Re-enable brief review after failed or
  accepted chat delivery when the view remains open, open full setup directly
  from the welcome action, and exclude tracked-but-deleted files from local
  workflow and declaration presence facts. Regression checks cover each case.
  Applying a supplied replacement brief resets an earlier owner expression to
  review, including when accepted delivery leaves the App open.

- **Ship the companion journey in both entry points.** The kit and generated
  method-only starter explain Guided briefing, continuing in existing Copilot
  chat and returning to Engineering evidence. Refresh real Guided and
  Engineering screenshots and document the empty state, targeted inspection
  links, snapshot limits and restart/update procedure. The starter still links
  the separate kit: no runtime or dependency bundle is added.
  Initial inspection failures also retain an accessible retry action before
  any valid snapshot has loaded; recovery preserves local drafts.

- **A clearer bridge to Engineering.** Explain each presentation's purpose and
  introduce technical inspection as looking behind the brief, not starting work.
  Guided links directly to check results and changes. Unrecorded projects get a
  calm Engineering empty state with an explicit path to full repository setup.

- **Briefing-first Guided iteration.** Replace the Guided dashboard and four-stage
  navigation with one outcome, selective missing-detail questions and an editable
  brief review. Complete conversation briefs go directly to review after explicit
  application. Returning work gets a compact changes/evidence/decision summary;
  failures remain prominent and full technical inspection stays in Engineering.

- **Clearer first-use App.** Guided and Engineering controls stay visible above
  the welcome screen and open either presentation directly. Guided uses plain
  language for the recorded agreement and a neutral no-work-yet summary for
  expected setup gaps, without suppressing actual inspection problems or
  recorded failures. Engineering retains technical detail and gap counts.

- **Brief, continue, return.** Guided can review a proposed brief from the
  existing conversation, send the reviewed message to Copilot and request App
  closure only after host acceptance. Failed sends preserve the view; failed
  closure is distinct and never triggers a resend. Returning summaries expose
  recorded changes, evidence and review gaps without a new progress database.
  An offline repository pulse inventories local definitions; explicit GitHub
  refresh uses existing CLI credentials and read-only queries for workflows, runs,
  issues, PRs and branch controls. Unknown permissions remain unknown, not empty
  success. Guided and Engineering remain separate, compact presentations.

- **Compact App typography and spacing.** Guided and Engineering remain separate
  presentations, with their existing stages, inspection tabs and review sidebar.
  Body text is 12px and the main title 18px; tighter cards, controls and section
  spacing reduce visual overhead without scaling the page or hiding caveats.
  Supporting text stays at least 11px and touch controls retain larger targets.
  The starter's real guided-preview screenshot reflects the compact layout.

- **Starter-to-App first-use journey.** The concise starter landing page now
  includes a real guided-preview screenshot and optional setup prompt. Installed
  guidance covers permission, prerequisite/conflict checks, actual server
  verification and host opening. A read-only verifier checks the expected
  registration, tools, repository binding and App resource without running
  project checks. Projects with no recorded sessions open a connected welcome
  view with an explicit chat/copy path; technical details stay available without
  fabricating acceptance, evidence or approvals. Native host rendering remains
  a separate verification step. The no-session loopback preview accepts both
  queryless and empty-query inspection requests across supported Node versions.

- **Outcome-first starter landing page.** The generated README now leads with
  the value, one first-task prompt and a concise explanation of its limits.
  Optional App setup, maintenance and legacy registration migration live in a
  linked kit guide, not in the first-time starter journey. The method-only
  footprint and all setup behavior are unchanged.

- **Windows inspection root identity.** Engineering inspection and retained
  evidence compare repository paths using native path equivalence, accepting
  drive-letter case differences from the Copilot host while still rejecting
  nested repository directories and evidence from another repository.

- **Native Copilot harness MCP configuration.** The checkout and optional setup
  helper now use workspace-root `.mcp.json` with `mcpServers`, relative server
  arguments and an explicit allowlist of the two read-only inspection tools.
  The helper refuses existing native/legacy conflicts rather than overwriting
  settings or silently registering duplicate servers. Starter instructions cover
  migration, path portability, restart and removal of the old registration.
  No MCP App runtime or acceptance-control behavior changed.

- **Change-scoped adoption for new applications, teams and brownfield repositories.**
  The shared skill, task prompt and generated starter now guide outcome-first
  bootstrap with real checks, parallel work against owner-approved acceptance,
  and additive adoption in existing applications. Repository hardening requires
  explicit maintainer permission and verification of effective settings; the
  guidance does not add an automatic scaffolder, settings applier or approval
  service. Local App snapshots and private chats are not shared authority.

- **Optional MCP App setup carried by the starter.** The generated README now
  includes explicit setup, update and disable instructions using a separate kit
  checkout. A conflict-refusing configuration helper binds the server to the
  application without installing dependencies or acceptance controls there.
  Engineering inspection now supports method-only applications with absent
  gate configuration reported as unavailable, not invented checks or passes.

- **Consistent GitHub Pages palette.** The landing page now matches the MCP App's
  navy, cyan, violet and gold colors, including diagrams, check states, controls
  and favicon. Contrast and palette-parity tests preserve legibility; original
  recorded evidence and vendor glyphs are unchanged.

- **Read-only engineering inspection MCP App.** Inspect existing session/task
  sources, acceptance artifacts, fixed-baseline changes, actual retained gate
  results and boundary findings in compact tabbed views. "Why does this exist?"
  separates verified source links, inferred text-ID hints and unavailable
  rationale; "Agreement delta" flags contract/control source changes without
  claiming semantic enforcement. An explicit terminal-only capture helper
  retains existing gate JSON and local provenance; the App cannot run checks or
  modify acceptance. Missing, skipped and stale results stay distinct from
  current passes. Default workspace configuration is now read-only; the older
  isolated editor requires explicit `--state`. No core kit controls changed.
  Guided and engineering presentations share the same inspection. Outcome-first
  questions prepare human-readable proposals and explicit owner messages for
  the existing acceptance review process; optional host-supported chat sharing
  has a copy/paste fallback. No approval store or automatic acceptance promotion
  is introduced. Non-professional developer acceptance still needs a human trial.

- **Optional MCP Apps experience prototype.** Inspect requirements, assumptions
  and their traceability in an isolated example model shared by chat tools and
  the App. Draft-only writes use revision checks, a cross-process lock and atomic
  replacement; baseline examples remain locked. The separate adoption report is
  still read-only. Uses the official MCP Apps SDK, a bound stdio server and a
  labelled loopback validation host. No business approval, real acceptance edit,
  project-check execution or GitHub change is introduced. Dependencies stay
  isolated from the core kit and starter; native VS Code rendering must be
  validated separately from protocol and browser tests.
  The review UX uses plain-language prompts, connected assumptions, protected
  unsaved edits and a saved-state conversation handoff rather than a technical
  model editor or approval dashboard. Non-engineering usability remains to be
  tested with actual decision owners.

- **Minimal greenfield GitHub starter template.** Generate a clean, method-only
  application starting point with `node examples/make-starter.mjs "<empty-dir>"`.
  It reuses the Level 1 installer, includes the copied kit's license notice and
  first-task guidance, and refuses nonempty destinations. It contains no kit
  development tree, sample acceptance, fictional owners, runtime dependencies
  or fake passing checks. The README now distinguishes the dedicated GitHub
  template for greenfield adoption from installation into existing repositories.
  New `tests/starter.test.mjs` cases cover contents, reproducibility, refusal,
  licensing and reviewed upgrades. Installer block updates also consume CRLF
  separators correctly, avoiding spurious trailing blank lines on Windows.

- **Guided adoption for new and existing applications.** The existing skill now
  guides one task-first setup journey, reusing current tests, CI and ownership.
  `gate.mjs adoption --target "<repo>" [--github] [--json]` provides read-only
  configuration evidence with verified/missing/unverified findings and next steps.
  Optional GitHub inspection reads default-branch rules and legacy protection;
  no project commands, settings changes, state writes or business approval are
  implied. Method-only installs remain code-free and checked installs keep one
  script. Document application-template guidance and normal-install Golden Loop
  limits. Null-delimited file discovery preserves leading whitespace, and the
  command documentation requires source inspection before use on older installs
  whose unknown commands would invoke the stop gate. New `tests/adoption.test.mjs`
  cases run in the existing CI matrix.

- **Golden Loop: the evidence check reads tables as GitHub renders them.** Copilot's last review of #44 found
  three parser gaps. A GFM delimiter cell may have a single hyphen (`| - | - | - |`), so a valid filled table
  is no longer reported missing. HTML comments are found outside inline code only: `` `<!-- retained -->` `` in
  a cell is visible output, and an unterminated `<!--` hides everything after it, as on GitHub. Tables inside
  fenced code blocks (backticks or tildes, any length, with or without an info string) are code, not
  evidence; inline-code cells outside fences are kept. New tests: `tests/golden-loop-parser-gfm.test.mjs`;
  existing tests unchanged. Copilot's review of #45 then showed that a backtick in one table cell could pair
  with a backtick in another and hide a comment that leaves Actual empty. In table rows, code spans now stay
  within their cell, as on GitHub; prose outside tables is unchanged. New tests:
  `tests/golden-loop-parser-cells.test.mjs`. Further review tightened table-mode boundaries: recognised
  delimiter rows retain table mode even with single hyphens and omitted outer pipes, and only visible
  headers with matching delimiter cell counts can start it. Hidden separators end table mode so later
  prose keeps its inline-code handling. Visibility and evidence now reuse the same recognised headers, so
  removing a hidden pipe cannot repair an invalid header and count prose as evidence. New regressions in
  `tests/golden-loop-parser-boundaries.test.mjs` run in the CI matrix; existing tests are unchanged.

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
