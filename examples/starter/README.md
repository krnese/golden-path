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
   > For a new application, propose the smallest useful slice and real build/test
   > setup. Keep this change's agreement in our shared issue/PR, not private chat.
   > Preview repository protection changes for an authorized maintainer.
   > Do not change tests or configuration just to make setup look complete.

4. Describe your first useful task. Approve the meaning of its examples before
   implementation. If they need executable acceptance tests, have those drafted
   and reviewed as a separate change first.
5. After implementation, review actual output next to the expected results,
   uncovered cases and the checked revision. Record your judgment in the task
   or PR: meets the need, needs revision, or cannot yet judge.

Do not treat the implementing agent as the owner of the business rule. Passing
tests is evidence for your decision, not approval to merge or deploy.

## From an empty repository to a checked application

The normal Copilot agent follows the installed
[guided adoption procedure](.github/skills/golden-path/references/ADOPTION.md).
It helps establish the outcome and approved acceptance baseline, then scaffolds
the agreed application slice and proposes real build, test and CI configuration.
Executable owner acceptance is drafted and approved as a separate change before
implementation. Until real application checks exist, **build not configured**
is the honest result; the starter does not supply a placeholder passing workflow.

After actual CI runs, an authorized maintainer can review proposed required
checks, owner review, stale-approval dismissal and bypass policy. Protect both
acceptance and the machinery checking it. Applying repository settings requires
explicit permission and verification of the effective settings afterward.
Files alone do not harden GitHub; unsupported permissions or plan capabilities
must remain explicit. This is agent guidance using existing tools, not an
automatic scaffolding or repository-hardening service.

## Working with a team

Keep one agreement per change in the existing issue/PR and reviewed examples,
with shared repository controls underneath. Business owners approve intended
behavior; technical owners review affected design and controls. Engineers can
work in parallel against the latest owner-approved acceptance baseline, keeping
evidence tied to the actual PR revision. Do not require a committee for ordinary
implementation, but surface changes affecting other teams' interfaces or authority.

Private conversations and local App snapshots are not shared approval records.
A solo maintainer cannot approve their own PR; explain the reviewer or policy
limitation rather than pretending independent review exists.

## Already have an application?

Adopt into that repository; do not migrate it into this template. Start read-only,
reuse existing build/test commands, CI and ownership, and pilot one bounded
feature or fix. Add only missing setup through a reviewed change. Do not retrofit
the whole legacy application or replace working controls as an adoption prerequisite.
Record existing failures honestly; never hide them to make adoption green.
Team collaboration and brownfield adoption use the same agreement and procedure.

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

## Optional: open the Golden Path MCP App in VS Code

The App adds guided contract, acceptance, evidence, change and handoff inspection
over your application's existing artifacts. **Why does this exist?** separates
verified relationships from inferred hints; **Agreement delta** identifies known
agreement-source changes requiring review. Guided and engineering views use the
same records. It cannot approve acceptance, run checks, merge or deploy.

The starter stays method-only: no App runtime or dependencies are copied into
your application. To opt in, install Git and Node.js 22+ and use VS Code/Copilot
with MCP Apps support. From your application repository in PowerShell:

```powershell
git clone --branch main --single-branch https://github.com/krnese/golden-path.git ..\golden-path-kit
npm ci --prefix ..\golden-path-kit\examples\mcp-app --no-audit --no-fund
npm --prefix ..\golden-path-kit\examples\mcp-app run build
node ..\golden-path-kit\examples\mcp-app\configure.mjs --target . --dry-run
node ..\golden-path-kit\examples\mcp-app\configure.mjs --target .
```

Review the source and dependency lock before installing. The kit is a separate
sibling checkout; commands do not install dependencies into your application.
If `golden-path-kit` already exists, review and update that checkout instead of
cloning over it. In another shell, use its native path separators.

The final command explicitly creates `.mcp.json` at the application repository
root, using the portable Copilot `mcpServers` format. The Copilot harness reads
this directly instead of forwarding an older VS Code registration. Only the two
read-only Golden Path inspection tools are enabled. The server runs from the kit,
with **your application** as `--target`.

The host must launch the workspace server from the application repository root:
`--target .` binds that working directory. The usual sibling layout yields a
relative server path without editor-specific `${workspaceFolder}` variables;
moving both repositories together preserves it. A kit on another drive requires
an absolute, machine-specific server path: review it before sharing.

Existing configuration is never overwritten, including JSON with comments.
Use `--dry-run` to obtain the proposed `mcpServers` entry and merge it manually
while preserving other servers. Existing `.vscode/mcp.json` also requires review
before setup, to avoid registering a second copy of the same server.

In VS Code, use **Chat: Open Customizations > MCP Servers**, start
**golden-path-experience**, and approve the host's trust/permission prompts only
after reviewing the configuration.
Then ask Copilot:

> Call inspect_engineering_session and show the Golden Path MCP App for this
> repository. Let me choose a recorded session if one exists. Show missing
> configuration and evidence as unavailable; do not create checks or infer approval.

A fresh method-only application has no configured gate, recorded engineering
sessions or retained test output. The App must show those gaps, not passing
checks or an approved contract. Its local guided notes are proposals only and
are lost when the panel reloads; retain agreed intent in your existing task or
owner-review process. The read-only `inspect_golden_path_adoption` tool can also
show missing setup. Add real checks separately using the reviewed upgrade below.

### Migrating an older App registration

If VS Code flags `.vscode/mcp.json`, follow its
[Copilot harness migration guidance](https://code.visualstudio.com/docs/agent-customization/migrate-customizations#_migrate-mcp-servers).
Preview the updated helper's portable entry first. In the migration UI, select
only the Golden Path server and review any unsupported properties. Keep other
servers, environment variables and credentials unchanged.

The built-in migration resolves `${workspaceFolder}` to the current absolute
path. For the usual sibling layout, review the result against the helper preview
and use its relative server path and `--target .` before sharing the file. Do not
copy the old top-level `servers` object into `.mcp.json` or enable additional
tools. Test the migrated server, then remove only its old entry if it remains;
do not keep both registrations. Restart the server and reopen the App, or start
a fresh chat if the current session retains the old registration. Verify the
migration warning is gone in your host.

### Keeping the App up to date

Template changes do not update previously generated applications. The App is
loaded from the separate kit checkout, so review its changes, fast-forward that
checkout, rerun the `npm ci` and build commands above, then **restart the MCP
server and close/reopen the App panel**. Otherwise an old running server may
serve a newer UI with an incompatible inspection format.

Updating the App does not upgrade the copied Golden Path method or application
controls. Review those installation changes separately. To disable the App,
stop its server and remove only its server entry from `.mcp.json`; the
method and any existing acceptance protections continue working.

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
