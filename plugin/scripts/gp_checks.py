"""Run the adopter's configured check command plus the test-integrity check."""
import os
import re
import subprocess
import time

import gp_integrity


def tail(text, n=60):
    lines = text.strip().splitlines()
    return "\n".join(lines[-n:])


FAILED_TEST_RE = re.compile(r"^(?:FAIL|ERROR): (\S+)|^FAILED (?!\()(\S+)|^\s*✕ (.+)$|^--- FAIL: (\S+)", re.M)


def failed_tests(output):
    return sorted({next(g for g in m.groups() if g) for m in FAILED_TEST_RE.finditer(output)})


def run(root, cfg, base="HEAD"):
    results = []
    cmd = cfg.get("check")
    t0 = time.time()
    if not cmd:
        results.append({"name": "config", "ok": False,
                        "output": "No check command configured in .golden-path/config.json ('check')."})
    else:
        try:
            p = subprocess.run(cmd, shell=True, cwd=root, capture_output=True, text=True,
                               timeout=cfg.get("check_timeout_sec", 100))
            out = p.stdout + "\n" + p.stderr
            results.append({"name": "check", "ok": p.returncode == 0, "exit": p.returncode,
                            "failed_tests": failed_tests(out), "output": tail(out)})
        except subprocess.TimeoutExpired:
            # Count a timeout as RED. (Hook timeouts themselves fail open; see hooks reference.)
            results.append({"name": "check", "ok": False, "exit": None,
                            "output": f"check command timed out after {cfg.get('check_timeout_sec')}s"})
    v = gp_integrity.check(root, cfg.get("protected", []), base)
    results.append({"name": "test-integrity", "ok": not v, "output": "\n".join(v)})
    return {"ok": all(r["ok"] for r in results), "results": results,
            "failed": [r["name"] for r in results if not r["ok"]],
            "failed_tests": sorted({t for r in results for t in r.get("failed_tests", [])}),
            "duration_sec": round(time.time() - t0, 3)}
