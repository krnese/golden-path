#!/usr/bin/env bash
# Create a runnable demo adopter repo from examples/invoice-demo and install the kit into it.
# Usage: examples/make-demo.sh <target-dir> [--with-reviewer]
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
kit="$here/../plugin"
target="${1:?usage: make-demo.sh <target-dir> [--with-reviewer]}"; shift || true
if [ -e "$target" ] && [ -n "$(ls -A "$target" 2>/dev/null)" ]; then
  echo "refusing: $target exists and is not empty" >&2; exit 2
fi
mkdir -p "$target"
cp -R "$here/invoice-demo/." "$target/"
cd "$target"
git init -q
git add -A
git -c user.name=demo -c user.email=demo@local commit -qm "Invoice demo baseline"
python3 "$kit/install.py" --target . \
  --check "python3 -m unittest discover -s tests -t ." \
  --test-file-command "python3 -m unittest {file}" "$@"
python3 - <<'PY'
import json
p = ".golden-path/config.json"
cfg = json.load(open(p))
cfg["ab"] = {"tasks_dir": "tasks", "holdout_dir": "tasks/acceptance",
             "acceptance_command": "python3 -m unittest tasks/acceptance/test_{task}.py",
             "agent_command": None}
json.dump(cfg, open(p, "w"), indent=2)
PY
git add -A
git -c user.name=demo -c user.email=demo@local commit -qm "Install Golden Path kit"
(cd tasks && sha256sum -c --quiet FREEZE.sha256) && echo "frozen tasks verified"
echo "Demo ready at $target"
