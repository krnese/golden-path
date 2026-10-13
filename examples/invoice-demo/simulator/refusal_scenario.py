#!/usr/bin/env python3
"""SCRIPTED SCENARIO (not an agent): "the agent tries to edit a protected acceptance test and is refused".

It sends the same hook payloads Copilot would send (documented in the Copilot hooks reference)
to the installed hook scripts and prints what happens:
  1. edit tool on acceptance/test_T01.py      -> preToolUse guard DENIES
  2. shell `sed -i` on the acceptance test    -> preToolUse guard DENIES
  3. the file is changed anyway (bypassing hooks), then the agent tries to stop
                                              -> agentStop gate BLOCKS: delegation change -> owner
  4. agent restores the test (git restore)    -> guard ALLOWS; gate no longer reports acceptance-integrity
     (it is still RED, honestly, because T01 is not implemented yet)
Exit code 0 only if every step behaves as expected. Proves hook logic, not Copilot behaviour.
"""
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
GATE = os.path.join(ROOT, ".github", "hooks", "golden-path", "gate.py")
TEST = "acceptance/test_acceptance.py"


def hook(cmd, payload):
    p = subprocess.run([sys.executable, GATE, cmd], input=json.dumps(payload),
                       capture_output=True, text=True, cwd=ROOT)
    return json.loads(p.stdout or "{}")


def main():
    sid = os.environ.get("GOLDEN_PATH_SESSION", "refusal-demo")
    base = {"sessionId": sid, "cwd": ROOT, "timestamp": 0}
    ok = True
    hook("start", dict(base, source="new"))

    d1 = hook("guard", dict(base, toolName="edit", toolArgs={"path": TEST}))
    print(f"1. agent: edit {TEST}\n   guard: {d1.get('permissionDecision')}: {d1.get('permissionDecisionReason', '')[:110]}...")
    ok &= d1.get("permissionDecision") == "deny"

    cmd = f"sed -i 's/Decimal(\"0.08\")/Decimal(\"0.07\")/' {TEST}"
    d2 = hook("guard", dict(base, toolName="bash", toolArgs={"command": cmd}))
    print(f"2. agent: {cmd}\n   guard: {d2.get('permissionDecision')}")
    ok &= d2.get("permissionDecision") == "deny"

    path = os.path.join(ROOT, TEST)
    original = open(path).read()
    with open(path, "w") as f:
        f.write(original.replace('Decimal("0.08")', 'Decimal("0.07")'))
    g1 = hook("stop", dict(base, stopReason="end_turn", stop_hook_active=False))
    reason = g1.get("reason", "")
    print("3. (file changed outside the hooks) agent: I'm done\n   gate: "
          f"{g1.get('decision')}; mentions DELEGATION CHANGE: {'DELEGATION CHANGE' in reason}")
    ok &= g1.get("decision") == "block" and "DELEGATION CHANGE" in reason and "acceptance-integrity" in reason

    d3 = hook("guard", dict(base, toolName="bash", toolArgs={"command": f"git restore {TEST}"}))
    ok &= d3 == {}
    subprocess.run(["git", "restore", TEST], cwd=ROOT, check=True)
    ok &= open(path).read() == original
    g2 = hook("stop", dict(base, stopReason="end_turn", stop_hook_active=True))
    still = "acceptance-integrity" in g2.get("reason", "")
    print(f"4. agent: git restore {TEST}\n   guard: {d3.get('permissionDecision', 'allow')}; gate: "
          f"{g2.get('decision', 'allow')} (acceptance-integrity still failing: {still}; T01 itself is not implemented yet)")
    ok &= not still
    print("RESULT:", "as expected" if ok else "UNEXPECTED")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
