---
name: golden-path-local-models
description: Optional. Use only when the user asks about running the coding agent on a local model (privacy, offline, cost or experimentation). Detects the environment, explains setup options, verifies a local endpoint before use, and recommends local, hosted or no LLM per task. It recommends; it never selects or switches the model.
---

# Golden Path: local models (optional)

This skill is separate from the core `golden-path` skill and is not part of the method. Use it only when the user asks.

**Boundary.** This skill **recommends**. The host (the user, their client, and its policy) **selects and runs** the model.
- Repository instructions cannot switch the model in a running conversation.
- There is no router in this kit.
- Level 2 checks run the same regardless of which model did the work.

## 1. Detect and explain (read-only)
Report each item and say how you know it (a command's output, or the user told you):
- **OS** and version, **hardware** (CPU, GPU or NPU, Apple Silicon or not), **memory** (RAM, and VRAM if there is a GPU), free **disk**.
- **Runtime**: whether Foundry Local (`foundry --version`) or another local server is installed.
- **Agent client** and version (for example VS Code with Copilot Chat), and whether its supported integration is available. For VS Code that is the BYOK *Custom Endpoint* provider. Managed Copilot Business/Enterprise needs the BYOK policy enabled by an admin.
- **Motive**: privacy, offline, cost or experimentation. Ask if it isn't stated; the motive decides the recommendation.

## 2. Set up (only with approval)
- Windows: [references/windows.md](references/windows.md). macOS: [references/macos.md](references/macos.md).
- **Ask before** any large download (runtime, execution providers, model weights) or any client/config change. State the size where it is known.
- Keep downloads, endpoints, ports, keys and client settings **out of the repo**. They are per-user, machine-local settings.

## 3. Verify before use
Run these and report each as pass, fail or not tested:
1. The endpoint answers (`foundry server status` shows the URL; a minimal chat completion returns text).
2. **Network binding is localhost only** (`127.0.0.1`/`localhost`, not `0.0.0.0` or a LAN address). Check with `netstat -an` (Windows) or `lsof -iTCP -sTCP:LISTEN` (macOS).
3. Streaming works (`"stream": true` returns incremental chunks).
4. Tool calling works for **this** model: a request with one tool definition returns a well-formed tool call. Set `toolCalling` in the client only if it does.
5. A client-level chat test: pick the model in the client's picker and complete one small real task.

Report the limits you saw: context size, speed, tool-call reliability, and failures. **A model being in the catalog, or supporting tools, does not mean it is reliable for engineering work.** Only these checks and the task's own tests show that.

## 4. Recommend

| Situation | Recommendation |
|---|---|
| A small, well-scoped task of a kind the local model has **already handled** (it passed the checks above and the task's tests) | Local model |
| Complex work, large context, or heavy tool use, **if policy permits** hosted models | Hosted model |
| Local-only is required (privacy/offline) but the local model can't do the task | Narrow the task, or stop and say so. **No automatic cloud fallback.** |
| No LLM is needed (formatting, renames, search, codegen from a schema) | Deterministic tools (formatter, linter, refactoring tool, script) |

State which row applied and why. Leave the choice to the user.
