#!/usr/bin/env bash
# Create a runnable demo adopter repo from examples/invoice-demo and install the kit into it.
# Usage: examples/make-demo.sh <target-dir> [extra installer flags, e.g. --with-reviewer]
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
kit="$here/../plugin"
target="${1:?usage: make-demo.sh <target-dir> [installer flags]}"; shift || true
if [ -e "$target" ] && [ -n "$(ls -A "$target" 2>/dev/null)" ]; then
  echo "refusing: $target exists and is not empty" >&2; exit 2
fi
mkdir -p "$target"
cp -R "$here/invoice-demo/." "$target/"
cd "$target"
git init -q
git add -A
git -c user.name=demo -c user.email=demo@local commit -qm "Invoice demo baseline (acceptance examples by Finance)"
python3 "$kit/install.py" --target . \
  --check "python3 -m unittest discover -s tests" \
  --acceptance-path "acceptance/**" \
  --acceptance-owner "Finance: Ingrid Berg" \
  --acceptance-command "python3 -m unittest acceptance.test_acceptance.T01" \
  --test-file-command "python3 -m unittest {file}" "$@"
git add -A
git -c user.name=demo -c user.email=demo@local commit -qm "Install Golden Path kit"
sha256sum -c --quiet FREEZE.sha256 && echo "frozen tasks and acceptance examples verified"
echo "Demo ready at $target"
