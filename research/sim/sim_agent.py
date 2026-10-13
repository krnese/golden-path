#!/usr/bin/env python3
"""RIGGED SIMULATOR, NOT AN AGENT AND NOT EVIDENCE.

Drives the Golden Path plumbing deterministically without Copilot, inside an installed demo repo
(examples/make-demo.sh). It "knows" T01: with a learned lesson present it applies the correct fix
first; otherwise it applies a deliberately buggy fix first. In the `plain` A/B arm (no kit) it has
no gate, so it stops after its first attempt. Any "benefit" it shows is built in.

Usage (cwd = demo repo): python3 <kit>/research/sim/sim_agent.py T01
"""
import json
import os
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.getcwd()
GATE = os.path.join(ROOT, ".github", "hooks", "golden-path", "gate.mjs")


def hook(cmd, payload):
    p = subprocess.run(["node", GATE, cmd], input=json.dumps(payload), capture_output=True, text=True, cwd=ROOT)
    return json.loads(p.stdout or "{}")


def main():
    task = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("GOLDEN_PATH_TASK", "T01")
    if task != "T01":
        print(f"simulator only knows T01, not {task}")
        return 3
    base = {"sessionId": os.environ.get("GOLDEN_PATH_SESSION", "sim-session"), "cwd": ROOT}
    gated = os.path.exists(GATE)
    if gated:
        hook("start", dict(base, source="new"))
    shutil.copy(os.path.join(HERE, "T01", "test_t01_discount.py"), os.path.join(ROOT, "tests", "test_t01_discount.py"))
    learned = os.path.join(ROOT, "tests", "learned")
    has_lesson = os.environ.get("GOLDEN_PATH_LESSONS", "on") != "off" and any(
        n.startswith("test_L") for n in (os.listdir(learned) if os.path.isdir(learned) else []))
    shutil.copy(os.path.join(HERE, "T01", "good_invoice.py" if has_lesson else "buggy_invoice.py"),
                os.path.join(ROOT, "invoice.py"))
    if not gated:
        return 0
    had_red = False
    for _ in range(8):
        if hook("stop", dict(base, stopReason="end_turn", stop_hook_active=had_red)).get("decision") != "block":
            break
        had_red = True
        shutil.copy(os.path.join(HERE, "T01", "good_invoice.py"), os.path.join(ROOT, "invoice.py"))
    if had_red:  # propose the regression test that would have caught the first mistake
        d = os.path.join(ROOT, ".golden-path", "proposals", "round-after-discount")
        os.makedirs(d, exist_ok=True)
        shutil.copy(os.path.join(HERE, "T01", "lesson_proposal.py"), os.path.join(d, "test_round_after_discount.py"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
