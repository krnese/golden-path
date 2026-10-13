#!/usr/bin/env python3
"""Golden Path RESEARCH tools. Opt-in, not part of the plugin and never installed into adopter repos.

Requires "research": {"enabled": true} in .golden-path/config.json. Run from the adopter repo root:

  python3 research/golden_path_research.py ab --tasks T01 --reps 3 --agent-cmd "copilot -p @{prompt_file}"
  python3 research/golden_path_research.py learn validate|accept <proposal>
  python3 research/golden_path_research.py summary [--json]   ledger outcomes + A/B results

A/B (primary comparison): arm `golden-path` (kit installed) vs arm `plain` (kit removed from the
throwaway worktree: hooks, skill, agents, instruction blocks). Same agent command, model, tasks and
acceptance command. Secondary: `--lesson-arms` adds `lessons-off`, and `--per-lesson` adds one
`minus-<lesson>` arm per learned test.
This is a plain CLI script, NOT a Copilot dynamic workflow: the extension/workflow authoring API is
not publicly documented (https://docs.github.com/en/copilot/how-tos/use-copilot-agents/use-dynamic-workflows).

Learning: a proposal under .golden-path/proposals/<name>/test_*.ext is EARNED only if it fails on the
base commit and passes on the current tree. Accepting copies it to learned_tests_dir; nothing is committed.
"""
import argparse
import json
import os
import re
import shlex
import shutil
import statistics
import subprocess
import sys
import tempfile
import time
import uuid

HERE = os.path.dirname(os.path.abspath(__file__))
for p in (os.path.join(HERE, "..", "plugin", "scripts"), os.path.join(os.getcwd(), ".github", "hooks", "golden-path")):
    sys.path.insert(0, os.path.abspath(p))
import gate as g  # noqa: E402  (the kit's own gate script provides config, ledger and checks)

AB_REL = os.path.join(".golden-path", "ab", "results.jsonl")
PROPOSALS_REL = os.path.join(".golden-path", "proposals")
PRIMARY = ("golden-path", "plain")
KIT_PATHS = (".github/hooks/golden-path-loop.json", ".github/hooks/golden-path", ".github/skills/golden-path",
             ".github/agents/golden-path.agent.md", ".github/agents/golden-path-reviewer.agent.md")


def config(root):
    cfg = g.load_config(root)
    if not (cfg.get("research") or {}).get("enabled"):
        raise SystemExit('Research tools are opt-in. Set "research": {"enabled": true} in .golden-path/config.json.')
    cfg.setdefault("learned_tests_dir", "tests/learned")
    return cfg


def lessons(root, cfg):
    d = os.path.join(root, cfg["learned_tests_dir"])
    names = sorted(n for n in os.listdir(d) if n.startswith("test_L")) if os.path.isdir(d) else []
    return [{"id": n[len("test_"):].split("_")[0].split(".")[0], "file": n} for n in names]


# ---------- ledger report ----------

def report(root):
    path = os.path.join(root, g.LEDGER_REL)
    recs = [json.loads(l) for l in open(path, encoding="utf-8") if l.strip()] if os.path.exists(path) else []
    by = {}
    for r in recs:
        if r.get("event") in ("method_files_present", "gate_red", "gate_green", "gave_up"):
            by.setdefault(r.get("session"), []).append(r)
    sessions = []
    for sid, rs in by.items():
        gates = [r for r in rs if r["event"] != "method_files_present"]
        green = next((r for r in gates if r["event"] == "gate_green"), None)
        last = gates[-1]["event"] if gates else None
        # The LAST gate event decides. No gate record at all (e.g. hook timeout, fails open) is UNVERIFIED.
        outcome = {"gate_green": "PASSED", "gave_up": "FAILED", "gate_red": "RED", None: "UNVERIFIED"}[last]
        sessions.append({"session": sid, "task": (gates or rs)[0].get("task"), "arm": rs[0].get("arm"),
                         "outcome": outcome, "escalated_to": gates[-1].get("escalated_to") if outcome == "FAILED" else None,
                         "method_files_present": any(r["event"] == "method_files_present" for r in rs),
                         "iterations_to_green": green["attempt"] if green else None,
                         "time_to_green_sec": green["elapsed_sec"] if green else None,
                         "failed_checks": sum(1 for r in gates if r["event"] != "gate_green" and (not green or r["attempt"] < green["attempt"]))})
    counts = {k: sum(1 for s in sessions if s["outcome"] == k) for k in ("PASSED", "FAILED", "RED", "UNVERIFIED")}
    return {"outcomes": counts, "sessions": sessions,
            "failed_sessions": [s for s in sessions if s["outcome"] == "FAILED"],
            "acceptance_change_attempts": sum(1 for r in recs if r.get("event") == "acceptance_change_attempt"),
            "guard_denials": sum(1 for r in recs if r.get("event") == "guard_deny"),
            "reviewer_invocations": sum(1 for r in recs if r.get("event") == "reviewer_start"),
            "note": "method_files_present shows the files existed, not that the agent read or followed them. "
                    "PASSED means the configured checks and the expert's examples passed; it does not prove "
                    "business correctness, deployment readiness or authorization."}


# ---------- learning ----------

def _safe(name):
    return "".join(ch if ch.isalnum() else "_" for ch in name).strip("_").lower() or "lesson"


def _candidate(root, name):
    d = os.path.join(root, PROPOSALS_REL, name)
    files = [f for f in sorted(os.listdir(d)) if f.startswith("test_")] if os.path.isdir(d) else []
    if len(files) != 1:
        raise SystemExit(f"proposal {name}: expected exactly one test_* file in {d}, found {files}")
    return os.path.join(d, files[0])


def _run_file(tree, cfg, rel):
    p = subprocess.run(cfg["test_file_command"].replace("{file}", rel), shell=True, cwd=tree,
                       capture_output=True, text=True, timeout=cfg.get("check_timeout_sec", 100))
    return p.returncode == 0, (p.stdout + p.stderr)[-800:]


def validate(root, name, base="HEAD"):
    cfg = config(root)
    if not cfg.get("test_file_command"):
        raise SystemExit("config.test_file_command is required (e.g. 'python3 -m unittest {file}')")
    cand = _candidate(root, name)
    rel = os.path.join(cfg["learned_tests_dir"], "test_PROPOSED_" + _safe(name) + os.path.splitext(cand)[1])
    with tempfile.TemporaryDirectory() as tmp:
        bt, ct = os.path.join(tmp, "base"), os.path.join(tmp, "cur")
        subprocess.run(["git", "worktree", "add", "--detach", "-q", bt, base], cwd=root, check=True, capture_output=True)
        try:
            os.makedirs(os.path.dirname(os.path.join(bt, rel)), exist_ok=True)
            shutil.copy(cand, os.path.join(bt, rel))
            base_ok, base_out = _run_file(bt, cfg, rel)
        finally:
            subprocess.run(["git", "worktree", "remove", "--force", bt], cwd=root, capture_output=True)
        shutil.copytree(root, ct, ignore=shutil.ignore_patterns(".git", ".golden-path", "node_modules", "__pycache__"))
        os.makedirs(os.path.dirname(os.path.join(ct, rel)), exist_ok=True)
        shutil.copy(cand, os.path.join(ct, rel))
        cur_ok, cur_out = _run_file(ct, cfg, rel)
    v = {"proposal": name, "base": g.git(root, "rev-parse", base)[1].strip(), "fails_on_base": not base_ok,
         "passes_now": cur_ok, "earned": (not base_ok) and cur_ok}
    g.ledger(root, "lesson_validated", **v)
    return dict(v, base_output=base_out, current_output=cur_out)


def accept(root, name, base="HEAD"):
    cfg = config(root)
    v = validate(root, name, base)
    if not v["earned"]:
        raise SystemExit(f"refusing to accept {name}: not earned (fails_on_base={v['fails_on_base']}, passes_now={v['passes_now']})")
    cand = _candidate(root, name)
    ids = [int(l["id"][1:]) for l in lessons(root, cfg) if l["id"][1:].isdigit()]
    lid = "L%03d" % (max(ids, default=0) + 1)
    dst = os.path.join(root, cfg["learned_tests_dir"], f"test_{lid}_{_safe(name)}{os.path.splitext(cand)[1]}")
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    comment = "#" if dst.endswith((".py", ".sh", ".rb")) else "//"
    with open(cand, encoding="utf-8") as f, open(dst, "w", encoding="utf-8") as o:
        o.write(f"{comment} golden-path lesson {lid}; earned against base {v['base'][:12]} (fails on base, passes on fix)\n" + f.read())
    g.ledger(root, "lesson_accepted", lesson=lid, proposal=name, path=os.path.relpath(dst, root))
    return {"lesson": lid, "path": os.path.relpath(dst, root)}


# ---------- A/B ----------

def _prepare(tree, cfg, arm):
    d = os.path.join(tree, cfg["learned_tests_dir"])
    for l in lessons(tree, cfg):
        if arm in ("plain", "lessons-off") or arm == "minus-" + l["id"]:
            os.remove(os.path.join(d, l["file"]))
    if arm != "plain":
        return
    for rel in KIT_PATHS:
        p = os.path.join(tree, rel)
        shutil.rmtree(p) if os.path.isdir(p) else (os.remove(p) if os.path.exists(p) else None)
    for name in (".github/copilot-instructions.md", "AGENTS.md"):
        p = os.path.join(tree, name)
        if os.path.exists(p):
            with open(p, encoding="utf-8") as f:
                s = re.sub(r"<!-- golden-path:begin -->.*?<!-- golden-path:end -->\n?", "", f.read(), flags=re.S)
            with open(p, "w", encoding="utf-8") as f:
                f.write(s)


def ab(root, tasks, reps, arms=PRIMARY, agent_cmd=None, timeout=1800):
    cfg = config(root)
    spec = cfg.get("ab") or {}
    agent_cmd = agent_cmd or spec.get("agent_command")
    if not agent_cmd:
        raise SystemExit("pass --agent-cmd or set ab.agent_command (placeholders: {prompt_file} {task})")
    os.makedirs(os.path.dirname(os.path.join(root, AB_REL)), exist_ok=True)
    rows = []
    for rep in range(reps):
        for task in tasks:
            for arm in arms:
                rows.append(_one(root, cfg, spec, task, arm, rep, agent_cmd, timeout))
    return rows


def _one(root, cfg, spec, task, arm, rep, agent_cmd, timeout):
    sid = f"ab-{task}-{arm}-{rep}-{uuid.uuid4().hex[:6]}"
    with tempfile.TemporaryDirectory() as tmp:
        tree = os.path.join(tmp, "wt")
        subprocess.run(["git", "worktree", "add", "--detach", "-q", tree, "HEAD"], cwd=root, check=True, capture_output=True)
        try:
            _prepare(tree, cfg, arm)
            subprocess.run(["git", "add", "-A"], cwd=tree, capture_output=True)
            subprocess.run(["git", "-c", "user.name=ab", "-c", "user.email=ab@local", "commit", "-q", "--allow-empty",
                            "-m", f"ab arm {arm}"], cwd=tree, capture_output=True)
            prompt = os.path.join(tree, spec.get("tasks_dir") or "", task + ".md")
            env = dict(os.environ, GOLDEN_PATH_ARM=arm, GOLDEN_PATH_TASK=task, GOLDEN_PATH_SESSION=sid,
                       GOLDEN_PATH_LESSONS="off" if arm in ("plain", "lessons-off") else "on")
            cmd = agent_cmd.replace("{prompt_file}", shlex.quote(prompt)).replace("{task}", shlex.quote(task))
            t0 = time.time()
            try:
                agent_exit = subprocess.run(cmd, shell=True, cwd=tree, env=env, capture_output=True, timeout=timeout).returncode
            except subprocess.TimeoutExpired:
                agent_exit = None
            wall = round(time.time() - t0, 3)
            acc_paths = cfg["acceptance"].get("paths") or []
            changed = bool(g.acceptance_changes(tree, acc_paths, "HEAD"))
            acc_cmd = (spec.get("acceptance_command") or cfg["acceptance"].get("command") or "").replace("{task}", task)
            if changed:  # score against the expert's tests, not the agent's edited copy
                subprocess.run(["git", "checkout", "-q", "HEAD", "--", *[p.split("*")[0].rstrip("/") for p in acc_paths]],
                               cwd=tree, capture_output=True)
            accepted = subprocess.run(acc_cmd, shell=True, cwd=tree, capture_output=True).returncode == 0 if acc_cmd else None
            s = next((x for x in report(tree)["sessions"] if x["session"] == sid), None)
            row = {"task": task, "arm": arm, "rep": rep, "session": sid, "agent_exit": agent_exit, "wall_sec": wall,
                   "accepted": accepted, "acceptance_tests_changed": changed,
                   "outcome": s["outcome"] if s else ("NO-GATE" if arm == "plain" else "UNVERIFIED"),
                   "iterations_to_green": s and s["iterations_to_green"], "failed_checks": s and s["failed_checks"],
                   "method_files_present": bool(s and s["method_files_present"])}
        finally:
            subprocess.run(["git", "worktree", "remove", "--force", tree], cwd=root, capture_output=True)
    with open(os.path.join(root, AB_REL), "a", encoding="utf-8") as f:
        f.write(json.dumps(row) + "\n")
    return row


def _mean(xs):
    xs = [x for x in xs if x is not None]
    return round(statistics.mean(xs), 3) if xs else None


def summary(root):
    path = os.path.join(root, AB_REL)
    rows = [json.loads(l) for l in open(path, encoding="utf-8") if l.strip()] if os.path.exists(path) else []
    arms = {}
    for r in rows:
        arms.setdefault(r["arm"], []).append(r)
    by_arm = {a: {"n": len(v), "acceptance_rate": _mean([1 if r["accepted"] else 0 for r in v if r["accepted"] is not None]),
                  "acceptance_tests_changed": sum(1 for r in v if r["acceptance_tests_changed"]),
                  "failed_escalated": sum(1 for r in v if r["outcome"] == "FAILED"),
                  "mean_wall_sec": _mean([r["wall_sec"] for r in v]),
                  "mean_iterations_to_green": _mean([r["iterations_to_green"] for r in v])} for a, v in sorted(arms.items())}
    gp, plain = by_arm.get("golden-path"), by_arm.get("plain")
    primary = None if not (gp and plain) else {
        "acceptance_rate_delta": None if None in (gp["acceptance_rate"], plain["acceptance_rate"]) else round(gp["acceptance_rate"] - plain["acceptance_rate"], 3),
        "wall_sec_delta": None if None in (gp["mean_wall_sec"], plain["mean_wall_sec"]) else round(gp["mean_wall_sec"] - plain["mean_wall_sec"], 3)}
    secondary = {a[len("minus-"):] if a.startswith("minus-") else a: {
        "iterations_saved": None if None in (gp and gp["mean_iterations_to_green"], m["mean_iterations_to_green"])
        else round(m["mean_iterations_to_green"] - gp["mean_iterations_to_green"], 3)}
        for a, m in by_arm.items() if gp and (a.startswith("minus-") or a == "lessons-off")}
    return {"primary_golden_path_vs_plain": primary, "secondary_lessons": secondary, "by_arm": by_arm,
            "caveat": "Small-n local runs. Report variance and repeat before claiming any effect."}


def main(argv=None):
    ap = argparse.ArgumentParser(prog="golden_path_research")
    sub = ap.add_subparsers(dest="cmd", required=True)
    lp = sub.add_parser("learn")
    lp.add_argument("action", choices=["validate", "accept"])
    lp.add_argument("proposal")
    lp.add_argument("--base", default="HEAD")
    abp = sub.add_parser("ab")
    abp.add_argument("--tasks", required=True)
    abp.add_argument("--reps", type=int, default=1)
    abp.add_argument("--arms", default=",".join(PRIMARY), help="primary: golden-path,plain (same model and tasks)")
    abp.add_argument("--lesson-arms", action="store_true", help="secondary: add lessons-off")
    abp.add_argument("--per-lesson", action="store_true", help="secondary: add minus-<lesson> arms")
    abp.add_argument("--agent-cmd")
    sp = sub.add_parser("summary")
    sp.add_argument("--json", action="store_true")
    a = ap.parse_args(argv)
    root = g.repo_root()
    if a.cmd == "learn":
        out = (validate if a.action == "validate" else accept)(root, a.proposal, a.base)
        print(json.dumps(out, indent=1))
        return 0 if (a.action == "accept" or out.get("earned")) else 1
    if a.cmd == "ab":
        arms = a.arms.split(",") + (["lessons-off"] if a.lesson_arms else [])
        if a.per_lesson:
            arms += ["minus-" + l["id"] for l in lessons(root, config(root))]
        print(json.dumps(ab(root, a.tasks.split(","), a.reps, arms, a.agent_cmd), indent=1))
        return 0
    config(root)  # research tools are opt-in
    out = {"ledger": report(root), "ab": summary(root)}
    if a.json:
        print(json.dumps(out, indent=1))
        return 0
    o = out["ledger"]["outcomes"]
    print(f"Golden Path sessions: PASSED {o['PASSED']}, FAILED (escalated) {o['FAILED']}, still RED {o['RED']}, "
          f"UNVERIFIED (no gate record) {o['UNVERIFIED']}")
    for s in out["ledger"]["failed_sessions"]:
        print(f"  FAILED: session {s['session']} task {s['task']} -> escalated to {s['escalated_to']}")
    print("A/B primary (golden-path vs plain):", json.dumps(out["ab"]["primary_golden_path_vs_plain"]))
    print(out["ledger"]["note"])
    print(out["ab"]["caveat"])
    return 0


if __name__ == "__main__":
    sys.exit(main())
