# Golden Path (preview)

**Keep "done" in the hands of the people who define it.** Golden Path is a lightweight kit for
**owner-controlled acceptance in AI-assisted development**, starting with GitHub Copilot in VS Code.
It connects owner-approved acceptance tests to local agent feedback and your existing repository controls.

**The problem it addresses.** A green test run is ambiguous if the implementing agent also changed the tests
that define success. Golden Path checks acceptance against a fixed baseline, blocks common acceptance-edit
paths, and makes a needed revision a decision for the owner. It separates **implementing a change** from
**authorizing a change to what counts as correct**.

**Who it's for.** An **engineering lead or developer** using Copilot in an existing repository, working with a
**product or domain owner** who supplies business examples and approves their meaning. Start with one
deterministic rule: a discount, approval threshold, eligibility decision or API contract. You do not need a
complete acceptance suite before starting.

> **Core principle:** the expert and engineer decide what needs to be true; automation checks the parts
> they have made executable.

**Boundary:** local hooks are feedback, not merge authority. Required CI, branch protection and owner review
remain yours to configure. The mechanism is tested; incremental team benefit is still unproved.

![Golden Path overview: business functions, shared acceptance record, coding agent, pull request, durable boundary, outcomes, golden loop](docs/assets/golden-path-overview.png)

The diagram includes the target model, not only shipped automation. The **shared acceptance record** is plain
files: intent, business examples and executable tests. The local guard and stop gate provide bounded feedback;
your GitHub controls decide the merge. Each claim and gap is listed in
[overview claims](docs/overview-claims.md).

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
- **Acceptance changes made visible.** At Level 2 the guard denies common edit paths and names the owner.
  Integrity checks compare against the commit the session started from, so committing an acceptance edit
  doesn't hide it. Protection is heuristic, not tamper-proof
  ([what Level 2 does](docs/LEVEL-2.md#what-level-2-does-exactly)).
- **Explicit failure and uncertainty.** Unreadable evidence is UNVERIFIED and exhausted retries are FAILED,
  never an implicit pass. The stop gate blocks red checks within a bounded retry budget; a host timeout can
  allow stopping. An acceptance failure names the comparison base and what to do next.
- **Fits the controls you already have.** Branch protection, CODEOWNERS and required CI stay the authority. An
  optional workflow re-runs the checks against the PR base (`--with-ci`).
- **Works with Copilot's default agent.** No special agent to pick and no new runtime
  ([details](#works-with-your-default-agent)).
- **Small enough to review.** One Node.js script with no npm packages, a conflict-refusing installer and a clean
  uninstall. CI runs the kit tests on Ubuntu and Windows, Node 22 and 24.
- **Evidence back to the owner.** The method's Report step says what changed, which checks passed on which commit
  and what is still unproved. The [walkthrough](docs/examples/golden-loop/README.md) shows this in practice.

## Quickstart

Needs Node.js 22+ and git, on any OS. From a clone of this repository:

```bash
node plugin/install.mjs --target "<your-repo>" --level 2 --check "<fast-check-command>"
```

**This installs checked completion, not owner-controlled acceptance.** Replace the placeholders with your
repository and an existing fast test command. No business acceptance paths or owner are configured by this
command. Add `--dry-run` to preview, or use `--level 1` for the method only.

For **owner-controlled acceptance**, first agree examples and approve their executable tests. On a fresh
installation, supply the paths, named owner and existing acceptance command:

```bash
node plugin/install.mjs --target "<your-repo>" --level 2 --check "<fast-check-command>" --acceptance-path "acceptance/**" --acceptance-owner "<named-owner>" --acceptance-command "<acceptance-test-command>" --with-ci
```

The placeholders are commands and ownership you supply, not scripts included by the kit. Both commands plus
integrity checks share the hook budget (default 100 seconds). Keep heavier suites in separate required CI
checks. Rerunning the installer **does not overwrite existing configuration**, even with new flags.

**Finish setup:** configure CODEOWNERS, required CI and Code Owner review; verify refusal and legitimate
owner revisions using the **[adoption checklist](docs/ADOPTION.md)**. The installer does not apply GitHub
settings. Start a new agent session after an owner-approved acceptance revision.

To see the mechanism before configuring your own repository, build the ready-made demo:

```bash
node examples/make-demo.mjs ~/golden-path-demo
cd ~/golden-path-demo
node simulator/refusal_scenario.mjs
code .
```

PowerShell equivalents for the first two lines: `node examples\make-demo.mjs "$HOME\golden-path-demo"` and
`Set-Location "$HOME\golden-path-demo"`. The demo acceptance starts intentionally red; the refusal scenario
checks the guard and backstop, not a completed business feature.

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

1. **Fork or clone this repository.** The kit is already
   installed here at Level 2 (`.github/skills/golden-path/`, the marked block in
   `.github/copilot-instructions.md`, the hook in `.github/hooks/`, config in `.golden-path/config.json`,
   whose check is a **fast** packaging + installer + self-install subset that fits the hook budget; the full kit suite stays in CI). Those are installed *copies*; **`plugin/` is the source of
   truth**. After changing anything under `plugin/`, rerun `node plugin/install.mjs --target .` and commit;
   a test (`tests/self-install.test.mjs`) fails in CI if the copies drift.
   This repository's own configuration protects developer tests but has no business acceptance paths or
   acceptance command; cloning it does not define acceptance for your business.
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
  hooks for the selected harness. Golden Path was trialled with Copilot's default agent; file discovery alone
  does not establish compatibility with another harness. Validate events, payloads and blocking decisions
  when changing clients or harnesses ([hooks](https://code.visualstudio.com/docs/agent-customization/hooks)).
  The VS Code hooks experience is **preview**.
- **Custom agent:** `golden-path.agent.md` (`--with-agent-preset`) is an optional preset for teams that
  want a named agent that always applies the skill. Nothing depends on it.

Today this depends on files committed to your repository (in this repository they are already committed).

Golden Path adds one skill, and optionally one hook script, to the agent you already use. It does not replace
your agent, your CI or your review process.

It is complementary to [Spec Kit](https://github.com/github/spec-kit) and
[Kiro specs](https://kiro.dev/docs/specs/), which structure requirements, implementation and verification.
Golden Path focuses on who may revise owner-approved executable acceptance. Native hooks and ordinary
acceptance tests, CODEOWNERS and CI already provide the underlying controls; the kit packages one way to
connect them. This is not a claim that other tools lack equivalent protection.

## How it works

1. **Expert intent and examples.** The expert writes the goal and concrete business examples
   (see [`examples/invoice-demo/acceptance/EXAMPLES.md`](examples/invoice-demo/acceptance/EXAMPLES.md)).
2. **Approved acceptance tests.** The developer turns the examples into tests; the expert approves them.
   The agent may read and run them, not change them. A needed change goes back to the expert.
3. **Implementation with bounded feedback.** In the verified Copilot setup, L2 blocks red checks within its
   retry budget and records failure or uncertainty explicitly. Golden Path does not pick the model.
4. **A reviewable PR with acceptance evidence**: what changed, which checks passed, what is still open.
5. **Human review and merge**, through your normal branch protection and Code Owner review.

The **golden loop** is a workflow: an owner works with an agent outside the repository to propose acceptance,
owners approve it, the implementing agent builds, and evidence returns to the owner. Outside-repository steps
are not automated by this kit. The [two-round trial](docs/examples/golden-loop/README.md) demonstrates the
workflow on one demo, not general productivity or harness support.

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

**Recommended adoption path.** Use the [adoption checklist](docs/ADOPTION.md) to turn installation into a
verified owner-controlled acceptance workflow.

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

**Choose fast local commands.** The stop gate shares one `hook_budget_sec` (default 100) across `--check`,
the acceptance command, integrity and git; a command that overruns is stopped and recorded as UNVERIFIED,
not as a failing test. Put heavier suites in separate required CI checks. This repository's own gate check
runs only the packaging, installer and self-install tests (`--test-name-pattern="^(Packaging|Installer|self-install)"`);
the required "Kit guarantees" CI jobs still run the full suite on Ubuntu and Windows.

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

## Documentation

| Document | What it covers |
| --- | --- |
| [Adoption checklist](docs/ADOPTION.md) | From installation to verified owner-controlled acceptance in your repository |
| [Level 2 reference: checked completion](docs/LEVEL-2.md) | Gate behavior, protected paths, CI and authorized acceptance revisions |
| [The golden loop, end to end](docs/examples/golden-loop/README.md) | Real two-round demo trial, decisions, evidence and limits |
| [How your acceptance suite grows itself](docs/how-acceptance-evolves.md) | Owner-approved acceptance accruing one task at a time |
| [Evidence](docs/evidence.md) | What is and is not proved, including negative findings |
| [Level 3: learning and measurement](docs/LEVEL-3-EXPERIMENTS.md) | Pilot and matched comparisons; docs only |
| [Verify in VS Code](VERIFY-IN-VSCODE.md) | Signed-in client verification checklist |
| [Invoice demo](examples/invoice-demo/README.md) | Example app, tasks, owner acceptance and demo builders |
| [Connecting your own reasoning boundaries](docs/examples/hybrid-workflow.md) | One adopter's workflow mapped onto the kit |
| [Background](docs/background.md) | History and how the idea evolved under evidence |
| [Overview claims](docs/overview-claims.md) | Diagram claims checked against the kit, with gaps labeled |
| [Golden Path skill](plugin/skills/golden-path/SKILL.md) and [method](plugin/skills/golden-path/references/METHOD.md) | Agent-facing guidance |
| [Changelog](CHANGELOG.md) | Version history |

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

Golden Path is licensed under the [MIT License](LICENSE), copyright 2026 Kristian Nese.
Third-party references retain their own terms; this license does not grant rights to external material.
