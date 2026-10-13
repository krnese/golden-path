# macOS: Foundry Local

**Status: not yet verified.** This kit hasn't run anything here on a Mac. The install commands are from the primary docs, [Foundry Local CLI](https://learn.microsoft.com/en-us/azure/foundry-local/how-to/how-to-use-foundry-local-cli) (fetched 13 Oct 2026).

## Check first
- **Apple Silicon** (`uname -m` → `arm64`). The docs list macOS install for Apple Silicon only. On Intel Macs, treat Foundry Local as unsupported unless the docs say otherwise.
- **Unified memory** (`sysctl hw.memsize`) and free disk, compared with the model size you plan to use.
- **Model variants**: `foundry model list --variants` shows which variants exist for your hardware. Check that a chat model with the context size you need exists before downloading anything.

## Install (approval: download)
```bash
brew tap microsoft/foundrylocal
brew install foundrylocal
foundry --version
foundry server status     # local URL; dynamic port
```
Upgrading from 0.8.x: `foundry service stop`, then `brew update && brew upgrade microsoft/foundrylocal/foundrylocal` (per the docs).

Client setup: same VS Code Custom Endpoint steps as [windows.md](windows.md).

Then run every check in SKILL.md section 3 before use.
