"""Learning step: validate and accept proposed regression tests ("lessons").

A proposal is EARNED only if it fails on the base commit and passes on the current tree.
Accepting writes the test into the learned-tests directory (the artifact that owns the
learning, per METHOD.md "Report"); there is no separate lesson registry. Nothing is committed:
the human reviews `git diff` and commits through normal review.
"""
import os
import shutil
import subprocess
import tempfile

import gp_common as c

PROPOSALS_REL = os.path.join(".golden-path", "proposals")


def _candidate(root, name):
    d = os.path.join(root, PROPOSALS_REL, name)
    files = [f for f in sorted(os.listdir(d)) if f.startswith("test_")] if os.path.isdir(d) else []
    if len(files) != 1:
        raise SystemExit(f"proposal {name}: expected exactly one test_* file in {d}, found {files}")
    return os.path.join(d, files[0])


def _safe(name):
    """Test runners (e.g. unittest discovery) skip files that are not valid identifiers."""
    return "".join(ch if ch.isalnum() else "_" for ch in name).strip("_").lower() or "lesson"


def _run_in(tree, cfg, rel_file):
    cmd = cfg["test_file_command"].replace("{file}", rel_file)
    p = subprocess.run(cmd, shell=True, cwd=tree, capture_output=True, text=True,
                       timeout=cfg.get("check_timeout_sec", 100))
    return p.returncode == 0, (p.stdout + p.stderr)[-3000:]


def _copy_tree(root, dst):
    shutil.copytree(root, dst, ignore=shutil.ignore_patterns(".git", ".golden-path", "node_modules", "__pycache__"))


def validate(root, name, base="HEAD"):
    cfg = c.load_config(root)
    if not cfg.get("test_file_command"):
        raise SystemExit("config.test_file_command is required for learning (e.g. 'python3 -m unittest {file}')")
    cand = _candidate(root, name)
    rel_target = os.path.join(cfg["learned_tests_dir"], "test_PROPOSED_" + _safe(name) + os.path.splitext(cand)[1])
    with tempfile.TemporaryDirectory() as tmp:
        base_tree = os.path.join(tmp, "base")
        subprocess.run(["git", "worktree", "add", "--detach", "-q", base_tree, base], cwd=root, check=True,
                       capture_output=True)
        try:
            os.makedirs(os.path.dirname(os.path.join(base_tree, rel_target)), exist_ok=True)
            shutil.copy(cand, os.path.join(base_tree, rel_target))
            base_ok, base_out = _run_in(base_tree, cfg, rel_target)
        finally:
            subprocess.run(["git", "worktree", "remove", "--force", base_tree], cwd=root, capture_output=True)
        cur_tree = os.path.join(tmp, "cur")
        _copy_tree(root, cur_tree)
        os.makedirs(os.path.dirname(os.path.join(cur_tree, rel_target)), exist_ok=True)
        shutil.copy(cand, os.path.join(cur_tree, rel_target))
        cur_ok, cur_out = _run_in(cur_tree, cfg, rel_target)
    earned = (not base_ok) and cur_ok
    verdict = {"proposal": name, "base": c.git(root, "rev-parse", base), "fails_on_base": not base_ok,
               "passes_now": cur_ok, "earned": earned}
    c.ledger(root, "lesson_validated", **verdict)
    if earned:
        patch = c.git(root, "diff", "--no-index", "--", os.devnull, cand) or ""
        if not patch:  # git diff --no-index exits 1 when files differ; c.git drops output on rc!=0
            p = subprocess.run(["git", "diff", "--no-index", "--", os.devnull, cand], cwd=root,
                               capture_output=True, text=True)
            patch = p.stdout
        with open(os.path.join(os.path.dirname(cand), "proposal.patch"), "w", encoding="utf-8") as f:
            f.write(patch)
    verdict["base_output"], verdict["current_output"] = base_out[-800:], cur_out[-800:]
    return verdict


def next_id(root, cfg):
    ids = [int(l["id"][1:]) for l in c.list_lessons(root, cfg) if l["id"][1:].isdigit()]
    return "L%03d" % (max(ids, default=0) + 1)


def accept(root, name, base="HEAD"):
    cfg = c.load_config(root)
    v = validate(root, name, base)
    if not v["earned"]:
        raise SystemExit(f"refusing to accept {name}: not earned (fails_on_base={v['fails_on_base']}, passes_now={v['passes_now']})")
    cand = _candidate(root, name)
    lid = next_id(root, cfg)
    dst_dir = os.path.join(root, cfg["learned_tests_dir"])
    os.makedirs(dst_dir, exist_ok=True)
    dst = os.path.join(dst_dir, f"test_{lid}_{_safe(name)}{os.path.splitext(cand)[1]}")
    with open(cand, encoding="utf-8") as f:
        body = f.read()
    comment = "#" if dst.endswith((".py", ".sh", ".rb")) else "//"
    with open(dst, "w", encoding="utf-8") as f:
        f.write(f"{comment} golden-path lesson {lid}; earned against base {v['base'][:12]} (fails on base, passes on fix)\n" + body)
    c.ledger(root, "lesson_accepted", lesson=lid, proposal=name, path=os.path.relpath(dst, root), base=v["base"])
    return {"lesson": lid, "path": os.path.relpath(dst, root)}
