# Golden Path (preview)

**Keep "done" in the hands of the people who define it.** Golden Path is a small kit for teams that build with
coding agents, starting with GitHub Copilot in VS Code. A business owner's intent becomes acceptance tests that
the owner controls. The agent works until those tests pass, and it is not allowed to change them.

**The problem it addresses.** Coding agents are good at making tests pass, and that includes quietly editing the
tests that define "done". Meanwhile the business intent behind a change ("invoices a person can approve at a
glance") rarely reaches the pull request intact.

**Who it's for.** Two people working together: a **business-context expert** (product, finance, marketing,
operations…) who owns the intent and the examples, and a **developer** who ships the change with the coding
agent they already use.

> **Core principle:** the expert and engineer decide what needs to be true; automation checks the parts
> they have made executable.

![Golden Path overview: business functions, shared acceptance record, coding agent, pull request, durable boundary, outcomes, golden loop](docs/assets/golden-path-overview.png)

Left to right: **business owners** (product, the domain expert) write intent and concrete examples; those
become the **shared acceptance record**, which in this kit is plain files (in the demo,
`examples/invoice-demo/tasks/T01.md` and `examples/invoice-demo/acceptance/EXAMPLES.md` plus the acceptance
tests). **The coding agent** implements and tests; at Level 2 a stop gate keeps it working while checks are
red (up to `max_blocks`, default 5) and denies edits to protected acceptance tests. The **pull request** carries
the change and evidence, and the **durable boundary** (CI, branch protection, Code Owner review: GitHub
settings you configure) decides the merge.

The **golden loop** is a process that starts outside the repository: a business owner (for example marketing)
works with an agent outside the repo, which turns their intent into a PR; Copilot in the repo picks up that
PR, and owners approve any outward change. Evidence goes back to the owner, whose next intent starts the next
round.

## Documentation

| Document | What it covers |
| --- | --- |
| [README](README.md) | This page: what Golden Path is, quickstart, adoption levels, limits |
| [Background of Golden Path](docs/background.md) | Why it exists and how the idea evolved under evidence: from outcome-first workloads to a bridge between any AI interface and the repository controls that hold authority |
| [The golden loop, end to end](docs/examples/golden-loop/README.md) | Walkthrough of a real two-round trial: intent → acceptance → build → evidence, including the gate failing closed |
| [How your acceptance suite grows itself](docs/how-acceptance-evolves.md) | Why a repo's acceptance tests accrue per task, owner-approved, and what that means for teams and brownfield adoption |
| [Example: connecting your own reasoning boundaries](docs/examples/hybrid-workflow.md) | One adopter's hybrid workflow, mapped so you can map yours |
| [Level 2 reference: checked completion](docs/LEVEL-2.md) | The stop gate, protected paths, CI check and authorised acceptance revision via CODEOWNERS |
| [Level 3: learning and measurement](docs/LEVEL-3-EXPERIMENTS.md) | How to run a matched experiment on your own work (docs only) |
| [Evidence](docs/evidence.md) | Honest summary of what is and isn't proven, with links to the archived studies |
| [What the overview diagram claims](docs/overview-claims.md) | Each element of the overview image checked against the kit, with gaps labelled |
| [Verify in VS Code](VERIFY-IN-VSCODE.md) | 10-minute go/no-go checklist for a signed-in VS Code with Copilot |
| [Invoice demo](examples/invoice-demo/README.md) | The demo adopter repo used throughout: app, tasks, owner acceptance, demo builders |
| [Golden Path skill](plugin/skills/golden-path/SKILL.md) and [method](plugin/skills/golden-path/references/METHOD.md) | The agent-facing skill the installer adds under `.github/skills/` |
| [Changelog](CHANGELOG.md) | History of the kit, by version |

## See it work

In a real trial, one sentence from Marketing ("I need invoices to be as simple as possible, so humans can
immediately understand and approve/reject them…") became owner-approved acceptance tests. Copilot implemented
them in VS Code on Windows without touching them. The real output went back to Marketing, and Marketing's
follow-up became the next round.

![Real output from the trial, round 1 next to round 2: after Marketing's second intent, review reasons are in plain words and every duplicated product is named](docs/examples/golden-loop/round1-vs-round2.png)

**[Walk through the golden loop, step by step →](docs/examples/golden-loop/README.md)** It covers who decided
at each step, the screenshots, the gate verdicts, and what the trial does and doesn't prove.

## What you get

- **Acceptance the owner controls.** Business examples become protected tests with a named owner. With CODEOWNERS
  and branch protection set up, changing them takes that owner's Code Owner approval on the PR's current head commit
  ([authorised revision](docs/LEVEL-2.md#changing-acceptance-tests-on-purpose-authorised-revision)).
- **An agent that can't quietly redefine "done".** At Level 2 the guard denies edits to acceptance tests and names
  the owner. The stop gate keeps the agent working while checks are red, and compares against the commit the
  session started from, so committing an edit doesn't hide it ([what Level 2 does](docs/LEVEL-2.md#what-level-2-does-exactly)).
- **Results you can trust, including the bad ones.** Unreadable evidence is UNVERIFIED and a run that gives up is
  FAILED, never an implicit pass. An acceptance failure says which base it compared with and what to do next.
- **Fits the controls you already have.** Branch protection, CODEOWNERS and required CI stay the authority. An
  optional workflow re-runs the checks against the PR base (`--with-ci`).
- **Works with Copilot's default agent.** No special agent to pick and no new runtime
  ([details](#works-with-your-default-agent)).
- **Small enough to review.** One Node.js script with no npm packages, a conflict-refusing installer and a clean
  uninstall. CI runs the kit tests on Ubuntu and Windows, Node 22 and 24.
- **Evidence back to the owner.** The method's Report step says what changed, which checks passed on which commit
  and what is still unproved. The [walkthrough](docs/examples/golden-loop/README.md) shows this in practice.

## Quickstart (30 seconds)

Needs Node.js 22+ and git, on any OS. From a clone of this repository:

```bash
node plugin/install.mjs --target <your-repo> --level 2 --check "<your test command>"
```

Open `<your-repo>` in VS Code and give Copilot a task as usual. Add `--dry-run` to preview, or use `--level 1`
for the method only. To try it on a ready-made example first:

```bash
node examples/make-demo.mjs ~/golden-path-demo   # PowerShell: $HOME\golden-path-demo
cd ~/golden-path-demo && node simulator/refusal_scenario.mjs && code .
```

## What's verified today

- *Shipped and tested:* the skill and instructions (`plugin/skills/golden-path/`), the L2 guard and stop gate
  (`plugin/scripts/gate.mjs`; tests in `tests/kit.test.mjs` such as "the stop gate blocks while checks are red,
  then allows once they are green" and "editing, creating or absolute-path editing an acceptance test is
  denied and names the owner"), the installer (`plugin/install.mjs`), and the invoice demo with its scripted
  refusal scenario (`examples/make-demo.mjs`, `simulator/refusal_scenario.mjs`). Verified with Copilot in VS Code.
- *Run end to end in a real trial:* the golden loop, **twice**, with Copilot's default agent in VS Code on
  Windows (14 October 2026). Each round went from intent, to an acceptance-only PR written by an agent outside
  the repo, to review, owner merge, implementation and evidence back to the owner. Copilot passed 18/18 and then
  26/26 acceptance tests and changed only implementation files. The acceptance files matched a fresh build byte
  for byte. The gate correctly refused an acceptance change that landed mid-session.
  *Limits:* one model, one task, a demo repository, and one person playing the owner. "Immediately
  understandable" is the owner's judgement, not a test result. Nothing about productivity was measured. The
  agent never tried to change acceptance, so refusals are shown by the scripted scenario and kit tests, not by
  the trial. Details: [the walkthrough](docs/examples/golden-loop/README.md).
- *Your GitHub settings:* CI, branch protection and Code Owner review. The kit adds no gate of its own.
- *Target model, not yet validated:* "any harness, any model" (other agents get the skill only, untested),
  the golden loop beyond that one trial, and measured outcomes (Level 3 is guidance only). Business owners
  such as Legal/Compliance and Marketing/Sales are part of the method (Marketing was the owner in the trial);
  the kit has no tooling specific to them.

Every element of the overview is checked in [docs/overview-claims.md](docs/overview-claims.md).

## Two ways to use Golden Path

1. **Fork or clone this repository.** It works with Copilot in VS Code right away: the kit is already
   installed here at Level 2 (`.github/skills/golden-path/`, the marked block in
   `.github/copilot-instructions.md`, the hook in `.github/hooks/`, config in `.golden-path/config.json`,
   whose check is this repo's own `node --test`). Those are installed *copies*; **`plugin/` is the source of
   truth**. After changing anything under `plugin/`, rerun `node plugin/install.mjs --target .` and commit;
   a test (`tests/self-install.test.mjs`) fails in CI if the copies drift.
2. **Add it to your own repository** with `node plugin/install.mjs --target <your-repo>` (levels below). It
   copies the same files into *your* repository's `.github/` (and `.golden-path/` at L2). Paths such as
   `.github/skills/golden-path/` below mean those files in your repository after install.

A standalone VS Code plugin that does not need repository files is being explored.

## What this means in practice

Each part of the pitch maps to something concrete in the kit:

- **"The agents you already have."** There is no new runtime or agent. One installer
  (`plugin/install.mjs`) adds the `golden-path` skill under `.github/skills/` and, at L2, one optional hook
  under `.github/hooks/` (Node.js script, no npm packages).
- **"Express business intent."** The domain expert writes the rule in plain language, as business
  examples. In the invoice demo, the fictional finance owner's
  [T01 examples](examples/invoice-demo/acceptance/EXAMPLES.md#t01-percentage-discount-per-line) define a
  per-line percentage discount; the task [`examples/invoice-demo/tasks/T01.md`](examples/invoice-demo/tasks/T01.md) points the
  agent at them and says not to change them.
- **"Reviewable engineering acceptance."** The examples become acceptance tests the expert owns. With a
  CODEOWNERS entry for the acceptance paths and branch protection requiring Code Owner review, a change to
  those tests needs an approval from their Code Owner on the PR's current head commit
  ([docs/LEVEL-2.md](docs/LEVEL-2.md)).
- **"The controls they already use."** The L2 hook is fast feedback inside the agent session only. The
  binding boundary is your branch protection, Code Owner review and required CI checks. Golden Path adds
  no new gate; it connects the expert's acceptance to those existing controls.

**Limit:** the tests prove the business rule only as far as the expert wrote it down. Cases the examples
don't cover are not checked.

## Works with your default agent

You don't need to select a special agent in Copilot; the default agent picks Golden Path up from files in
the repository:

- **Method:** the skill lives in `.github/skills/golden-path/`, and the installer adds a marked pointer to it
  in `.github/copilot-instructions.md` (and `AGENTS.md` if present). VS Code discovers skills in
  `.github/skills/` and includes these instruction files automatically
  ([skills](https://code.visualstudio.com/docs/copilot/customization/agent-skills),
  [custom instructions](https://code.visualstudio.com/docs/copilot/customization/custom-instructions)).
  Discovery makes the skill available; it does not guarantee the model uses it on every prompt.
- **L2 hook:** it is a workspace hook file, `.github/hooks/golden-path-loop.json`. VS Code loads
  `.github/hooks/*.json` for the workspace, not per agent, so it runs whichever agent is selected in a local
  agent session ([hooks](https://code.visualstudio.com/docs/copilot/customization/hooks)). Hooks are a
  **preview** feature in VS Code.
- **Custom agent:** `golden-path.agent.md` (`--with-agent-preset`) is an optional preset for teams that
  want a named agent that always applies the skill. Nothing depends on it.

Today this depends on files committed to your repository (in this repository they are already committed).

Golden Path adds one skill, and optionally one hook script, to the agent you already use. It does not replace
your agent, your CI or your review process.

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

- `--with-ci` adds `.github/workflows/golden-path-check.yml` to your repository, which re-runs the checks against the PR base
  commit. Make it a required status check.
- **After the owner changes acceptance, start a new agent session.** The gate compares with the commit the
  session started from, so an acceptance commit made mid-session fails, even the owner's.
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

- **[Invoice demo](examples/invoice-demo/README.md)** (L2, about 10 minutes; needs Node.js 22+ and git,
  any OS including Windows; no Python): a fictional finance owner's examples become protected tests, and a scripted agent is refused
  when it tries to edit one.

  ```bash
  node examples/make-demo.mjs ~/golden-path-demo
  cd ~/golden-path-demo
  node simulator/refusal_scenario.mjs
  code .   # then ask Copilot's default agent: "Do tasks/T05.md" (or T01 / T06; all are enabled and red)
  ```

- **[The golden loop, end to end](docs/examples/golden-loop/README.md)**: a real two-round trial with Copilot in
  VS Code on Windows (intent → acceptance PR → review → build → evidence → next intent), with screenshots and
  limits.

- **[Connecting your own reasoning boundaries](docs/examples/hybrid-workflow.md)**: one adopter's workflow
  (own agents → PR → Copilot → reviewable PR → human merge) mapped onto Golden Path levels and files.

## Repository layout

- `plugin/`: the kit (skill, `plugin/scripts/gate.mjs` hook, hooks JSON, optional agents and skills, `install.mjs`).
- `docs/`: level 2 reference, level 3 guide, evidence, examples.
- `examples/`: the invoice demo.
- `tests/kit.test.mjs`: kit tests (`node --test tests/kit.test.mjs`).
- `tests/self-install.test.mjs`: checks the installed copies below match `plugin/`.
- `.github/skills/golden-path/`, `.github/hooks/`, `.github/prompts/`, `.github/copilot-instructions.md`, `.golden-path/`:
  the kit installed into this repository (generated from `plugin/`; do not edit by hand).
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
