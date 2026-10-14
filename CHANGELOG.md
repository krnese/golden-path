# Changelog

History of the kit. The current way to adopt it is in the [README](README.md); the evidence summary is in
[docs/evidence.md](docs/evidence.md). Version numbers follow `plugin/plugin.json`.

## Unreleased

- **Demo: T05 (Marketing) enabled.** `examples/make-demo.sh` now passes
  `python3 -m unittest acceptance.test_acceptance.T01 acceptance.marketing.test_acceptance.T05` as the acceptance
  command, so the L2 stop gate holds the agent to T05 as well as T01. T05 tests are unchanged (still red until
  implemented).
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
