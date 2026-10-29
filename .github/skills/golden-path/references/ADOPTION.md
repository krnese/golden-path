# Guided adoption

Start when the user says "Help me use Golden Path for this task", asks for setup,
or has not established what the installed configuration does. Use the same journey
for new and existing repositories. Do not turn setup into a prerequisite for useful
method-only work, downgrade existing checks, or claim installation proves protection.
The goal is self-configuring, not self-authorizing: one engineering agreement per
change, grounded in existing records, with repository-wide controls underneath.

1. **Bring one task.** Restate the outcome, what must stay unchanged, who owns its
   meaning and where they will judge the result. Use existing issues, PRs and policies,
   not a new mandatory document or contract database. Distinguish the business owner
   from technical/control reviewers. Ask only what changes the next step.
2. **Inspect without changing anything.** In the application repository, read existing
   instructions, test commands, CI, ownership and Golden Path configuration. If the
   selected kit version does not implement the `adoption` subcommand (check its
   script source first), inspect setup manually instead; do not invoke an unknown
   script command. If the
   checked kit is copied in, find its `gate.mjs` in
   `.golden-path/install-manifest.json` and run `node "<installed-gate.mjs>" adoption`.
   Otherwise, from a Golden Path source checkout, run
   `node plugin/scripts/gate.mjs adoption --target "<application-repo>"`.
   Add `--github` only when authenticated, read-only GitHub inspection is permitted;
   add `--json` for structured output. In plugin mode, use the plugin's
   `scripts/gate.mjs` with the same arguments. Do not execute discovered project
   commands just to inspect setup.
3. **Explain the gaps in ordinary words.** Each diagnostic is verified, missing or
   unverified, with evidence and a next step. "Verified" describes the stated
   configuration fact only. Missing acceptance is valid in method-only use.
   The command does not prove client invocation, test quality, owner approval,
   bypass safety or business success. It does not install, write state, run tests,
   change GitHub settings or notify an owner.
4. **Agree a few examples.** Show inputs and expected results for owner approval.
   Existing developer tests are not automatically owner-approved acceptance.
   Drafting executable acceptance is a separate change for the owner to approve,
   never part of the implementation session. Preserve the method's acceptance
   boundary; start implementation from the committed, latest approved baseline.
5. **Configure only what is missing.** Explain proposed files before installing;
   use the existing installer with `--dry-run` first. New projects can begin with
   the method alone and add their first real application check as code takes shape.
   Existing projects reuse their commands, CI and review process. Do not replace
   configuration, suppress conflicts, invent a passing check or remove existing
   tests. Installer reruns preserve configuration; authorized revisions need
   explicit review. An authorized maintainer configures required checks, Code Owner
   review, stale-approval dismissal and bypass policy; files alone do not prove them.
6. **Verify, implement, return evidence.** Verify the selected client's discovery,
   refusal and blocking in a disposable repository. Keep heavier checks in CI.
   Surface FAILED/UNVERIFIED outcomes through the existing PR/review process;
   stopping is not success and no automatic notification is promised. Follow the
   method for implementation and real expected-versus-actual output, gaps and
   owner judgment. Passing tests does not authorize merge or deployment.

## Enable the optional visual App

When the user asks to open or enable the Golden Path visual App, help them reach
the view, not just a configuration file. The App remains optional; method-only
work must still be usable if setup is declined or unsupported.

1. Establish the application repository root and check Git, Node.js 22+, and
   VS Code/Copilot MCP Apps support. Explain any missing prerequisite explicitly.
   Read the kit's [App setup guide](https://github.com/krnese/golden-path/blob/main/docs/MCP-APP-SETUP.md)
   and inspect existing MCP configuration without executing its commands.
2. Explain the separate kit checkout, dependency installation/build, and proposed
   workspace registration. Obtain permission for those effects; don't infer it
   from asking to see the App. Review existing checkouts rather than overwriting
   or silently updating them. Do not copy the App runtime into the application.
3. Use the supported setup commands, preview the registration with `--dry-run`,
   then configure it only within permission. Preserve other servers and refuse
   conflicts; do not silently duplicate a legacy registration or weaken trust.
4. Run `node "<kit>/examples/mcp-app/verify.mjs" --target "<application-root>"`.
   It starts the expected configured read-only server and verifies its tools,
   actual inspection, repository binding and App resource. A failed verification
   is a setup failure, not success. Do not run project checks to populate the UI.
5. Guide the user through host discovery/start and trust prompts. Invoke
   `inspect_engineering_session` without a session ID to open the view; let the
   user choose existing work instead of selecting the newest session. A fresh
   project should show the connected welcome view. If the tool is not discovered,
   help restart the server or open a fresh chat; report native rendering as
   unverified until the user can see it. Configuration alone is not setup complete.
6. Continue with the user's intended outcome in the same conversation. Missing
   sessions, acceptance and evidence are normal initially. Never create fake
   session records, approved examples or passing checks merely to fill the App.
   Share agreed intent through existing task/PR records; local notes are proposals.

## New application: guided bootstrap

Start from the desired outcome, not a required stack or a universal generator.
Recommend the smallest useful application slice and explain consequential
foundation choices. Once the relevant decisions and acceptance baseline are
approved, scaffold and implement within that boundary using existing ecosystem
tools. Drafting executable owner acceptance remains a separate reviewed change,
never part of the session implementing it.

Propose a setup PR with real dependency installation, build and test commands;
the existing checked installer and opt-in CI where useful; acceptance and ownership
configuration for actual owners; and a PR description showing expected versus
actual results and gaps. Reuse an existing PR template or offer one for review.
The MCP App stays optional. Do not copy this kit's development CI into an application.

Until runnable application code and checks exist, report **build not configured**,
not a placeholder passing workflow. Run the actual application checks when
execution is authorized. Report missing tools, baseline failures and unsupported
setup explicitly; do not make a new runtime or approval service to orchestrate setup.

## Multiple engineers: a shared agreement per change

Team size and repository age are independent: a brownfield repository may have
many engineers. Record the outcome, boundaries, accountable owner, acceptance
and decisions in the existing issue/PR and reviewed artifacts, not a private
conversation or one enormous agreement for the whole application.

Engineers can implement in separate branches and sessions against the same
latest owner-approved acceptance baseline. A commit hash alone is not proof of
approval. Follow the method when owner acceptance changes; do not silently
rewrite approved examples during integration. Surface overlapping work and
changes to shared interfaces, authority or operating responsibilities to the
affected owners. File ownership routes review; it cannot detect every semantic impact.

Business owners judge intended behavior; technical owners review affected design
and controls. Normal implementation remains autonomous within delegation, subject
to existing mandatory review. Do not require every engineer to approve every
refactor or agent action. Escalate consequential agreement changes to the right owners.

Evidence belongs to the actual PR revision and comparison baseline. The optional
MCP App is an inspection window, not a shared approval or state service: local
snapshots can describe different branches and do not automatically synchronize
GitHub CI or reviews. Link the authoritative records and real check results;
do not infer team approval from a local session, gate result or another person's chat.

## Brownfield: strengthen one change without replacing the process

Inspect the existing application read-only first: build/test commands, CI,
ownership, requirements, architecture constraints, effective protections and
known failures. Do not scaffold over it, migrate it into a template or replace
working controls. Existing developer tests are not automatically owner-approved
business acceptance.

Pilot one bounded feature or fix. Agree its examples with the accountable owner,
reuse relevant checks and make an additive adoption PR only for missing setup.
Preserve custom configuration and refuse destructive conflicts. Do not require
retrofitting a complete contract onto the legacy application before useful work.
Record baseline failures separately; never hide, skip or relabel them as passes
to make adoption look successful. Repository-wide settings affect more than
the pilot and need explicit maintainer authorization.

## Repository protection: preview, authorize, apply, verify

The adoption report is read-only; it does not apply GitHub settings. After actual
CI has run, preview the exact proposed changes for an authorized maintainer:
required PRs and actual check names; appropriate owner review and stale-approval
dismissal; ownership of acceptance and enforcement sources (workflows,
configuration, checking code and CODEOWNERS); and direct-push, force-push and
bypass policy. Preserve existing stronger requirements.

If explicitly authorized to change settings, use existing GitHub administration
tools, then read the effective settings back. Distinguish verified, missing and
unverified findings; a file, API write success or green test is not protection.
If permissions, plan capabilities or bypasses prevent enforcement, explain the
limitation without silently weakening the proposed policy. A solo maintainer
cannot approve their own PR: explain the need for another eligible reviewer or
an explicitly reviewed limitation instead of creating a deadlock or fake approval.

Prove an adoption pilot in a disposable repository using representative fixtures:
the application builds and its tests run; an implementation regression fails CI;
unauthorized acceptance changes are rejected; enforcement changes receive the
intended review; and unavailable permissions/protection stay explicit. These are
verification targets, not claims that the current installer performs them.
Report which were actually exercised and which still require a human or GitHub trial.

## New project, clone or template?

Work in the application repository. A clone of the Golden Path kit has checks
for the kit, not business acceptance for a new application.

A small, stack-appropriate GitHub application template can reduce greenfield
setup: include the method and honest onboarding guidance, retain license notices,
and omit demo acceptance, fictional owners and placeholder passing checks.
Configure real acceptance and ownership for the new repository; verify its GitHub
settings independently. Template generation copies files, not proof of enforcement,
and later template updates do not automatically upgrade generated repositories.
The [Golden Path starter](https://github.com/krnese/golden-path-starter) is a
separate, method-only GitHub template. Use its **Use this template** action for
a fresh application; do not copy this kit's development repository instead.

For brownfield work, install into the existing repository. Do not migrate it into
a template or replace its working controls.
