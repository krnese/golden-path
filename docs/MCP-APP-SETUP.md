# Optional: open the Golden Path MCP App in VS Code

The App is optional. You can start building with the Golden Path method without
installing it. Use this guide to prepare a brief or inspect recorded agreement,
acceptance, evidence, changes and handoff. The App cannot approve acceptance,
run checks, merge or deploy.

## What you will see

**Guided: shape and review your brief.** Start with your outcome, answer only
missing details and edit the brief before choosing **Continue in Copilot chat**.
The conversation and implementation stay in your existing chat.

![Guided brief review with five editable sections and a chat handoff](assets/mcp-app-guided.png)

**Engineering: inspect changes, checks and evidence.** Look behind the brief
without losing your answers. Switching does not start work or run checks.
A project with no recorded work shows a calm empty state; **Inspect repository
setup** opens the full technical view.

![Engineering on a project with no recorded work, offering Guided or repository setup](assets/mcp-app-engineering.png)

These are local browser previews, not native VS Code rendering or proof of
approved acceptance. The sample Guided brief is unshared.

## First-time setup

For an agent-assisted setup, ask your normal Copilot agent:

> Help me start this project with Golden Path and enable its visual App. Check
> prerequisites, explain and perform setup with my permission, then help me open
> it. Start with my intended outcome; don't invent acceptance or passing checks.

The installed adoption procedure covers permission, conflicts, verification and
host actions. The commands below are the supported path, not required manual work
for every user.

The starter stays method-only: no App runtime or dependencies are copied into
your application. To opt in, install Git and Node.js 22+ and use VS Code/Copilot
with MCP Apps support. From your application repository in PowerShell:

```powershell
git clone --branch main --single-branch https://github.com/krnese/golden-path.git ..\golden-path-kit
npm ci --prefix ..\golden-path-kit\examples\mcp-app --no-audit --no-fund
npm --prefix ..\golden-path-kit\examples\mcp-app run build
node ..\golden-path-kit\examples\mcp-app\configure.mjs --target . --dry-run
node ..\golden-path-kit\examples\mcp-app\configure.mjs --target .
node ..\golden-path-kit\examples\mcp-app\verify.mjs --target .
```

Review the source and dependency lock before installing. The kit is a separate
sibling checkout; commands do not install dependencies into your application.
If `golden-path-kit` already exists, review and update that checkout instead of
cloning over it. In another shell, use its native path separators.

The configuration command explicitly creates `.mcp.json` at the application repository
root, using the portable Copilot `mcpServers` format. Only the two read-only
Golden Path inspection tools are enabled. The server runs from the kit, with
**your application** as `--target`.

The verification command starts that expected configured server from the
application root, checks its read-only tools, validates the actual inspection and
repository binding, and reads the current App resource. It refuses to execute
modified server entries. It does not execute project checks or create sessions,
acceptance or evidence. **Configuration alone is not setup complete:** verify
host discovery and actual native rendering in VS Code as the next step.

The host must launch the workspace server from the application repository root:
`--target .` binds that working directory. The usual sibling layout yields a
relative server path without editor-specific `${workspaceFolder}` variables;
moving both repositories together preserves it. A kit on another drive requires
an absolute, machine-specific server path: review it before sharing.

Existing configuration is never overwritten, including JSON with comments.
Use `--dry-run` to obtain the proposed `mcpServers` entry and merge it manually
while preserving other servers. Existing `.vscode/mcp.json` requires the
[legacy registration review](#migrating-an-older-app-registration) below before
setup, to avoid registering a second copy of the same server.

In VS Code, use **Chat: Open Customizations > MCP Servers**, start
**golden-path-experience**, and approve the host's trust/permission prompts only
after reviewing the configuration. Then ask Copilot:

> Call inspect_engineering_session and show the Golden Path MCP App for this
> repository. Let me choose a recorded session if one exists. Show missing
> configuration and evidence as unavailable; do not create checks or infer approval.

A project with no recorded sessions opens a connected welcome view.
**Guided** and **Engineering** stay visible and open either presentation directly.
The welcome message can be copied into the existing chat or shared explicitly
when the host supports messaging. No sessions or results are invented to
populate the view.

Guided can review an optional proposed brief supplied from the conversation.
It asks only for missing details, one at a time, then offers an editable brief
with one handoff action. Complete supplied briefs go straight to review after
explicit application. Repository inventory and detailed check counts remain in
Engineering, not in the Guided briefing.
**Continue in Copilot chat** sends the reviewed message when supported, then
requests closure only after the host accepts it. The host controls closing;
delivery and closure failures are distinct. Reopen the App to inspect recorded
work and evidence, not an App-owned conversation or approval database.

### If continuing in chat does not complete

The App waits up to 60 seconds for the host's message acknowledgement.
Brief editing, sending and its copy-selection actions are disabled while waiting;
the draft is retained.

| What happened | What the App does | What to do |
|---|---|---|
| Host explicitly declined | Keeps the draft; does not request closure. | Retry deliberately, or select/copy the message. |
| Timeout, disconnect or other missing acknowledgement | Marks delivery **unconfirmed**; does not request closure or resend the same text. | Check chat first: the message may already be there. Copy only after checking. |
| Message accepted; closure notification failed | Keeps acceptance distinct from closure failure; does not resend. | Close the panel manually. |
| Message accepted; view stays open | Reports that the host controls closure. | Close manually; do not resend. |

Reviewing a draft again does not erase its accepted/unconfirmed delivery state.
Duplicate prevention is for the exact message in the current panel, not a
durable or cross-panel guarantee. Closing/reloading loses local drafts and this
delivery memory; check the existing chat before sending from a reopened panel.
No automatic retry, clipboard write or message delivery occurs.

### Native-host verification

A browser preview or fresh stdio process does not establish native integration.
After rebuilding, restart the **existing** registered MCP server (do not add
a duplicate registration), then close/reopen the App:

1. Call `inspect_engineering_session`. Confirm that the current version
   diagnostics are present and that the repository binding is correct.
   Missing diagnostics indicate an older server; a newer HTML panel alone
   does not establish that the registered server restarted.
2. Confirm Guided and Engineering render, and that switching preserves a local
   draft. If text messaging is not advertised, use the explicit copy fallback.
3. Only with a user-approved brief, choose **Continue in Copilot chat**.
   Confirm the exact message appears once in that conversation. Do not send
   diagnostic messages into a real work conversation automatically.
4. Observe closure separately from delivery. If the panel remains open, check
   its status before closing it manually; do not resend an accepted message.
5. Reopen for the same repository to inspect actual recorded work. An unsent
   local draft or simulated handoff is not a recorded task or passing evidence.

If an older native server says **Select the application repository root**
despite the correct bound root, compare with a fresh inspection and restart
the registered server before diagnosing current code. If it persists after
restart, verify the host working directory, selected Git root and paths.
Do not silently rebind the server, weaken root validation or change protections.
Native delivery/closure and a real independent owner/engineer pilot require
observations in those environments; SDK tests are not substitutes.

### Return after work is recorded

Ask Copilot to open the App again for the same repository and recorded task.
Choose the relevant session when more than one exists. Guided summarizes
changes, verification freshness and decisions needing review; **Review check
results** and **Inspect changes** open the corresponding Engineering tabs.
Refresh after new work or checks are recorded: this is a snapshot, not live
monitoring, and an unavailable or stale result is not a current pass.

Keep the reviewed brief and evidence links in the existing task or PR.
Switching views preserves the current local draft, but closing or reloading
the App does not retain those unsent answers.

### Optional repository snapshot

The repository pulse is offline by default. **Refresh GitHub** explicitly uses
the server's existing GitHub CLI credentials for read-only workflow/run, issue,
PR and branch-control queries. Unreadable state stays unknown. No credentials,
settings or project checks are changed. See the [App's scope and limits](../examples/mcp-app/README.md#read-only-repository-pulse).

A fresh method-only application has no configured gate, recorded engineering
sessions or retained test output. The App must show those gaps, not passing
checks or an approved contract. Its local guided notes are proposals only and
are lost when the panel reloads; retain agreed intent in your existing task or
owner-review process. The read-only `inspect_golden_path_adoption` tool can also
show missing setup. Add real checks separately through the
[adoption procedure](ADOPTION.md).

## Keeping the App up to date

Template changes do not update previously generated applications. The App is
loaded from the separate kit checkout. Review a proposed revision before
switching to it; nothing checks for, downloads or installs a newer release
automatically. To pin it, use a reviewed tag or full commit SHA with
`git -C ..\golden-path-kit checkout --detach <reviewed-tag-or-commit>`
(replace the placeholder before running). Start from a clean kit worktree;
do not discard local changes.

Restore dependencies with the setup `npm ci` command if the dependency
manifest/lock changed or dependencies are missing, rebuild, then
**restart the MCP server and close/reopen the App panel**. Each server process keeps
its startup UI; a later build cannot silently replace that running resource.
The local preview host is pinned too. An existing panel may still contain
an older build, so reopening matters.

Updating the App does not upgrade the copied Golden Path method or application
controls. Review those installation changes separately.

### Version and compatibility diagnostics

Open **Engineering > Version and compatibility**, or ask for either existing
inspection tool. The report separates kit, App and Node versions, declared
copy-in method version/level, and running/checkout/build source identities.
Healthy details stay collapsed and out of Guided; an actual mismatch or missing
diagnostic/panel identity produces a visible recovery warning.

| Status | Meaning | Next action |
|---|---|---|
| `current` | Running source and startup UI match the local checkout/build. | Verify native host discovery/rendering separately. |
| `rebuild-required` | Source changed, or build metadata/resources are missing, invalid or inconsistent. | Rebuild, restart the server and reopen the panel. |
| `restart-required` | A valid current build exists, but this process loaded different source or no usable startup build. | Restart the server and reopen the panel. |
| `unknown` | Source identity could not be established. | Review the explicit error and repair the kit before retrying. |

`current` is **not** a latest-release, dependency-integrity, acceptance or
repository-protection verdict. Source/resource hashes detect local drift;
they are not signed attestations. A copy-in manifest declares a version, not
proof that its files are unchanged or active. A missing manifest is a valid
plugin/manual-installation case, not proof that Golden Path is absent.
An unreadable or malformed manifest remains explicitly unknown.

For machine-readable setup verification:

```powershell
node ..\golden-path-kit\examples\mcp-app\verify.mjs --target . --json
```

Verification requires matching runtime/resource identities and rejects unknown
copy-in manifest state. It starts a **fresh** configured process; it cannot
prove that an already running host process restarted or that native rendering,
chat delivery or panel closure works. JSON reports `hostVerification:
"not-performed"` explicitly.

To roll back, select the previous reviewed kit tag/SHA in the same clean
checkout, restore its dependencies if needed, rebuild, restart, reopen and run
verification again. Keep the existing application registration if the kit path
is unchanged. This does not roll back copied method files or application controls;
review those separately. Older revisions may lack these diagnostics.

## Disabling the App

Stop its server and remove only its server entry from `.mcp.json`; the method
and any existing acceptance protections continue working.

## Migrating an older App registration

**Not required for a new starter or a first-time setup.** This section applies
only if you already registered the App in `.vscode/mcp.json`.

If VS Code flags that file, follow its
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
