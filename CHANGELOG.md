# Changelog

← [Golden Path README](README.md) · [Documentation index](README.md#documentation)

History of the kit. The current way to adopt it is in the [README](README.md); the evidence summary is in
[docs/evidence.md](docs/evidence.md). Version numbers follow `plugin/plugin.json`.

## Unreleased

- **Background article** ([docs/background.md](docs/background.md)): why Golden Path exists and how it evolved,
  from the outcome-first V0 lifecycle through the retired structured-state architecture, the NO CHANGE studies,
  the demoted learning loop and retired research runner, to today's bridge (Intent → Context → Boundary →
  Acceptance → Implementation → Proof → Report). States the central principle (separate the AI interface from the
  repository controls that hold authority; the anchor is not any particular AI, including GitHub Copilot) and its
  caveat (only if branch protection or rulesets and CODEOWNERS are enabled and not bypassable). Four Mermaid
  diagrams labelled Verified / Partly verified / Proposed; historical ideas, findings, current implementation and
  future direction are labelled separately, with first-hand and public sources. Added to the README
  documentation index.
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
