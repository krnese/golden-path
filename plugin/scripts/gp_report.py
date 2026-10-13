"""Metrics from the local ledger and A/B results.

Per session (one task attempt): iterations to green (gate evaluations until first green),
failed checks (red gate evaluations) and failed tests, time to green (seconds from session
start to first green), gave_up. Per lesson: benefit = mean iterations without the lesson
minus mean iterations with all lessons (positive = the lesson helps), plus acceptance-rate delta.
"""
import json
import os
import statistics
from collections import defaultdict

import gp_common as c

AB_REL = os.path.join(".golden-path", "ab", "results.jsonl")


def read_jsonl(path):
    if not os.path.exists(path):
        return []
    with open(path, encoding="utf-8") as f:
        return [json.loads(l) for l in f if l.strip()]


def sessions(records):
    by = defaultdict(list)
    for r in records:
        if r.get("event") in ("gate_red", "gate_green", "gave_up", "method_loaded"):
            by[r.get("session")].append(r)
    out = []
    for sid, recs in by.items():
        gates = [r for r in recs if r["event"] != "method_loaded"]
        if not gates:
            continue
        green = next((r for r in gates if r["event"] == "gate_green"), None)
        reds = [r for r in gates if r["event"] in ("gate_red", "gave_up") and (not green or r["attempt"] < green["attempt"])]
        out.append({"session": sid, "task": gates[0].get("task"), "arm": gates[0].get("arm"),
                    "method_loaded": any(r["event"] == "method_loaded" for r in recs),
                    "iterations_to_green": green["attempt"] if green else None,
                    "failed_checks": len(reds),
                    "failed_tests": sum(len(r.get("failed_tests", [])) for r in reds),
                    "time_to_green_sec": green["elapsed_sec"] if green else None,
                    "gave_up": any(r["event"] == "gave_up" for r in gates),
                    "lessons_injected": gates[0].get("lessons_injected", [])})
    return out


def _mean(xs):
    xs = [x for x in xs if x is not None]
    return round(statistics.mean(xs), 3) if xs else None


def summarize(rows, key="arm"):
    groups = defaultdict(list)
    for r in rows:
        groups[r.get(key)].append(r)
    return {str(k): {"n": len(v),
                     "mean_iterations_to_green": _mean([r.get("iterations_to_green") for r in v]),
                     "mean_failed_checks": _mean([r.get("failed_checks") for r in v]),
                     "mean_time_to_green_sec": _mean([r.get("time_to_green_sec") for r in v]),
                     "green_rate": _mean([1 if r.get("iterations_to_green") else 0 for r in v]),
                     "acceptance_rate": _mean([1 if r.get("accepted") else 0 for r in v if "accepted" in r])}
            for k, v in sorted(groups.items(), key=lambda kv: str(kv[0]))}


def lesson_benefit(ab_rows):
    s = summarize(ab_rows)
    on = s.get("on")
    out = {}
    for arm, m in s.items():
        if arm.startswith("minus-") and on:
            lid = arm[len("minus-"):]
            it_on, it_minus = on["mean_iterations_to_green"], m["mean_iterations_to_green"]
            acc_on, acc_minus = on["acceptance_rate"], m["acceptance_rate"]
            out[lid] = {"n_with": on["n"], "n_without": m["n"],
                        "iterations_saved": None if None in (it_on, it_minus) else round(it_minus - it_on, 3),
                        "acceptance_delta": None if None in (acc_on, acc_minus) else round(acc_on - acc_minus, 3)}
    return out


def report(root):
    ledger_rows = sessions(read_jsonl(os.path.join(root, c.LEDGER_REL)))
    ab_rows = read_jsonl(os.path.join(root, AB_REL))
    reviewer = [r for r in read_jsonl(os.path.join(root, c.LEDGER_REL)) if r.get("event") == "reviewer_start"]
    return {"sessions": ledger_rows, "by_arm": summarize(ledger_rows),
            "ab_by_arm": summarize(ab_rows), "lesson_benefit": lesson_benefit(ab_rows),
            "reviewer_invocations": len(reviewer),
            "caveat": "Small-n local measurements; report variance and repeat runs before claiming any effect."}
