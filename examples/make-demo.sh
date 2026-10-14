#!/usr/bin/env bash
# Thin wrapper kept for existing instructions; the demo builder is examples/make-demo.mjs (Node.js 22+, any OS).
# Usage: examples/make-demo.sh <target-dir> [extra installer flags, e.g. --with-reviewer]
set -euo pipefail
exec node "$(cd "$(dirname "$0")" && pwd)/make-demo.mjs" "$@"
