# Guided adoption

Start when the user says "Help me use Golden Path for this task", asks for setup,
or has not established what the installed configuration does. Use the same journey
for new and existing repositories. Do not turn setup into a prerequisite for useful
method-only work, downgrade existing checks, or claim installation proves protection.

1. **Bring one task.** Restate the outcome, what must stay unchanged, who owns its
   meaning and where they will judge the result. Use existing issues and policies,
   not a new mandatory document. Ask only what changes the next step.
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
