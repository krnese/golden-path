# Optional: open the Golden Path MCP App in VS Code

The App is optional. You can start building with the Golden Path method without
installing it. Use this guide only when you want visual inspection of contract,
acceptance, evidence, changes and handoff. The App cannot approve acceptance,
run checks, merge or deploy.

## First-time setup

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
root, using the portable Copilot `mcpServers` format. Only the two read-only
Golden Path inspection tools are enabled. The server runs from the kit, with
**your application** as `--target`.

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

A fresh method-only application has no configured gate, recorded engineering
sessions or retained test output. The App must show those gaps, not passing
checks or an approved contract. Its local guided notes are proposals only and
are lost when the panel reloads; retain agreed intent in your existing task or
owner-review process. The read-only `inspect_golden_path_adoption` tool can also
show missing setup. Add real checks separately through the
[adoption procedure](ADOPTION.md).

## Keeping the App up to date

Template changes do not update previously generated applications. The App is
loaded from the separate kit checkout, so review its changes, fast-forward that
checkout, rerun the `npm ci` and build commands above, then **restart the MCP
server and close/reopen the App panel**. Otherwise an old running server may
serve a newer UI with an incompatible inspection format.

Updating the App does not upgrade the copied Golden Path method or application
controls. Review those installation changes separately.

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
