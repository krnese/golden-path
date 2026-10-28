# Golden Path MCP Apps experience prototype

An optional shared decision workspace, not another reasoning agent. Inspect a
requirement or assumption, see its linked components/requirements, edit the draft
statement and rationale, then save it into **the same persisted model the
conversation reads**. There is no separate App model or browser storage.

The first slice uses an explicitly isolated example, not real business acceptance.
The usual method, required CI and owner judgment remain authoritative. The
prototype cannot approve, merge, deploy, edit acceptance, run project checks or
change GitHub settings. Dependencies are isolated here, not added to the core kit,
installer or starter template.

## Designed for the person who owns the decision

The primary journey is **understand what matters → challenge assumptions →
revise a draft → continue the conversation**. People should not need to
understand MCP, JSON, revisions or component identifiers to review the wording.

- **Plain language first.** Requirements appear under "What matters"; assumptions
  under "What we're assuming", explicitly distinguished from proven facts.
  Prompts explain what to write and why. Technical source details are secondary.
- **Context, not a document maze.** Requirements show connected parts and the
  assumptions behind them. Assumptions link back to affected requirements.
  These links are context, not evidence that a requirement has been met.
- **Deliberate changes.** Explicit save, field validation, visible saved/unsaved
  state, and confirmation before discarding edits. Inputs are read-only during
  save/reload so an in-flight response cannot erase newly typed text. Incoming
  conversation results do not replace a dirty form.
- **A clear next action.** "Prepare conversation handoff" produces a selectable
  prompt from the last loaded saved model, never unsaved form text. It asks the
  agent to re-read the source, discuss uncertainty, obtain missing examples of
  success, and return actual evidence to the owner. It does not send anything,
  claim completed stages, or create a parallel report/approval store.
- **Small screens and keyboard.** Narrow views use a grouped item picker rather
  than forcing people through a long navigation list before each edit. Fields
  have visible labels, explanatory text, keyboard focus and inline errors.
- **One visual language.** A shared, bundled palette uses deep navy surfaces,
  cyan actions, violet selection and restrained gold notices, inspired by the
  supplied architecture reference. The local preview defaults to dark; the Apps
  retain a complementary light palette when the native host requests it.
  Accents reinforce text labels, never replace them. Palette regressions check
  text contrast of at least 4.5:1 and control/focus contrast of at least 3:1.
- **Golden Path remains the method.** An optional explanation maps the experience
  to Intent, Context, Boundary, Acceptance and Report, without a mandatory wizard
  or green completion badges. Owner judgment and existing engineering controls
  remain outside the App.

The seed is still a toolkit example, not a researched customer workflow.
This UX is a design hypothesis: no non-engineering participant study, business
outcome measurement or full accessibility audit has been performed. Before
broadening it, observe a decision owner trying to explain the intent, challenge
an assumption and return to the conversation without coaching. Check whether
they distinguish saving from approval and missing evidence from success.
Diagrams and additional stages should earn their place through those tasks,
not through feature completeness.

## Build once

From the kit repository root, with Node.js 22+:

```powershell
npm ci --prefix examples\mcp-app --no-audit --no-fund
npm --prefix examples\mcp-app run build
npm --prefix examples\mcp-app test
```

Initialize the example **once**:

```powershell
npm --prefix examples\mcp-app run init-demo
```

This explicitly creates `.local/mcp-app/architecture.json` in this checkout.
That directory is gitignored. Existing models are refused, never reset or
overwritten. The seed [example-model.json](example-model.json) remains unchanged.
Use `node examples\mcp-app\init-demo.mjs --state "<new-file>"` for another example.

In another shell, use your OS's path separators. Built HTML includes its scripts
and styles; the Apps request no external network/resource permissions.

## Try it in VS Code

The optional [.vscode/mcp.json](../../.vscode/mcp.json) entry binds this server to
the workspace and the initialized example file. It does not install Golden Path
into another project or enable a check/approval policy.

1. Build and initialize the prototype first.
2. Open **MCP: List Servers**, select **golden-path-experience-preview**, and start
   it. Review VS Code's trust/permission prompts.
3. In Copilot's normal agent, ask:

   > Inspect the example architecture requirements and assumptions with
   > inspect_architecture. Show the MCP App so I can challenge the assumptions and
   > revise a draft. After my changes, reload the persisted model and explain
   > their implications. Do not approve anything or change real acceptance.

4. Choose `R1` under **What matters**, edit its wording/reason and **Save draft**.
   Choose `A1` under **What we're assuming** to challenge an
   assumption. Select `R2` or `A2` to inspect a locked baseline example.
5. Use **Prepare conversation handoff**, select/copy the prompt and paste it into
   the conversation. Unsaved edits are explicitly excluded from that summary.
6. Ask Copilot to call `inspect_architecture` again. It must see the revision and
   content saved by the App, then reason from that state rather than a chat-only
   or UI-only copy.

An MCP Apps-capable VS Code/Copilot client is required for rendering. Plain MCP
clients still receive text and structured state. A successful stdio test or
browser preview **does not establish native VS Code rendering or hook behavior**.
Record the actual VS Code version, chat renderer, tool invocation and any errors
when judging that experience.

`--target` fixes the application repository for the separate read-only adoption
tool. Optional `--state` fixes the isolated architecture example file. Neither
path can be redirected through tool arguments. This prototype does not adapt or
invent an architecture model for a customer's existing records.

## One source of truth, bounded writes

- `inspect_architecture` reads the current JSON model for both chat and the App.
- `update_architecture_draft` writes only a draft statement and rationale, using
  the inspected `expectedRevision`. IDs, status, traceability links and baseline
  entries cannot be changed through this operation.
- Stale saves are rejected. A cross-process lock serializes writers and an atomic
  file replacement prevents readers from observing a partial JSON document.
- A successful save returns the persisted model with its new revision. When the
  host supports it, the App also sends a model-context freshness notification.
  That notification does not prove the agent reloaded or understood the change.
- The agent remains responsible for re-reading current state, reasoning,
  explanation and escalation. A revision is not an approval or signed audit log.
- Baseline items are **locked examples**, not a claim that a business owner
  approved this model. Filesystem access can bypass application rules; this is
  not a new authorization boundary.

If a process crashes while holding `<state-file>.lock`, saves fail explicitly.
Inspect the file and ensure no writer is running before manually removing that
specific stale lock. No automatic lock takeover or silent recovery is performed.

## Local visual preview

```powershell
node examples\mcp-app\preview.mjs --target . --state .local\mcp-app\architecture.json
```

Open <http://127.0.0.1:4328>. Stop with Ctrl+C. This local host uses the real stdio
MCP server, reads its UI resource and connects the official App/AppBridge SDKs in
a sandboxed iframe. The host is deliberately labelled **not VS Code**. It binds
only to loopback, refuses foreign origins and forwards only the bound inspection
and draft operations. It has no reasoning agent or real Copilot conversation.
It is a development aid, not a general-purpose MCP host.

Omit `--state` to preview the original **read-only adoption report** instead.
Its `inspect_golden_path_adoption` tool still never writes files or runs project
checks; it does not gain architecture-editing effects.

## What to validate

| Interaction | Expected observation |
| --- | --- |
| Inspect requirements and assumptions | Statement, rationale, status and traceability from one model |
| Edit and save a draft | Persisted revision increases; an independent MCP client sees the same content |
| Save against an older revision | Explicit conflict; newer content is not overwritten |
| Inspect a baseline item | Read-only fields; save cannot change it |
| Reload after another client's edit | The same latest persisted model appears |
| Leave a draft with unsaved edits | Confirmation offers keep editing or discard; cancel retains the proposal |
| Prepare a conversation handoff | Saved content/version only; explicit reread and missing-evidence/owner-judgment guidance |
| Empty or whitespace-only draft | Inline field error and focus; no save |
| Inspect raw state | Exact model snapshot, not an independent representation |
| Tool/connection failure | Explicit error, not a successful save or reload |
| Small screen and keyboard | Readable controls, visible focus, no horizontal overflow |
| Native VS Code rendering | Actual embedded app, not merely a text fallback or local browser |

These are developer validation scenarios, not owner-approved business acceptance.
There is no approve, install, edit-acceptance, run-checks or merge action. Nothing
is published or sent to GitHub. Architecture diagrams, boundary/authority-path
comparison, change-impact analysis and evidence/Touchdown review are future
slices, not features claimed by this first experiment.

## Observed local results

### Initial shared-state trial

Local validation on Windows with Node.js 24, 28 October 2026:

| Scenario | Expected | Observed |
| --- | --- | --- |
| App saves `R1` draft | One persisted revision change | Revision `0` to `1`; App reported saved, not approved |
| Independent stdio MCP client reads | Same state as the App/file | Exact JSON equality; baseline examples unchanged |
| Independent client edits `A1` | App and client share the source | Persisted revision `1` to `2` |
| App saves its stale revision `1` | Reject without overwriting revision `2` | `Model revision changed from 1 to 2`; unsaved proposal retained |
| Explicit discard/reload | Read current persisted state | Revision `2`, including the independent assumption edit |
| Baseline inspection | No editable baseline | Read-only fields and disabled save; API rejection covered by tests |
| Narrow screen and keyboard | No horizontal overflow; usable form | 343px document width matched 343px viewport; Tab moved between labelled fields |
| Clean install/build/protocol regressions | Reproducible, real stdio/resource behavior | `npm ci`, build and all 20 tests passed |
| Native VS Code rendering and conversation | Signed-in client validation | Not established by these local tests |

These are engineering observations, not proof of improved decisions, agent
understanding, productivity or owner approval. The local host acknowledged a
freshness notification but has no Copilot conversation. A CI matrix is configured;
these local results are not a published PR check record.

### Curated review UX

Further local validation on Windows with Node.js 24, 28 October 2026, using an
isolated throwaway model for writes (the live example was left unchanged):

| Scenario | Expected | Observed |
| --- | --- | --- |
| Switch away from unsaved edits | Ask before discarding; keep editing retains the proposal | Keyboard-opened dialog focused Keep editing; cancelling kept the text |
| Saved-state handoff while editing | Do not smuggle unsaved text into the summary | Saved text/version included, unsaved proposal excluded, warning shown; whole prompt selectable |
| Whitespace-only statement | Explain the field error without a server write | Inline error, invalid state and focus on the statement |
| Save while a response is delayed | Prevent edits being lost to an in-flight response | Fields read-only while waiting; real save advanced the isolated model from version 0 to 1 |
| Independent conversation update | Do not overwrite an unsaved proposal | Real update advanced to version 2; an injected tool-result notification left the proposal intact and displayed an update notice |
| Save an older version | Reject and preserve the proposal | Real MCP server rejected version 1 against 2; confirmed reload displayed version 2 |
| Save/reload endpoint failure | Explicit error; retain the proposal; no false success | Injected HTTP 503 responses preserved edits; persisted version stayed 2 |
| Incoming conversation error | Surface the failure without erasing edits | Injected error notification displayed explicitly; proposal retained |
| Narrow navigation and keyboard | Direct item choice, safe cancellation, no horizontal overflow | Grouped picker; cancelled switch retained A1 and its proposal; Tab moved from statement to reason |
| Responsive widths | Document width equals available App viewport | 290/290px, 359/359px and 1120/1120px at outer widths 320, 390 and 1280px |
| Field contrast in light/dark themes | Text at least 4.5:1; control boundary at least 3:1 | Text 13.03:1 / 12.03:1; boundary 3.49:1 / 4.41:1 against the field background |

`npm --prefix examples\mcp-app run build` and
`npm --prefix examples\mcp-app test` passed with **26 tests, no failures or skips**.
The configured Golden Path check and both integrity checks passed; the related
site/CI-template run passed all 30 tests. Existing protected tests were not
modified. Saves use explicit button actions: native HTML form submission is
forbidden in the sandbox, so widening sandbox permissions was not necessary.

These are local developer observations, not CI results or a full accessibility
audit. Native signed-in rendering, non-engineering comprehension, actual agent
re-reading and sustained intent-to-outcome benefit remain unproved.

### Reference-palette refinement

The original review palette (including the contrast figures above) was replaced
with the supplied reference's navy/cyan/violet/gold direction. All three views
embed the same stylesheet; no external resource permissions were added.
Build and all **29 prototype tests passed**, including both palettes' contrast
thresholds and self-contained theme embedding. The configured gate passed.
Browser checks applied light/dark host-context notifications and found no
horizontal overflow at outer widths 320, 390 and 1280px. The live example stayed
at version 2. Native-client rendering remains a separate validation.

Pre-PR regression checks also cover full-length Unicode drafts, a request split
inside a UTF-8 character, and oversized-request refusal without a state change.
The preview accepts at most 128 KiB per draft request and decodes only after
assembling the bounded bytes. All **31 prototype tests passed**.
