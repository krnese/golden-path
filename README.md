# Golden Path v2

**A small engineering method for agents, plus native Copilot mechanisms that enforce the
parts that can be enforced, and a way to measure whether learning helps.**

- **One skill** (`golden-path`): Understand → Bound → Engineer → Prove → Report
  ([method](plugin/skills/golden-path/references/METHOD.md)).
- **One primary agent** (`golden-path`). An optional read-only reviewer
  (`golden-path-reviewer`) is off by default; its use is recorded so you can see whether it earns its cost.
- **A stop gate** (`agentStop` hook): the agent cannot finish while your repository checks are red.
- **A guard** (`preToolUse` hook) and an **integrity check** catch tests being deleted, skipped or weakened.
- **Method-loaded record** (`sessionStart` hook): every session records that the skill was available.
- **Earned lessons**: after a red-to-green fix, the agent proposes a regression test. It is
  accepted only if it **fails on the base commit and passes on the fix**, and it lands in your
  test suite. There is no separate memory store.
- **A local ledger and A/B runner**: iterations to green, failed checks, time to green, and
  per-lesson benefit (lessons on / off / leave-one-out).

v1 (method only) and its research, including the **NO CHANGE** results, are in [archive/](archive/INDEX.md).
v2 does not claim the method helps. It makes that claim measurable in your own repository.

## Status of what this depends on (checked 13 Oct 2026)

| Dependency | Status | Source |
|---|---|---|
| Copilot hooks (`version: 1`, `agentStop` block, `preToolUse` decisions) | Copilot SDK/CLI hooks GA; the VS Code hooks experience is **Preview** | [VS Code hooks](https://code.visualstudio.com/docs/agent-customization/hooks), [hooks reference](https://docs.github.com/en/copilot/reference/hooks-reference) |
| Copilot harness on the Agent Host (AHP) in VS Code | Shipped (1.134+, 1.140 headline); "under active development" | [Agent Host](https://code.visualstudio.com/docs/agents/concepts/agent-host) |
| Agent Plugins 1.0 packaging | Supported in VS Code via `chat.plugins.enabled`; current lifecycle label not confirmed (was Experimental in 1.110) | [Agent plugins](https://code.visualstudio.com/docs/agent-customization/agent-plugins) |
| Dynamic workflows | **Public preview**, CLI/app/SDK only. The authoring API is not publicly documented, so the A/B runner here is a **plain CLI script** | [Using dynamic workflows](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/use-dynamic-workflows) |

## 15-minute quickstart (demo)

Prerequisites: VS Code 1.141+ signed in to GitHub Copilot, `git`, `python3` (3.9+, stdlib only).

1. `git clone https://github.com/krnese/golden-path && cd golden-path && git checkout golden-path-v2` (1 min)
2. `examples/make-demo.sh ~/golden-path-demo` creates a separate demo repo and installs the kit
   into it the way an adopter would. (1 min)
3. `code ~/golden-path-demo`, trust the workspace, choose the **Copilot** harness in the
   session-target picker, and type `/hooks`. You should see `golden-path-loop.json`. (2 min)
4. In chat: `Do the task in tasks/T01.md using the golden-path skill.` Watch for a red gate, an
   iteration, green, then one learning turn. (5 min)
5. In the terminal:
   `python3 .github/hooks/golden-path/golden_path.py learn validate <proposal-name>`, then
   `... learn accept <proposal-name>`. Review `git diff` and commit. (3 min)
6. `python3 .github/hooks/golden-path/golden_path.py report` shows iterations to green, failed
   checks, time to green, and reviewer use. (1 min)
7. Optional (not timed): an A/B run with any agent CLI, e.g.
   `golden_path.py ab --tasks T01,T02 --reps 3 --per-lesson --agent-cmd '<your agent CLI> {prompt_file}'`.

For the go/no-go on a real VS Code install, see [VERIFY-IN-VSCODE.md](VERIFY-IN-VSCODE.md).

## Adopting it in your repository

Pick **one** mode. If you use both, the hooks run twice.

| Mode | How |
|---|---|
| **Copy-in** (`.github`-native) | `python3 plugin/install.py --target <repo> --check "<your test command>" [--test-file-command "<cmd> {file}"] [--with-reviewer] [--with-ci]` |
| **Agent Plugin** | VS Code: `chat.plugins.enabled: true` and `"chat.pluginLocations": {"<path>/plugin": true}`, or *Chat: Install Plugin From Source*. Then create `.golden-path/config.json` in your repo. |
| **Fork** | Fork this repo; `plugin/` is the kit. |

What the installer guarantees (tested in `tests/test_installer.py`):
- It writes only `golden-path`-namespaced files under `.github/` (`skills/golden-path/`,
  `agents/golden-path*.agent.md`, `hooks/golden-path-loop.json`, `hooks/golden-path/`,
  `prompts/golden-path-task.prompt.md`, and `workflows/golden-path-check.yml` only with `--with-ci`).
- It never overwrites `copilot-instructions.md`, `AGENTS.md` or `.gitignore`. It appends a marked
  `golden-path:begin/end` block instead, and only touches `AGENTS.md` if you already have one.
- `.golden-path/config.json` (your check command) is yours. It is created once and never overwritten.
- If anything conflicts, it **refuses and writes nothing** (exit 2). Re-running is a no-op.
  `--uninstall` removes exactly what was installed and refuses if you modified a kit file.

`.golden-path/config.json`:
```json
{ "check": "npm test", "test_file_command": "npx jest {file}", "protected": ["tests/**"],
  "learned_tests_dir": "tests/learned", "max_blocks": 5, "check_timeout_sec": 100 }
```

## Honest limits
- The guard and integrity check are heuristics; they catch common test weakening, not all of it.
- Hook timeouts **fail open** (hooks reference), so keep `check` fast. A check that times out is counted as red.
- The demo's `simulator/` is **rigged**. CI uses it to test plumbing, and its numbers are not evidence.
- Whether lessons help is an empirical question for your repo. Use `ab` with repeats and remove
  lessons that show no benefit.
- Prior art exists for each part (stop gates, rule and memory files, self-learning skills,
  gated re-runs). The combination here is a candidate, not a proven first.

## Repository layout
`plugin/` kit (Agent Plugin + installer) · `examples/` demo adopter repo · `tests/` kit tests ·
`archive/` v1 · `.github/workflows/golden-path.yml` CI for this repo.
