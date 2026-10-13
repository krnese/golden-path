"""Shared helpers for Golden Path hook scripts. Python 3.9+ stdlib only.

Hook payload formats follow the GitHub Copilot hooks reference (version 1 files):
https://docs.github.com/en/copilot/reference/hooks-reference
Both the camelCase payload (event configured as e.g. `agentStop`) and the
VS Code-compatible snake_case payload (event configured as e.g. `Stop`) are accepted.
"""
import hashlib
import json
import os
import subprocess
import sys
import time

CONFIG_REL = os.path.join(".golden-path", "config.json")
STATE_REL = os.path.join(".golden-path", "state")
LEDGER_REL = os.path.join(".golden-path", "ledger.jsonl")

DEFAULT_CONFIG = {
    "check": None,                 # REQUIRED: adopter's check command (exit 0 == green)
    "test_file_command": None,     # optional: command to run one test file, "{file}" placeholder
    "protected": ["tests/**"],     # test paths guarded against weakening
    "learned_tests_dir": "tests/learned",
    "max_blocks": 5,               # self-limit, below the CLI's 8-consecutive-block guard
    "check_timeout_sec": 100,      # keep below the hook timeoutSec (timeouts fail OPEN)
    "learning_prompt": True,
}


def read_payload():
    raw = sys.stdin.read() if not sys.stdin.isatty() else ""
    try:
        data = json.loads(raw) if raw.strip() else {}
    except json.JSONDecodeError:
        data = {}
    return data if isinstance(data, dict) else {}


def field(payload, camel, snake=None, default=None):
    if camel in payload:
        return payload[camel]
    if snake and snake in payload:
        return payload[snake]
    return default


def repo_root(start=None):
    start = start or os.getcwd()
    try:
        out = subprocess.run(["git", "rev-parse", "--show-toplevel"], cwd=start,
                             capture_output=True, text=True, timeout=10)
        if out.returncode == 0 and out.stdout.strip():
            return out.stdout.strip()
    except (OSError, subprocess.SubprocessError):
        pass
    return os.path.abspath(start)


def load_config(root):
    path = os.path.join(root, CONFIG_REL)
    cfg = dict(DEFAULT_CONFIG)
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            cfg.update(json.load(f))
    return cfg


def git(root, *args):
    try:
        out = subprocess.run(["git", *args], cwd=root, capture_output=True, text=True, timeout=30)
        return out.stdout.strip() if out.returncode == 0 else ""
    except (OSError, subprocess.SubprocessError):
        return ""


def head_sha(root):
    return git(root, "rev-parse", "HEAD") or None


def diff_hash(root):
    """Hash of the working-tree diff against HEAD, including untracked files' names+content."""
    h = hashlib.sha256()
    h.update(git(root, "diff", "HEAD", "--binary").encode())
    for rel in sorted(git(root, "ls-files", "--others", "--exclude-standard").splitlines()):
        h.update(rel.encode())
        try:
            with open(os.path.join(root, rel), "rb") as f:
                h.update(f.read())
        except OSError:
            pass
    return h.hexdigest()[:16]


def file_hash(path):
    try:
        with open(path, "rb") as f:
            return hashlib.sha256(f.read()).hexdigest()[:16]
    except OSError:
        return None


def session_id(payload):
    sid = field(payload, "sessionId", "session_id") or os.environ.get("GOLDEN_PATH_SESSION") or "unknown"
    return "".join(c for c in str(sid) if c.isalnum() or c in "-_")[:80] or "unknown"


def load_state(root, sid):
    path = os.path.join(root, STATE_REL, sid + ".json")
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_state(root, sid, state):
    d = os.path.join(root, STATE_REL)
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, sid + ".json"), "w", encoding="utf-8") as f:
        json.dump(state, f, indent=1)


def ledger(root, event, **data):
    rec = {"ts": time.time(), "event": event, "arm": os.environ.get("GOLDEN_PATH_ARM"), **data}
    os.makedirs(os.path.dirname(os.path.join(root, LEDGER_REL)), exist_ok=True)
    with open(os.path.join(root, LEDGER_REL), "a", encoding="utf-8") as f:
        f.write(json.dumps(rec, sort_keys=True) + "\n")
    return rec


def lessons_enabled():
    return os.environ.get("GOLDEN_PATH_LESSONS", "on").lower() != "off"


def list_lessons(root, cfg):
    """A lesson IS a learned regression test file. No separate registry (see METHOD.md, Report)."""
    d = os.path.join(root, cfg["learned_tests_dir"])
    if not os.path.isdir(d):
        return []
    excluded = set(filter(None, os.environ.get("GOLDEN_PATH_EXCLUDE_LESSONS", "").split(",")))
    out = []
    for name in sorted(os.listdir(d)):
        if name.startswith(("test_L", "L-")) and os.path.isfile(os.path.join(d, name)):
            lid = lesson_id(name)
            if lid not in excluded:
                out.append({"id": lid, "path": os.path.join(cfg["learned_tests_dir"], name),
                            "summary": lesson_summary(os.path.join(d, name))})
    return out


def lesson_id(filename):
    base = filename[len("test_"):] if filename.startswith("test_") else filename
    return base.split(".")[0].split("_")[0]  # e.g. test_L001_rounding.py -> L001


def lesson_summary(path):
    try:
        with open(path, encoding="utf-8") as f:
            for line in f:
                s = line.strip().lstrip("#/ ").strip()
                if s.lower().startswith("lesson:"):
                    return s[len("lesson:"):].strip()
    except OSError:
        pass
    return ""


def emit(obj):
    sys.stdout.write(json.dumps(obj))
    sys.stdout.flush()
