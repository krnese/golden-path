#!/usr/bin/env python3
"""RIGGED SIMULATOR, NOT AN AGENT AND NOT EVIDENCE.

Exercises the Golden Path plumbing (sessionStart -> agentStop gate -> ledger -> learning
proposal -> A/B runner) deterministically, without Copilot. It "knows" the answer to T01:
with lessons ON and a learned test present it applies the correct fix first time; otherwise
it first applies a deliberately buggy fix, so the gate goes red once. Any "benefit" it shows
is built in. Use it only to test that measurement works, never to claim an effect.

Usage (inside an installed demo repo): python3 simulator/sim_agent.py T01
"""
import json
import os
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
HOOKS = os.path.join(ROOT, ".github", "hooks", "golden-path")


def hook(script, payload):
    p = subprocess.run([sys.executable, os.path.join(HOOKS, script)], input=json.dumps(payload),
                       capture_output=True, text=True, cwd=ROOT)
    return json.loads(p.stdout or "{}")


def main():
    task = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("GOLDEN_PATH_TASK", "T01")
    if task != "T01":
        print(f"simulator only knows T01, not {task}")
        return 3
    sid = os.environ.get("GOLDEN_PATH_SESSION", "sim-session")
    base = {"sessionId": sid, "cwd": ROOT, "timestamp": 0}
    hook("session_start.py", dict(base, source="new"))
    shutil.copy(os.path.join(HERE, "T01", "test_t01_discount.py"), os.path.join(ROOT, "tests", "test_t01_discount.py"))
    learned = os.path.join(ROOT, "tests", "learned")
    has_lesson = os.environ.get("GOLDEN_PATH_LESSONS", "on") != "off" and any(
        n.startswith("test_L") for n in (os.listdir(learned) if os.path.isdir(learned) else []))
    first = "good_invoice.py" if has_lesson else "buggy_invoice.py"
    shutil.copy(os.path.join(HERE, "T01", first), os.path.join(ROOT, "invoice", "invoice.py"))
    for _ in range(8):
        out = hook("gate.py", dict(base, stopReason="end_turn", stop_hook_active=False, transcriptPath=""))
        if out.get("decision") != "block":
            break
        if "Learning step" in out.get("reason", ""):
            d = os.path.join(ROOT, ".golden-path", "proposals", "round-after-discount")
            os.makedirs(d, exist_ok=True)
            shutil.copy(os.path.join(HERE, "T01", "lesson_proposal.py"), os.path.join(d, "test_round_after_discount.py"))
        else:
            shutil.copy(os.path.join(HERE, "T01", "good_invoice.py"), os.path.join(ROOT, "invoice", "invoice.py"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
