# Golden Path (preview)

**A better way of working with the agents you already have: help people express business intent as
reviewable engineering acceptance, then connect it to the controls they already use.**

> **Core principle:** the expert and engineer decide what needs to be true; automation checks the parts
> they have made executable.

Golden Path is for two people working together: a **business-context expert** (product owner, finance,
operations…) who owns the intent and the acceptance examples, and a **developer** who turns them into
tests and ships the change with whatever coding agent they already use. It adds one skill, and optionally
one hook script, to that agent. It does not replace your agent, your CI or your review process.

It is complementary to spec-driven tools such as [Spec Kit](https://github.com/github/spec-kit) and
[Kiro specs](https://kiro.dev/docs/specs.md): they structure spec → plan → tasks; Golden Path is only about
who owns acceptance and keeping the implementing agent away from it.

## How it works

1. **Expert intent and examples.** The expert writes the goal and concrete business examples
   (see [`examples/invoice-demo/acceptance/EXAMPLES.md`](examples/invoice-demo/acceptance/EXAMPLES.md)).
2. **Approved acceptance tests.** The developer turns the examples into tests; the expert approves them.
   The agent may read and run them, not change them. A needed change goes back to the expert.
3. **Any agent or model works until the checks pass.** Golden Path does not pick the model or the agent.
4. **A reviewable PR with acceptance evidence**: what changed, which checks passed, what is still open.
5. **Human review and merge**, through your normal branch protection and Code Owner review.

## Three adoption levels

No level requires a higher one. Run the installer from a clone of this repository; `<repo>` is your
repository. It writes only `golden-path`-namespaced files, appends a marked block to
`.github/copilot-instructions.md`, `AGENTS.md` (if present) and, at L2, `.gitignore`, and refuses to write anything
on a conflict. Add `--dry-run` to preview.

| Level | What you get | Runtime |
|---|---|---|
| **L1 Method** | The `golden-path` skill (Intent → Context → Boundary → Acceptance → Report) in `.github/skills/golden-path/` | none |
| **L2 Checked completion** | L1 + one stop-gate hook that runs your existing checks when the agent tries to finish, with optional protected acceptance tests | Node.js 22+, no npm packages |
| **L3 Learning and measurement** | A guide to running a matched experiment (Golden Path vs your plain agent) with worktrees, transcripts, git and CI | docs only |

### L1: method, no runtime

```bash
node plugin/install.mjs --target <repo> --level 1
```

Or copy `plugin/skills/golden-path/` to `.github/skills/golden-path/` in your repository by hand.

### L2: checked completion

```bash
node plugin/install.mjs --target <repo> --level 2 --check "<your test command>"
```

With expert-owned, protected acceptance tests and the optional CI workflow:

```bash
node plugin/install.mjs --target <repo> --level 2 --check "npm test" \
  --acceptance-path "acceptance/**" \
  --acceptance-owner "Finance: Ingrid Berg" \
  --acceptance-command "npm run test:acceptance" \
  --with-ci
```

- `--with-ci` adds `.github/workflows/golden-path-check.yml`, which re-runs the checks against the PR base
  commit. Make it a required status check.
- The protected-test checks are **heuristics**: they catch the common ways an agent edits or weakens a test,
  not every workaround.
- Optional extras: `--with-reviewer` (reviewer agent), `--with-agent-preset` (custom agent; Copilot's
  default agent works without it).
- Remove: `node plugin/install.mjs --target <repo> --uninstall` (`--force` if files were modified,
  `--purge` to also delete `.golden-path/config.json`).
- Exact gate behaviour, manual copy-in, the VS Code Agent Plugin route and the authorised acceptance-revision
  flow: [docs/LEVEL-2.md](docs/LEVEL-2.md).

### L3: experiment guide, docs only

Nothing to install (the installer rejects `--level 3`). Install L2, then follow
[docs/LEVEL-3-EXPERIMENTS.md](docs/LEVEL-3-EXPERIMENTS.md).

## Optional: local-model skill

If someone wants to run the agent on a local model (privacy, offline work, cost, experimentation), add the
recommend-only [`golden-path-local-models`](plugin/optional/skills/golden-path-local-models/SKILL.md) skill
at any level:

```bash
node plugin/install.mjs --target <repo> --level 1 --with-local-models
```

It checks the environment and an endpoint and recommends local, hosted or no model per task. It never
selects or switches the model; that is the host's job. L2 checks run the same regardless of model.

## Limits

- **Hooks are fast feedback, not authority.** They run inside the agent session, can time out (and then
  fail open) and can be worked around.
- **The durable boundary is yours:** branch protection, Code Owner review and required CI checks.
  Golden Path documents that boundary; it does not build it.
- **Passing tests is not business correctness.** It shows the expert's executable examples are met, not
  that they capture what customers need, nor that the change may be merged, released or deployed.
- **Preview.** VS Code agent hooks are a preview feature; see [VERIFY-IN-VSCODE.md](VERIFY-IN-VSCODE.md)
  for what still has to be checked on a signed-in install.
- **Benefit is unproved.** This repository's own experiments found no measurable benefit from method
  guidance; see [docs/evidence.md](docs/evidence.md).

## Examples

- **[Invoice demo](examples/invoice-demo/README.md)** (L2, about 10 minutes; needs Node.js 22+, Python 3,
  git, bash): a fictional finance owner's examples become protected tests, and a scripted agent is refused
  when it tries to edit one.

  ```bash
  examples/make-demo.sh ~/golden-path-demo
  cd ~/golden-path-demo && node simulator/refusal_scenario.mjs
  code .   # then ask Copilot's default agent: "Do tasks/T01.md"
  ```

- **[Connecting your own reasoning boundaries](docs/examples/hybrid-workflow.md)**: one adopter's workflow
  (own agents → PR → Copilot → reviewable PR → human merge) mapped onto Golden Path levels and files.

## Repository layout

- `plugin/`: the kit (skill, `scripts/gate.mjs` hook, hooks JSON, optional agents and skills, `install.mjs`).
- `docs/`: level 2 reference, level 3 guide, evidence, examples.
- `examples/`: the invoice demo.
- `tests/kit.test.mjs`: kit tests (`node --test tests/kit.test.mjs`).
- `archive/`: earlier versions and the original experiments (history, not instructions).
- [CHANGELOG.md](CHANGELOG.md): version history.

## Contributing and feedback

Trial reports, bugs and cases where plain practice works just as well are all welcome as
[GitHub issues](https://github.com/krnese/golden-path/issues). Say what you expected, what happened, and
your agent, client and model when known. Remove secrets and customer data first. Pull requests go through
the same review and CI as everything else; run `node --test tests/kit.test.mjs` before opening one.

## License

No license file has been added yet, so default copyright applies. Open an issue if you need clarity before
adopting.
