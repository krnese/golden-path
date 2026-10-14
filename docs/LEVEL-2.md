# Level 2 reference: checked completion

The detail behind the [README](../README.md) quickstart. Level 2 needs Node.js 22+ and nothing from npm.

Agent harnesses already support custom controls: Copilot has
[hooks](https://docs.github.com/en/copilot/reference/hooks-reference), and so does Claude Code
([hooks](https://docs.anthropic.com/en/docs/claude-code/hooks)). Golden Path doesn't replace them; it is one
way to use them for expert-owned acceptance.

## Files written

| File | Purpose |
|---|---|
| `.github/skills/golden-path/` | the L1 skill and its reference |
| `.github/hooks/golden-path-loop.json` | hook registration (`sessionStart`, `preToolUse`, `agentStop`, subagent start/stop) |
| `.github/hooks/golden-path/gate.mjs` | the only hook script: plain JavaScript, Node built-ins only |
| `.golden-path/config.json` | your `check` command, acceptance paths, owner and command; created once, never overwritten |
| `.github/prompts/golden-path-task.prompt.md` | a task prompt |
| `.github/workflows/golden-path-check.yml` | only with `--with-ci` |

## Other ways to install

- **Copy by hand:**
  - L1: copy `plugin/skills/golden-path/` to `.github/skills/golden-path/`.
  - L2: also copy `plugin/scripts/gate.mjs` to `.github/hooks/golden-path/gate.mjs`. Copy `plugin/com.github.copilot/hooks/hooks.json` to `.github/hooks/golden-path-loop.json`, replacing `${PLUGIN_ROOT}/scripts/` with `.github/hooks/golden-path/`. Then create `.golden-path/config.json` with at least `{"check": "<your test command>"}`.
- **Agent Plugin** (VS Code `chat.plugins.enabled`): point `chat.pluginLocations` at `plugin/`. That gives L2 behaviour. Use the plugin *or* copy-in, not both, or the hooks run twice.
- The custom agent `plugin/optional/agents/golden-path.agent.md` is an **optional preset** (`--with-agent-preset`). Everything works with Copilot's default agent.

## Why Node.js 22+, plain JavaScript

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
- **One time budget:** `hook_budget_sec` (default 100) covers *all* work in one hook run, not each command: configured commands, integrity checks and git calls. This includes the repo lookup and the provenance reads (HEAD, diff hash). Each git call's timeout is taken from what remains, and no git process starts once the budget is used up. Provenance is then recorded as `provenance_unavailable`. There's no separate bookkeeping allowance: only local file writes (state, ledger) follow, well inside the host `timeoutSec` (120 vs the default budget of 100). A command that would overrun is stopped, and later commands are reported "not run". Both count as red.
- **Timeouts fail open** (documented Copilot hook behaviour). If the hook itself exceeds its `timeoutSec` (120), the stop goes ahead and no gate record is written. Count such sessions as **UNVERIFIED** in any experiment. A timeout kills the command's whole process tree (`taskkill /T` on Windows, the process group on POSIX).
- **Evidence must be valid.** The base must resolve to a commit present in the clone (`git rev-parse --verify <rev>^{commit}`). An unknown revision, a shallow clone missing the base, or any git failure while reading evidence makes the run **UNVERIFIED** (red, exit 1), never PASS. In CI, use `fetch-depth: 0`.
- **Fixed comparison commit:** integrity checks compare against the commit recorded at **session start** (`base_sha`), not the agent's eventual HEAD, so committing an edited acceptance test doesn't hide it. In CI, `gate.mjs check --base <PR base sha>` does the same. Without `--base`, the check warns that it compared with HEAD.
  - A failing acceptance-integrity result names the base and how it was chosen (`Compared with base 65ef920 (session start)`; also `first stop` or `--base`), and records `base_sha`, `base_source` and `committed_since_base`.
  - **After the owner changes acceptance, start a new session.** Commit authorship is not owner authority, so an acceptance commit that lands *during* a session fails, even when the owner made it. When the changed files are already committed between base and HEAD, the message says so and tells the user to start a NEW chat/session, so that the owner commit becomes the base. The gate never re-bases on its own. Make the owner's commit in a terminal or in a separate PR, then open a new chat for the implementation. That a new VS Code chat gets a new session id is check 8c in [VERIFY-IN-VSCODE.md](../VERIFY-IN-VSCODE.md).
- **Line endings:** CRLF and LF checkouts of the same content are treated as equal (Windows `core.autocrlf`).
- **Protected-test checks are heuristics, not guarantees.**
  - The `preToolUse` guard denies edit tools and common shell mutations (`sed -i`, `rm`, redirects, `git checkout <ref>`…) on acceptance paths. It asks before edits to existing developer tests.
  - The stop gate fails if any acceptance file differs from the session's base commit, or if a protected test lost tests or assertions or gained skip markers.
  - Determined workarounds exist: other tools, generated code, or special-casing the implementation. ImpossibleBench reports that read-only tests stop edits but not other exploits.
- `method_files_present` (session start) records that the skill files existed and context was offered. **It does not show the agent read or followed the skill.**

## Changing acceptance tests on purpose (authorised revision)

The PR-base comparison blocks agent edits to protected acceptance tests. Legitimate owner changes go through GitHub's own controls; this adds no new system.

**Required repository setup.** All four are needed; the label alone authorises nothing.

1. A **CODEOWNERS** file that lists the acceptance owner for every acceptance path. Use individual `@user` owners: this check doesn't resolve teams or emails, so it fails closed on them.
2. Branch protection or a ruleset with **Require review from Code Owners**.
3. **Dismiss stale pull request approvals when new commits are pushed.**
4. **`golden-path-check` as a required status check.**

**Flow.**

1. The owner's change goes in a **separate PR** labelled `golden-path:acceptance-revision`. The label only *selects* this path.
2. The workflow then reads the PR's reviews from the GitHub API ([list reviews](https://docs.github.com/en/rest/pulls/reviews#list-reviews-for-a-pull-request)) and runs `gate.mjs authorize-acceptance-revision`. That requires an **APPROVED review on the current head commit** by a Code Owner of **every** changed acceptance file. CODEOWNERS and the config are read from the **base** commit, so the PR can't grant itself owners. Otherwise the check fails.
3. A label without approval fails. So does an approval for an older commit, for example when acceptance tests changed after approval.
4. When authorised, acceptance-integrity is reported as **SKIPPED** (outcome `PASSED_WITH_SKIPPED`), never as an integrity pass. All other checks still run.
5. After merge, later PRs compare against the new base.

Locally, the stop gate never skips: the agent can't revise acceptance tests.
