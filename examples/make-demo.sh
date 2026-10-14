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
# Enabled increments: the acceptance command lists one unittest class per enabled increment (T01 by Finance,
# T05 by Marketing). Add a class here to switch an increment on; the L2 stop gate holds the agent to all of them.
# Per-increment acceptance ownership. The kit config takes ONE acceptance.owner string (used in agent-facing
# messages); per-path owners are expressed in CODEOWNERS, which the authorised-revision check reads (last
# matching line wins; individual @user owners only). The handles below are fictional demo placeholders.
mkdir -p .github
cat > .github/CODEOWNERS <<'CO'
# Finance (Ingrid Berg) owns T01..T04 acceptance
/acceptance/ @demo-finance-ingrid-berg
# Marketing owns T05 acceptance on its own path
/acceptance/marketing/ @demo-marketing
CO
git init -q
git add -A
git -c user.name=demo -c user.email=demo@local commit -qm "Invoice demo baseline (acceptance examples by Finance T01..T04 and Marketing T05)"
node "$kit/install.mjs" --target . \
  --check "python3 -m unittest discover -s tests" \
  --acceptance-path "acceptance/**" \
  --acceptance-owner "Finance: Ingrid Berg (T01..T04, acceptance/); Marketing (T05, acceptance/marketing/)" \
  --acceptance-command "python3 -m unittest acceptance.test_acceptance.T01 acceptance.marketing.test_acceptance.T05" \
  "$@"
git add -A
git -c user.name=demo -c user.email=demo@local commit -qm "Install Golden Path kit"
sha256sum -c --quiet FREEZE.sha256 && echo "frozen tasks and acceptance examples verified"
echo "Demo ready at $target"
