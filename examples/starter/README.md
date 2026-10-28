# Your project with Golden Path

A minimal starting point for your application, with the Golden Path method
installed for Copilot's normal agent in VS Code. No application stack is chosen.
Replace this README as your project takes shape.

## Start with one task

1. On the starter's GitHub page, select **Use this template > Create a new repository**.
   If you already generated your application repository, continue there.
2. Clone your new repository and open it in VS Code.
3. Open a new Copilot chat in Agent mode and say:

   > Help me use Golden Path for this task.
   > First understand what I want to achieve, what must stay unchanged, and who
   > decides whether the result meets the need. Propose a few examples we can
   > agree on. Reuse existing controls and explain what is missing or unverified.
   > Do not change tests or configuration just to make setup look complete.

4. Describe your first useful task. Approve the meaning of its examples before
   implementation. If they need executable acceptance tests, have those drafted
   and reviewed as a separate change first.
5. After implementation, review actual output next to the expected results,
   uncovered cases and the checked revision. Record your judgment in the task
   or PR: meets the need, needs revision, or cannot yet judge.

Do not treat the implementing agent as the owner of the business rule. Passing
tests is evidence for your decision, not approval to merge or deploy.

## What is installed

- The Golden Path skill, method and guided adoption reference.
- A marked block in Copilot's project instructions.
- A task prompt and installation manifest for future reviewed upgrades.
- The Golden Path copyright and permission notice in
  [.github/GOLDEN-PATH-LICENSE](.github/GOLDEN-PATH-LICENSE).

**This is method-only guidance.** No runtime is required to read it. There are no
automatic checks, business acceptance tests, CODEOWNERS assignments, workflows,
application dependencies, sample business rules or placeholder passing checks.
Client discovery and effective GitHub controls must be verified, not assumed.

This template does not select a license for your application. Choose one suitable
for your project while retaining the notice for copied Golden Path materials.

## Add stronger checks when they are useful

Use the [Golden Path kit](https://github.com/krnese/golden-path) and its
[adoption checklist](https://github.com/krnese/golden-path/blob/main/docs/ADOPTION.md).
Ask your agent to explain proposed files and preview the existing installer
before upgrading this method-only installation. The installation manifest is
already present; do not overwrite or delete it to force an upgrade.

Use real application commands and owner-approved acceptance. An authorized
maintainer must configure required GitHub checks, Code Owner review, stale
approval dismissal and bypass policy. Configuration files do not establish that
these settings are effective.

Never infer business protection from a green installation result. FAILED and
UNVERIFIED results need attention through your existing review process; stopping
is not success. No automatic owner notification or issue-reopening workflow is
included.

## Template updates and existing applications

Generating from a GitHub template creates an independent repository with a fresh
history. Later template changes do not automatically update your application.
Upgrade the copied kit through a reviewed installation; preserve local changes
and resolve conflicts rather than forcing them away.

For an existing application, use the installer in its current repository instead
of migrating it into this template.
