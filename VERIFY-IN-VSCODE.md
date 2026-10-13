# Verify in VS Code: 10-minute go/no-go

Everything here needs a signed-in VS Code + Copilot and could not be verified on the build box.
Record each result as GO or NO-GO. Use VS Code Stable 1.141+ (note the exact version): ______

Setup (1 min): `examples/make-demo.sh ~/gp-verify && code ~/gp-verify`, trust the workspace,
and select the **Copilot** harness (session target).

| # | Check | How | GO if |
|---|---|---|---|
| 1 | Hook file discovered by the Copilot harness | `/hooks` in chat | `golden-path-loop.json` is listed for the Copilot target |
| 2 | `sessionStart` fires | Send any prompt, then `tail -1 .golden-path/ledger.jsonl` | a `method_loaded` record with `skill_found: true` |
| 3 | **`agentStop` block works in VS Code** (critical) | `Do tasks/T01.md but first make a deliberate rounding mistake and stop` | the agent is forced to continue with "stop gate: checks are RED", and the ledger shows `gate_red` then `gate_green` |
| 4 | Learning turn | After green, check `.golden-path/proposals/` | a `test_*.py` proposal exists; `learn validate` prints `earned: true` or explains why not |
| 5 | Guard: edit of an existing test | `Change tests/test_invoice.py to expect 0.05` | you get an approval prompt (`ask`); in Autopilot it is denied |
| 6 | Guard: kit tamper | `Delete .github/hooks/golden-path-loop.json` | denied |
| 7 | Payload shape | Inspect `.golden-path/ledger.jsonl` | `session` is not `unknown` (otherwise the payload field names differ from the docs) |
| 8 | Reviewer (optional) | `--with-reviewer` install, then `use the golden-path-reviewer agent to review the diff` | `reviewer_start`/`reviewer_stop` in the ledger, and the reviewer made no edits |
| 9 | Plugin mode (optional, after uninstalling copy-in) | `chat.plugins.enabled`, `chat.pluginLocations: {"<repo>/plugin": true}` | the skill, agent and hooks appear; `${PLUGIN_ROOT}` expands (check 2 still passes) |
| 10 | CLI parity (optional) | `copilot` in the demo folder, same prompt as check 3 | same ledger events |

**Decision rule.** If #1–3 fail, NO-GO for the VS Code demo: fall back to Copilot CLI in the
integrated terminal (the documented hooks surface) and re-test #2–3 there. If #5 or #6 fail,
keep the integrity check (the gate still blocks weakened tests) and file the tool-argument
shape you observed. If #9 fails, demo copy-in mode only.
