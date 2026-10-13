# Windows: Foundry Local + VS Code Custom Endpoint

**Status: API-verified, client verification pending.**

## Verified by KN on Windows (13 Oct 2026, version-specific)
These were observed on one machine. Treat them as an example, not a guarantee for other versions or hardware.

**Versions:**
- Foundry Local CLI **0.11.0**, from WinGet package **Microsoft.FoundryLocal 0.11.0.0**.
- VS Code **1.141.1**, Windows x64.

**Model:**
- Exact model ID **`qwen2.5-coder-0.5b-instruct-generic-gpu:4`**, alias **`qwen2.5-coder-0.5b`**.
- About **528 MB**, WebGPU variant. Downloaded and loaded.

**Port:**
- The first, automatic-port service URL was `http://127.0.0.1:62719`. That was a single observation of a dynamic port, not a reusable fixed port.
- These two commands set a fixed port:
  ```powershell
  foundry config set port 5273 --force
  foundry server restart --port 5273
  ```
- Verified listener **`127.0.0.1:5273`** (localhost only) and endpoint **`http://127.0.0.1:5273/v1/chat/completions`**. The explicit restart honoured the selected port.

**API checks:**
- Non-streaming and streaming requests both returned HTTP 200 with `LOCAL_OK`.
- With an **explicit** function choice, the model called `add_numbers` with `{a:2, b:3}`.
- With **automatic** tool choice it did **not** reliably produce a call. That shows protocol compatibility, not reliable autonomous tool use.

**Unload:** `foundry model unload` freed memory after verification.

**Client:**
- The user-level Custom Endpoint configuration and the experimental Agent Host BYOK flag were written in the user profile, not this repo.
- This did not switch the model in the existing conversation.

**Not verified (pending):**
- Persistence after a reboot.
- What an unqualified `foundry server restart` (without `--port`) does.
- Repeated dynamic-port assignment.
- An actual VS Code model-picker/chat success.
- Reliable engineering performance.

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

Pending client verification: a VS Code model-picker/chat success with the ID above, and an agent-mode task trial. See "Not verified" above.
