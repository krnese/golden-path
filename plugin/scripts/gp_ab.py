"""Baseline A/B runner: lessons ON vs OFF (and leave-one-lesson-out).

LABEL: this is a plain CLI script, NOT a Copilot dynamic workflow. Dynamic workflows are
documented as Copilot extensions (`extension.mjs` under `.github/extensions/`), but the
extension/workflow authoring API itself is not publicly documented (the docs say to ask
Copilot for its built-in guidance): https://docs.github.com/en/copilot/how-tos/use-copilot-agents/use-dynamic-workflows
So we do not invent that format. This script can drive any agent CLI via --agent-cmd.

Each run: fresh `git worktree` at HEAD; arm applied by removing learned tests (committed
inside the throwaway worktree so the integrity base matches); held-out acceptance tests are
removed before the agent runs and restored only for scoring; the agent runs with env
GOLDEN_PATH_{ARM,LESSONS,TASK,SESSION}; then the acceptance command scores the result.
"""
import json
import os
import shlex
import shutil
import subprocess
import tempfile
import time
import uuid

import gp_common as c
import gp_report

ARM_ENV = {"on": "on", "off": "off"}


def _arms(root, cfg, arms, per_lesson):
    arms = list(arms)
    if per_lesson:
        arms += ["minus-" + l["id"] for l in c.list_lessons(root, cfg)]
    return arms


def _apply_arm(tree, cfg, arm):
    learned = os.path.join(tree, cfg["learned_tests_dir"])
    if not os.path.isdir(learned):
        return
    for name in os.listdir(learned):
        if not name.startswith("test_L"):
            continue
        lid = c.lesson_id(name)
        if arm == "off" or arm == "minus-" + lid:
            os.remove(os.path.join(learned, name))


def run(root, tasks, reps, arms=("on", "off"), per_lesson=False, agent_cmd=None, timeout=1800):
    cfg = c.load_config(root)
    ab = cfg.get("ab", {})
    agent_cmd = agent_cmd or ab.get("agent_command")
    if not agent_cmd:
        raise SystemExit("set ab.agent_command in config or pass --agent-cmd (placeholders: {prompt_file} {task})")
    holdout = ab.get("holdout_dir")
    tasks_dir = ab.get("tasks_dir")
    results_path = os.path.join(root, gp_report.AB_REL)
    os.makedirs(os.path.dirname(results_path), exist_ok=True)
    rows = []
    for rep in range(reps):
        for task in tasks:
            for arm in _arms(root, cfg, arms, per_lesson):
                rows.append(_one(root, cfg, ab, task, arm, rep, agent_cmd, holdout, tasks_dir, timeout, results_path))
    return rows


def _one(root, cfg, ab, task, arm, rep, agent_cmd, holdout, tasks_dir, timeout, results_path):
    sid = f"ab-{task}-{arm}-{rep}-{uuid.uuid4().hex[:6]}"
    with tempfile.TemporaryDirectory() as tmp:
        tree = os.path.join(tmp, "wt")
        subprocess.run(["git", "worktree", "add", "--detach", "-q", tree, "HEAD"], cwd=root, check=True,
                       capture_output=True)
        try:
            _apply_arm(tree, cfg, arm)
            saved = os.path.join(tmp, "holdout")
            if holdout and os.path.isdir(os.path.join(tree, holdout)):
                shutil.copytree(os.path.join(tree, holdout), saved)
                shutil.rmtree(os.path.join(tree, holdout))
            subprocess.run(["git", "add", "-A"], cwd=tree, capture_output=True)
            subprocess.run(["git", "-c", "user.name=ab", "-c", "user.email=ab@local", "commit", "-q",
                            "--allow-empty", "-m", f"ab arm {arm}"], cwd=tree, capture_output=True)
            prompt_file = os.path.join(tree, tasks_dir or "", task + ".md")
            env = dict(os.environ, GOLDEN_PATH_ARM=arm, GOLDEN_PATH_TASK=task, GOLDEN_PATH_SESSION=sid,
                       GOLDEN_PATH_LESSONS="off" if arm == "off" else "on")
            cmd = agent_cmd.replace("{prompt_file}", shlex.quote(prompt_file)).replace("{task}", shlex.quote(task))
            t0 = time.time()
            try:
                p = subprocess.run(cmd, shell=True, cwd=tree, env=env, capture_output=True, text=True, timeout=timeout)
                agent_exit = p.returncode
            except subprocess.TimeoutExpired:
                agent_exit = None
            wall = round(time.time() - t0, 3)
            if os.path.isdir(saved):
                shutil.copytree(saved, os.path.join(tree, holdout), dirs_exist_ok=True)
            acc_cmd = (ab.get("acceptance_command") or "").replace("{task}", task)
            accepted = None
            if acc_cmd:
                a = subprocess.run(acc_cmd, shell=True, cwd=tree, capture_output=True, text=True, timeout=600)
                accepted = a.returncode == 0
            sess = [s for s in gp_report.sessions(gp_report.read_jsonl(os.path.join(tree, c.LEDGER_REL)))]
            s = sess[0] if sess else {}
            row = {"task": task, "arm": arm, "rep": rep, "session": sid, "agent_exit": agent_exit,
                   "wall_sec": wall, "accepted": accepted,
                   "iterations_to_green": s.get("iterations_to_green"), "failed_checks": s.get("failed_checks"),
                   "failed_tests": s.get("failed_tests"), "time_to_green_sec": s.get("time_to_green_sec"),
                   "method_loaded": s.get("method_loaded", False), "gate_observed": bool(sess)}
        finally:
            subprocess.run(["git", "worktree", "remove", "--force", tree], cwd=root, capture_output=True)
    with open(results_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(row, sort_keys=True) + "\n")
    return row
