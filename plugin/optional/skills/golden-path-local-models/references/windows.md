# Windows: Foundry Local + VS Code Custom Endpoint

**Status: API-verified, client verification pending.**

## Verified by KN on Foundry Local 0.11.0 (Windows)
<!-- TODO(KN): fill in the exact values you observed; the agent that wrote this file did not have them. -->
- Exact model IDs (from `foundry model list --verbose`): _not yet recorded_
- Port behaviour across `foundry server restart` / reboot, with and without `--port`: _not yet recorded_
- VS Code UI chat test (model picker → one real task): **pending**
 The commands and settings below come from primary docs (fetched 13 Oct 2026). The end-to-end VS Code chat with a Foundry Local model has not yet been tested by this kit.

Ask the user before each download or settings change. Nothing here goes into the repo.

## Foundry Local (preview)
Source: [Foundry Local CLI](https://learn.microsoft.com/en-us/azure/foundry-local/how-to/how-to-use-foundry-local-cli), [CLI reference](https://learn.microsoft.com/en-us/azure/foundry-local/reference/reference-cli).
```powershell
winget install Microsoft.FoundryLocal    # install (approval: download)
foundry --version
foundry model list                       # first run downloads execution providers for your hardware (approval: download)
foundry model download <alias>           # model weights, often GBs (approval: download)
foundry model load <alias>
foundry server status                    # daemon state and local service URL; the port is dynamic
foundry model unload <alias>             # free memory when done (CLI reference)
```
- `foundry server start --port <n>` fixes the port (docs). Older docs and builds use `foundry service ...`; check `foundry --help` on your version.
- Foundry Local picks the model variant for your hardware (CPU, CUDA, NPU).

## VS Code: BYOK Custom Endpoint
Source: [AI language models in VS Code](https://code.visualstudio.com/docs/agent-customization/language-models), [Custom model endpoints (Microsoft Learn)](https://learn.microsoft.com/en-us/windows-server/ai/configure-visual-studio-code-local-models).
1. Run **Chat: Manage Language Models** → **Add Models** → **Custom Endpoint**. Enter a name and key, then choose **Chat Completions**.
2. VS Code opens `chatLanguageModels.json` (user profile, not the repo). Set:
```jsonc
[{ "name": "Foundry Local", "vendor": "customendpoint", "apiKey": "${input:...generated...}", "apiType": "chat-completions",
   "models": [{ "id": "<exact model id from foundry>", "name": "<display name>",
     "url": "http://localhost:<port>/v1/chat/completions",
     "toolCalling": false, "vision": false, "maxInputTokens": <model limit>, "maxOutputTokens": <model limit> }] }]
```
- Set `toolCalling: true` only after verification step 4 passes.
- Keep the generated `apiKey` input reference; don't put a raw secret in the file.
- Copilot Business/Enterprise: an admin must enable the *Bring Your Own Language Model Key in VS Code* policy.
- BYOK covers chat, not inline completions, semantic search or embeddings.
- `github.copilot.chat.customOAIModels` is deprecated; use Custom Endpoint.
- Agent Host sessions (for example Copilot sessions in the Agents window) need `chat.agentHost.byokModels.enabled` to use BYOK models. The docs mark it **experimental**; it might change or be removed.

Pending verification: the exact model id format VS Code needs from Foundry Local, the dynamic port across restarts, tool calling per model, and the agent-mode chat test.
