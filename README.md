# Golden Path v3.1 (preview)

**Help people express business intent as reviewable engineering acceptance, then connect it to the
controls they already use.**

> **Core principle:** the expert and engineer decide what needs to be true; automation checks the parts
> they have made executable.

The business-context expert (product owner, finance, operations…) owns the **intent** and the **acceptance
examples**. Those examples become **protected acceptance tests** the agent may read and run but not change.
Any change to them goes back to the expert as a *delegation change*. The engineer and Copilot's default agent
do the work. Golden Path adds one skill, and optionally one hook script, to what your agent already does.

Agent harnesses already support custom controls: Copilot has hooks
([reference](https://docs.github.com/en/copilot/reference/hooks-reference)), and Claude Code has hooks
([reference](https://docs.anthropic.com/en/docs/claude-code/hooks)) with `PreToolUse` deny and `Stop` block.
Golden Path doesn't replace them. It is one way to use them for expert-owned acceptance.

**Where the boundary is.** The stop hook gives **fast feedback** inside the agent session. The **durable
boundary** stays where you already have it: branch protection with required status checks (for example the
optional `golden-path-check` workflow comparing against the PR base commit) and human review. Golden Path
documents that boundary and does not build it.

It is **complementary to [Spec Kit](https://github.com/github/spec-kit)** and
[Kiro specs](https://kiro.dev/docs/specs.md). Those structure the spec → plan → tasks flow. Golden Path is
only about who owns acceptance and keeping the implementing agent away from it. It can sit alongside them.
We make no claim that it is unique or that it is proven to help (see [Evidence](#evidence)).

## Three adoption levels

No level requires a higher one. Level 1 needs no runtime at all. Level 2 needs Node.js 22+ and nothing from npm. The Python research tools are never a prerequisite.

| Level | What you get | Files in your repo | Code |
|---|---|---|---|
| **L1 Method** | The `golden-path` skill (Intent → Context → Boundary → Acceptance → Report) and its reference | `.github/skills/golden-path/` (+ an instructions block) | none |
| **L2 Checked completion** | L1 + a stop gate that runs **your existing checks** when the agent tries to finish. Optional: protected acceptance tests (`acceptance.paths` in config) and the test-weakening guard | L1 + `.github/hooks/golden-path-loop.json`, `.github/hooks/golden-path/gate.mjs`, `.golden-path/config.json` | **one** plain JavaScript file, Node built-ins only |
| **L3 Learning and measurement** | Lesson validation, ledger summary, A/B runner (Golden Path vs a plain agent). Research tools, **off by default**; we keep them only if they prove useful | L2 config with `"research": {"enabled": true}`. The tools stay in this repo's `research/` and are never copied in | `research/golden_path_research.py` (Python) |

### Install
- **Installer:** `node plugin/install.mjs --target <repo> --level 1`.
  - Or `--level 2 --check "<your test command>" [--acceptance-path 'acceptance/**' --acceptance-owner "Finance: Ingrid" --acceptance-command "<cmd>"]`.
  - Or `--level 3 ...`.
  - It writes only `golden-path`-namespaced files. It never overwrites your files: `copilot-instructions.md`, `AGENTS.md` and `.gitignore` get a marked block appended.
  - It refuses and writes nothing on any conflict.
  - `--uninstall` removes exactly what it wrote.
- **Copy by hand:**
  - L1: copy `plugin/skills/golden-path/` to `.github/skills/golden-path/`.
  - L2: also copy `plugin/scripts/gate.mjs` to `.github/hooks/golden-path/gate.mjs`. Copy `plugin/com.github.copilot/hooks/hooks.json` to `.github/hooks/golden-path-loop.json`, replacing `${PLUGIN_ROOT}/scripts/` with `.github/hooks/golden-path/`. Then create `.golden-path/config.json` with at least `{"check": "<your test command>"}`.
- **Agent Plugin** (VS Code `chat.plugins.enabled`): point `chat.pluginLocations` at `plugin/`. That gives L2 behaviour. Use the plugin *or* copy-in, not both, or the hooks run twice.
- The custom agent `plugin/optional/agents/golden-path.agent.md` is an **optional preset** (`--with-agent-preset`). Everything works with Copilot's default agent.

**Why Node.js 22+, plain JavaScript.**
- The hook script must read JSON from stdin, match globs, diff against git, and run on Windows, macOS and Linux.
- `node` is one portable runtime that the hooks file can call the same way from its `bash` and `powershell` entries. It calls `node` with the locally installed script: no `npx`, no packages, no network.
- **Minimum 22** because Node 20 reached end of life on 30 Apr 2026. Node 22 is a maintenance LTS until 30 Apr 2027, and Node 24 is the active LTS ([Node release schedule](https://github.com/nodejs/Release)).
- 22 also has a stable `node --test` runner and `String.prototype.replaceAll`, which the tests and installer use.
- No TypeScript and no build step: what you review is what runs.

## What level 2 does, exactly
- **It checks completion against your configured tests. It does not check customer acceptance.** When the agent tries to stop (`agentStop`), `gate.mjs` runs the following and blocks with the failures while any of them is red:
  - your `check` command;
  - the optional `acceptance.command`;
  - two heuristic integrity checks.
- **Retry limit:** after `max_blocks` (default 5, below Copilot's 8-consecutive-block override) the gate lets the agent stop. The run is then recorded as **`gave_up`, outcome FAILED, `requires_owner_review`**. It is never an implicit pass. **No review request is sent.** Surfacing it to the owner is up to your normal process, such as the required CI check failing on the PR.
- **One time budget:** `hook_budget_sec` (default 100) covers *all* commands in one hook run, not each command. A command that would overrun is stopped, and later commands are reported "not run". Both count as red.
- **Timeouts fail open** (documented Copilot hook behaviour). If the hook itself exceeds its `timeoutSec` (120), the stop goes ahead and no gate record is written. The L3 summary shows such sessions as **UNVERIFIED**. A spawned command's own child processes may outlive a timeout on some platforms.
- **Fixed comparison commit:** integrity checks compare against the commit recorded at **session start** (`base_sha`), not the agent's eventual HEAD, so committing an edited acceptance test doesn't hide it. In CI, `gate.mjs check --base <PR base sha>` does the same. Without `--base`, the check warns that it compared with HEAD.
- **Line endings:** CRLF and LF checkouts of the same content are treated as equal (Windows `core.autocrlf`).
- **Protected-test checks are heuristics, not guarantees.**
  - The `preToolUse` guard denies edit tools and common shell mutations (`sed -i`, `rm`, redirects, `git checkout <ref>`…) on acceptance paths. It asks before edits to existing developer tests.
  - The stop gate fails if any acceptance file differs from the session's base commit, or if a protected test lost tests or assertions or gained skip markers.
  - Determined workarounds exist: other tools, generated code, or special-casing the implementation. ImpossibleBench reports that read-only tests stop edits but not other exploits.
- `method_files_present` (session start) records that the skill files existed and context was offered. **It does not show the agent read or followed the skill.**

## Honest limits
- **Level 2 checks completion against the configured tests, not customer acceptance.**
- Scripts automate explicit checks. They **cannot tell whether the tests represent what customers need**. That stays with the expert and the engineer, and Golden Path doesn't replace engineering judgment.
- Passing protected tests shows only that **the expert's executable examples are met**. It does not prove business correctness, deployment readiness, or authorization to merge, release or deploy.
- The VS Code hooks experience is **Preview**; Copilot CLI/SDK hooks are GA. See [VERIFY-IN-VSCODE.md](VERIFY-IN-VSCODE.md) for what still has to be checked on a signed-in install.
- L3 A/B: the **primary** comparison is Golden Path vs a **plain agent** (same agent command, model, tasks and acceptance tests; kit removed from the worktree). **Lessons on/off measures only the benefit of the retained lessons. It does not establish the benefit of Golden Path as a whole.**
- The demo's research simulator (`research/sim/`) is **rigged**. It tests plumbing, and its numbers are not evidence.

## Evidence
**This repository's own experiments** ([archive/research](archive/research/README.md)) found no measurable benefit from method guidance:
- continuing-delegation: 36 subjects, NO CHANGE (12/12 vs 12/12), with a ceiling effect and +13.9% time.
- csv-smoke: n=1; method loading was not demonstrated.
- brownfield: 2 per arm, outcome ceiling (4/4), INCONCLUSIVE. **Corrected:** the evaluator's guard counted *any* change to the existing test file as tampering. The three flagged subjects had only *added* tests, which the task allowed. Under the corrected rule (the kit's own test-integrity rule), no subject tampered with tests. See [CORRECTION.md](archive/research/brownfield-continuity/CORRECTION.md). The correction applies the rule to recorded facts; the original evaluator wasn't in this repo to re-run.
- distributed-coherence: existing gates were enough.
- decision-validity: 0/16 executed.

v3 therefore keeps guidance minimal and puts the effort into protecting what the expert owns. Its incremental value is **unproved**.

**External sources:**
- Added context rarely helps capable models and costs more:
  - AGENTS.md study, Gloaguen et al., [arXiv 2602.11988](https://arxiv.org/abs/2602.11988): about +20% cost, about ±3% success.
  - Arena, [ACM CAIS 2026](https://dl.acm.org/doi/full/10.1145/3786335.3813233): extra orchestration gave no correctness gain.
- Agents game tests they can write. Hidden tests nearly eliminate this, and read-only tests stop edits: ImpossibleBench, [arXiv 2510.20270](https://arxiv.org/abs/2510.20270) (ICLR 2026).
- Vendors put the discipline into enforceable checks:
  - [OpenAI, harness engineering](https://openai.com/index/harness-engineering/).
  - Anthropic, [harness design](https://www.anthropic.com/engineering/harness-design-long-running-apps).
- Field productivity effects are still unsettled: [METR, 24 Feb 2026](https://metr.org/blog/2026-02-24-uplift-update/).
- Spec-driven tools ([Spec Kit 1.0.0](https://github.com/github/spec-kit/releases/tag/v1.0.0), [Kiro](https://kiro.dev/docs/specs.md)) cover specs and acceptance criteria. I did not find, but also did not rule out, protection of expert-owned acceptance tests from the implementing agent.

## Demo (level 2, about 10 minutes)
```
examples/make-demo.sh ~/golden-path-demo      # separate git repo with the kit installed (level 2)
cd ~/golden-path-demo
node simulator/refusal_scenario.mjs            # SCRIPTED: agent tries to edit a protected test, is refused
code .                                         # then: "Do tasks/T01.md" with Copilot's default agent
```
- `acceptance/EXAMPLES.md` holds the business examples written by the (fictional) owner *Finance: Ingrid Berg*.
- `acceptance/test_acceptance.py` holds the protected tests built from them. The owner enables increments in the acceptance command (`...test_acceptance.T01`).
- L3 (optional): set `"research": {"enabled": true}`, then run `python3 <kit>/research/golden_path_research.py ab --tasks T01 --reps 3 --agent-cmd '<agent CLI> {prompt_file}'`, and `... summary`.

## Layout
- `plugin/` is the kit:
  - `skills/`;
  - `scripts/gate.mjs`, the only hook script (Node.js 22+, built-ins only);
  - `com.github.copilot/hooks/hooks.json`;
  - `optional/agents/`;
  - `install.mjs`.
- `research/` holds the L3 tools and the rigged simulator. They are not in the plugin and are never installed.
- `examples/` is the demo.
- `tests/` holds the kit tests (`kit.test.mjs`, run with `node --test`) and the research tests (Python `unittest`).
- `archive/` holds v1, v2 notes and the experiments.
