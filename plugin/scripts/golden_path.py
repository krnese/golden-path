#!/usr/bin/env python3
"""golden-path CLI: check | learn validate|accept | report | ab.

  python3 <kit>/scripts/golden_path.py check
  python3 <kit>/scripts/golden_path.py learn validate <proposal> [--base SHA]
  python3 <kit>/scripts/golden_path.py learn accept <proposal> [--base SHA]
  python3 <kit>/scripts/golden_path.py report [--json]
  python3 <kit>/scripts/golden_path.py ab --tasks T01,T02 --reps 3 [--per-lesson] [--agent-cmd CMD]
"""
import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gp_ab  # noqa: E402
import gp_checks  # noqa: E402
import gp_common as c  # noqa: E402
import gp_learn  # noqa: E402
import gp_report  # noqa: E402


def main(argv=None):
    ap = argparse.ArgumentParser(prog="golden-path")
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("check")
    lp = sub.add_parser("learn")
    lp.add_argument("action", choices=["validate", "accept"])
    lp.add_argument("proposal")
    lp.add_argument("--base", default="HEAD")
    rp = sub.add_parser("report")
    rp.add_argument("--json", action="store_true")
    abp = sub.add_parser("ab")
    abp.add_argument("--tasks", required=True)
    abp.add_argument("--reps", type=int, default=1)
    abp.add_argument("--arms", default="on,off")
    abp.add_argument("--per-lesson", action="store_true")
    abp.add_argument("--agent-cmd")
    a = ap.parse_args(argv)
    root = c.repo_root()
    if a.cmd == "check":
        res = gp_checks.run(root, c.load_config(root))
        print(json.dumps({k: v for k, v in res.items()}, indent=1))
        return 0 if res["ok"] else 1
    if a.cmd == "learn":
        out = (gp_learn.validate if a.action == "validate" else gp_learn.accept)(root, a.proposal, a.base)
        print(json.dumps(out, indent=1))
        return 0 if (a.action == "accept" or out.get("earned")) else 1
    if a.cmd == "report":
        r = gp_report.report(root)
        if a.json:
            print(json.dumps(r, indent=1))
        else:
            print("Golden Path metrics (local ledger)")
            for arm, m in r["by_arm"].items():
                print(f"  arm={arm}: {m}")
            print("A/B runs:")
            for arm, m in r["ab_by_arm"].items():
                print(f"  arm={arm}: {m}")
            print("Per-lesson benefit (iterations saved, acceptance delta):")
            for lid, m in r["lesson_benefit"].items():
                print(f"  {lid}: {m}")
            print(f"Reviewer invocations: {r['reviewer_invocations']}")
            print(r["caveat"])
        return 0
    if a.cmd == "ab":
        rows = gp_ab.run(root, a.tasks.split(","), a.reps, a.arms.split(","), a.per_lesson, a.agent_cmd)
        print(json.dumps(rows, indent=1))
        return 0


if __name__ == "__main__":
    sys.exit(main())
