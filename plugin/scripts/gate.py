#!/usr/bin/env python3
"""Golden Path level 2: the ONE hook script (stop gate, optional protected-test guard, session record). Python 3.8+ standard library only, no dependencies.

Hook formats: https://docs.github.com/en/copilot/reference/hooks-reference (version 1 files).
Accepts the camelCase payloads and the VS Code-compatible snake_case payloads.

  gate.py start               sessionStart: write method_files_present to the ledger, inject context
  gate.py guard               preToolUse: deny edits to protected acceptance tests / kit; ask on protected tests
  gate.py stop   (default)    agentStop: block while checks are red ({"decision":"block","reason":...})
  gate.py subagent start|stop subagentStart/Stop: record use of the opt-in reviewer only, never blocks
  gate.py check               run the checks once (CLI / CI), exit 0 when green

Checks: the adopter's `check` command, the optional `acceptance.command`, test-integrity (protected
tests must not lose tests or assertions or gain skip markers) and acceptance-integrity (protected
acceptance files must be byte-identical to the session base commit).

Honest limits:
- After `max_blocks` (default 5, below the CLI's 8-consecutive-block override) the gate lets the
  agent stop, but it records `gave_up` with outcome FAILED, escalated to the acceptance owner.
  It is never an implicit pass.
- If the hook TIMES OUT, Copilot fails OPEN: the stop proceeds and no gate record is written.
  research/ reports such sessions as UNVERIFIED. Keep check_timeout_sec below the hook timeoutSec.
- `method_files_present` means the skill and method files existed and context was offered.
  It does NOT show that the agent read or followed them.
"""
import fnmatch
import hashlib
import json
import os
import re
import subprocess
import sys
import time

CONFIG_REL = os.path.join(".golden-path", "config.json")
STATE_REL = os.path.join(".golden-path", "state")
LEDGER_REL = os.path.join(".golden-path", "ledger.jsonl")
DEFAULT_CONFIG = {
    "check": None,               # REQUIRED: adopter's check command (exit 0 == green)
    "protected": ["tests/**"],   # developer tests guarded against weakening
    "max_blocks": 5,
    "check_timeout_sec": 100,    # keep below the hook timeoutSec (timeouts fail OPEN)
    # Written or approved by the business-context expert (the owner). Agents read and run, never change.
    "acceptance": {"paths": [], "command": None, "owner": "the acceptance owner"},
    "research": {"enabled": False},  # research/ tools only; nothing in the kit reads more than this flag
}
SKILL_CANDIDATES = [".github/skills/golden-path/SKILL.md", "skills/golden-path/SKILL.md"]

# ---------- shared helpers (used by the stop gate and the guard) ----------


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
    return payload.get(snake, default) if snake else default


def git(root, *args):
    try:
        p = subprocess.run(["git", *args], cwd=root, capture_output=True, text=True, timeout=30)
        return p.returncode, p.stdout
    except (OSError, subprocess.SubprocessError):
        return 1, ""


def repo_root(start=None):
    start = start or os.getcwd()
    code, out = git(start, "rev-parse", "--show-toplevel")
    return out.strip() if code == 0 and out.strip() else os.path.abspath(start)


def load_config(root):
    cfg = dict(DEFAULT_CONFIG)
    path = os.path.join(root, CONFIG_REL)
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            cfg.update(json.load(f))
    cfg["acceptance"] = dict(DEFAULT_CONFIG["acceptance"], **(cfg.get("acceptance") or {}))
    return cfg


def head_sha(root):
    code, out = git(root, "rev-parse", "HEAD")
    return out.strip() if code == 0 else None


def diff_hash(root):
    h = hashlib.sha256(git(root, "diff", "HEAD", "--binary")[1].encode())
    for rel in sorted(git(root, "ls-files", "--others", "--exclude-standard")[1].splitlines()):
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
    except (OSError, TypeError):
        return None


def session_id(payload):
    sid = field(payload, "sessionId", "session_id") or os.environ.get("GOLDEN_PATH_SESSION") or "unknown"
    return "".join(ch for ch in str(sid) if ch.isalnum() or ch in "-_")[:80] or "unknown"


def state(root, sid, new=None):
    path = os.path.join(root, STATE_REL, sid + ".json")
    if new is None:
        if os.path.exists(path):
            with open(path, encoding="utf-8") as f:
                return json.load(f)
        return {}
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(new, f, indent=1)
    return new


def ledger(root, event, **data):
    rec = {"ts": time.time(), "event": event, "arm": os.environ.get("GOLDEN_PATH_ARM"), **data}
    path = os.path.join(root, LEDGER_REL)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(rec, sort_keys=True) + "\n")
    return rec


def emit(obj):
    sys.stdout.write(json.dumps(obj))
    sys.stdout.flush()


def matches(rel, patterns):
    rel = rel.replace(os.sep, "/")
    return any((p.endswith("/**") and (rel == p[:-3] or rel.startswith(p[:-2]))) or fnmatch.fnmatch(rel, p)
               for p in patterns)


# ---------- integrity checks ----------

TEST_RE = re.compile(r"^\s*(def\s+test\w*|async\s+def\s+test\w*|(it|test)\s*\(|func\s+Test\w+|\[(Fact|Test|TestMethod|Theory)\])", re.M)
ASSERT_RE = re.compile(r"\b(assert\w*|expect\s*\(|Assert\.\w+|self\.fail|pytest\.raises|t\.(Error|Fatal)\w*)")
SKIP_RE = re.compile(r"(@unittest\.skip|@pytest\.mark\.(skip|xfail)|\b(it|describe|test)\.(skip|only)\b|\bx(it|describe)\s*\(|expectedFailure|t\.Skip|\[Ignore\]|Skip\s*=)")


def _counts(text):
    return len(TEST_RE.findall(text)), len(ASSERT_RE.findall(text)), len(SKIP_RE.findall(text))


def _base_files(root, patterns, base):
    code, out = git(root, "ls-tree", "-r", "--name-only", base)
    return [r for r in out.splitlines() if matches(r, patterns)] if code == 0 else []


def test_integrity(root, patterns, base="HEAD"):
    """Heuristic anti-weakening check on protected tests. Adding tests is always allowed."""
    out = []
    for rel in _base_files(root, patterns, base):
        path = os.path.join(root, rel)
        if not os.path.exists(path):
            out.append(f"{rel}: protected test file deleted")
            continue
        with open(path, encoding="utf-8", errors="replace") as f:
            (bt, ba, bs), (at, aa, as_) = _counts(git(root, "show", f"{base}:{rel}")[1]), _counts(f.read())
        if at < bt:
            out.append(f"{rel}: test count dropped {bt} -> {at}")
        if aa < ba:
            out.append(f"{rel}: assertion count dropped {ba} -> {aa}")
        if as_ > bs:
            out.append(f"{rel}: new skip/only/xfail marker(s) {bs} -> {as_}")
    return out


def acceptance_changes(root, patterns, base="HEAD"):
    """Any edit, deletion or new file under protected acceptance paths vs base."""
    if not patterns:
        return []
    out, base_files = [], _base_files(root, patterns, base)
    for rel in base_files:
        path = os.path.join(root, rel)
        if not os.path.exists(path):
            out.append(f"{rel}: protected acceptance file deleted")
            continue
        with open(path, encoding="utf-8", errors="replace", newline="") as f:
            if f.read() != git(root, "show", f"{base}:{rel}")[1]:
                out.append(f"{rel}: protected acceptance file modified")
    new = set(git(root, "ls-files", "--others", "--exclude-standard")[1].splitlines())
    new |= set(git(root, "diff", "--name-only", "--diff-filter=A", base)[1].splitlines())
    out += [f"{r}: new file under protected acceptance paths" for r in sorted(new)
            if r and matches(r, patterns) and r not in base_files]
    return out


FAILED_TEST_RE = re.compile(r"^(?:FAIL|ERROR): (\S+)|^FAILED (?!\()(\S+)|^\s*✕ (.+)$|^--- FAIL: (\S+)", re.M)


def _run(name, cmd, root, timeout):
    try:
        # No bytecode caches: a restored file with the same size and mtime could otherwise run a stale copy.
        env = dict(os.environ, PYTHONDONTWRITEBYTECODE="1")
        p = subprocess.run(cmd, shell=True, cwd=root, capture_output=True, text=True, timeout=timeout, env=env)
        out = p.stdout + "\n" + p.stderr
        failed = sorted({next(g for g in m.groups() if g) for m in FAILED_TEST_RE.finditer(out)})
        return {"name": name, "ok": p.returncode == 0, "failed_tests": failed,
                "output": "\n".join(out.strip().splitlines()[-60:])}
    except subprocess.TimeoutExpired:
        return {"name": name, "ok": False, "output": f"{name} command timed out after {timeout}s (counted as RED)"}


def run_checks(root, cfg, base="HEAD"):
    t = cfg.get("check_timeout_sec", 100)
    acc = cfg["acceptance"]
    res = [_run("check", cfg["check"], root, t) if cfg.get("check") else
           {"name": "config", "ok": False, "output": "No check command configured in .golden-path/config.json ('check')."}]
    if acc.get("command"):
        res.append(_run("acceptance", acc["command"], root, t))
    v = test_integrity(root, cfg.get("protected", []), base)
    res.append({"name": "test-integrity", "ok": not v, "output": "\n".join(v)})
    a = acceptance_changes(root, acc.get("paths", []), base)
    res.append({"name": "acceptance-integrity", "ok": not a, "owner": acc.get("owner"), "output": "\n".join(a)})
    return {"ok": all(r["ok"] for r in res), "results": res, "failed": [r["name"] for r in res if not r["ok"]],
            "failed_tests": sorted({x for r in res for x in r.get("failed_tests", [])})}


# ---------- hooks ----------

def on_start(payload):
    root = repo_root(field(payload, "cwd"))
    cfg, sid = load_config(root), session_id(payload)
    here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    skill = next((p for p in [os.path.join(root, s) for s in SKILL_CANDIDATES]
                  + [os.path.join(os.environ.get("PLUGIN_ROOT") or here, "skills/golden-path/SKILL.md")]
                  if os.path.exists(p)), None)
    method = os.path.join(os.path.dirname(skill), "references", "METHOD.md") if skill else None
    st = state(root, sid)
    st.update(base_sha=st.get("base_sha") or head_sha(root), started=st.get("started") or time.time(),
              task=os.environ.get("GOLDEN_PATH_TASK") or st.get("task"))
    state(root, sid, st)
    ledger(root, "method_files_present", session=sid, source=field(payload, "source"), skill_found=bool(skill),
           skill_hash=file_hash(skill), method_hash=file_hash(method), base_sha=st["base_sha"], task=st["task"],
           note="files existed and context was offered; does not show the agent read or followed them")
    ctx = ["Golden Path is active. Follow the golden-path skill (Intent -> Context -> Boundary -> Acceptance -> Report).",
           "A stop gate runs the repository checks when you finish; you cannot stop while they are red.",
           "Do not delete, skip or weaken existing tests; add new tests instead."]
    acc = cfg["acceptance"]
    if acc.get("paths"):
        ctx.append(f"Protected acceptance tests owned by {acc['owner']}: {', '.join(acc['paths'])}. Read and run them; "
                   "never change them. If one seems wrong, stop and report a DELEGATION CHANGE to the owner.")
    return {"additionalContext": "\n".join(ctx)}


def on_stop(payload):
    root = repo_root(field(payload, "cwd"))
    cfg, sid = load_config(root), session_id(payload)
    st = state(root, sid)
    st.setdefault("started", time.time())
    st.setdefault("base_sha", head_sha(root))
    st["blocks"], st["attempts"] = st.get("blocks", 0), st.get("attempts", 0) + 1
    res = run_checks(root, cfg, base=st["base_sha"] or "HEAD")
    owner, limit = cfg["acceptance"]["owner"], int(cfg.get("max_blocks", 5))
    rec = dict(session=sid, task=st.get("task") or os.environ.get("GOLDEN_PATH_TASK"), attempt=st["attempts"],
               ok=res["ok"], failed=res["failed"], failed_tests=res["failed_tests"],
               elapsed_sec=round(time.time() - st["started"], 3), head_sha=head_sha(root), diff_hash=diff_hash(root),
               stop_hook_active=bool(field(payload, "stop_hook_active", "stop_hook_active")))
    out = {}
    if res["ok"]:
        ledger(root, "gate_green", outcome="PASSED", **rec)
        st["blocks"], st["outcome"] = 0, "PASSED"
    elif st["blocks"] >= limit:
        # Runaway guard: let the agent stop, but the run is FAILED and escalated. Never an implicit pass.
        ledger(root, "gave_up", outcome="FAILED", escalated_to=owner, **rec)
        st["blocks"], st["outcome"] = 0, "FAILED"
    else:
        st["blocks"] += 1
        ledger(root, "gate_red", outcome="RED", **rec)
        extra = ""
        if "acceptance-integrity" in res["failed"]:
            ledger(root, "acceptance_change_attempt", owner=owner, **rec)
            extra = (f"\n\nProtected acceptance tests were changed. Restore them (git restore <path>). If you believe an "
                     f"acceptance example is wrong, that is a DELEGATION CHANGE: stop and report to {owner}: what changed, "
                     "why, consequence, evidence, unknowns, decision required.")
        last = "" if st["blocks"] < limit else (f"\nThis is the last block. If you stop while red, the run is recorded "
                                                f"as FAILED and escalated to {owner}.")
        detail = "\n\n".join(f"[{r['name']}]\n{r['output']}" for r in res["results"] if not r["ok"])
        out = {"decision": "block", "reason": f"Golden Path stop gate: checks are RED (attempt {st['attempts']}, block "
               f"{st['blocks']}/{limit}). Fix the cause; do not weaken, skip or delete tests.{extra}{last}\n\n{detail[:6000]}"}
    state(root, sid, st)
    return out


def on_subagent(payload, phase):
    if (field(payload, "agentName", "agent_name", "") or "") == "golden-path-reviewer":
        root = repo_root(field(payload, "cwd"))
        resp = field(payload, "response", "last_assistant_message", "") or ""
        ledger(root, "reviewer_" + phase, session=session_id(payload), response_chars=len(resp), head_sha=head_sha(root))
    return {}


# ---------- guard (preToolUse): protected tests, acceptance tests, kit files ----------

KIT_PATTERNS = [".github/hooks/golden-path*", ".github/hooks/golden-path/**", ".golden-path/config.json"]
PATH_KEYS = ("path", "file_path", "filePath", "filename", "file", "target_file")
EDIT_TOOLS = {"edit", "str_replace_editor", "apply_patch", "create", "write", "Edit", "Write"}
SHELL_TOOLS = {"bash", "powershell", "Bash", "shell"}
RESTORE_TO_HEAD = re.compile(r"git\s+(?:checkout\s+(?:HEAD\s+)?--|restore(?:\s+--worktree)?(?:\s+--)?)(?:\s+[\w./*'\"-]+)+")
DESTRUCTIVE = re.compile(r"\b(rm|del|rmdir|mv|move|unlink|truncate|git\s+rm|git\s+mv|git\s+checkout|git\s+stash|cp|tee|git\s+restore|sed\s+-i|perl\s+-pi)\b|Remove-Item|Set-Content|Out-File")


def rel(root, p):
    p = os.path.normpath(os.path.join(root, p)) if not os.path.isabs(p) else os.path.normpath(p)
    try:
        r = os.path.relpath(p, root)
    except ValueError:
        return p
    return r.replace(os.sep, "/")


def paths_in(args):
    if not isinstance(args, dict):
        return []
    return [v for k, v in args.items() if k in PATH_KEYS and isinstance(v, str)]


def _acceptance_deny(cfg, what):
    owner = (cfg.get("acceptance") or {}).get("owner", "the acceptance owner")
    return {"permissionDecision": "deny", "permissionDecisionReason":
            f"{what} is a protected acceptance test owned by {owner}. Agents may read and run it, never change it. "
            f"If it looks wrong, that is a DELEGATION CHANGE: stop and report to {owner} "
            "(what changed, why, consequence, evidence, unknowns, decision required)."}


def decide(root, cfg, tool, args):
    protected = cfg.get("protected", [])
    acceptance = (cfg.get("acceptance") or {}).get("paths", [])
    if tool in EDIT_TOOLS:
        for p in paths_in(args):
            r = rel(root, p)
            if acceptance and matches(r, acceptance):
                return _acceptance_deny(cfg, r)
            if matches(r, KIT_PATTERNS):
                return {"permissionDecision": "deny", "permissionDecisionReason":
                        f"{r} is part of the Golden Path kit/config; change it in a reviewed PR, not in an agent session."}
            if matches(r, protected) and os.path.exists(os.path.join(root, r)):
                return {"permissionDecision": "ask", "permissionDecisionReason":
                        f"{r} is an existing protected test. Editing it can weaken the evidence; add a new test instead, or get human approval."}
        return {}
    if tool in SHELL_TOOLS and isinstance(args, dict):
        cmd = str(args.get("command") or args.get("cmd") or "")
        norm = cmd.replace("\\", "/")
        if RESTORE_TO_HEAD.fullmatch(norm.strip()) and not re.search(r"\s(--source|-s)\b", norm):
            return {}  # putting protected files back exactly as committed is always safe
        for pat in acceptance:
            stem = pat.split("*")[0].rstrip("/")
            if stem and ((DESTRUCTIVE.search(norm) and stem in norm) or re.search(r">>?\s*['\"]?(?:\./)?" + re.escape(stem), norm)):
                return _acceptance_deny(cfg, stem)
        for pat in protected + KIT_PATTERNS:
            stem = pat.split("*")[0].rstrip("/")
            if not stem:
                continue
            ref = r"(?:^|[\s'\"=(])(?:\./)?" + re.escape(stem) + r"(?:[/\s'\")]|$)"
            redirect = r">>?\s*['\"]?(?:\./)?" + re.escape(stem)
            if (DESTRUCTIVE.search(norm) and re.search(ref, norm)) or re.search(redirect, norm):
                return {"permissionDecision": "deny", "permissionDecisionReason":
                        f"Shell command modifies/deletes protected path '{stem}'. Not allowed in an agent session."}
        if re.search(r"--no-verify\b", cmd):
            return {"permissionDecision": "deny", "permissionDecisionReason": "--no-verify bypasses repository checks."}
    return {}


def on_guard(payload):
    """preToolUse. Decision fields: permissionDecision allow|deny|ask (+ reason). "ask" acts as deny in
    cloud agent and CLI autopilot. Command-hook errors fail CLOSED and timeouts fail OPEN, so this never
    raises: on any error it allows and leaves the stop gate as the backstop. Tool argument shapes for
    edit/create are not fully documented; paths are read defensively from common keys."""
    try:
        root = repo_root(field(payload, "cwd"))
        cfg = load_config(root)
        tool = field(payload, "toolName", "tool_name", "")
        args = field(payload, "toolArgs", "tool_input", {})
        if isinstance(args, str):
            try:
                args = json.loads(args)
            except ValueError:
                args = {"command": args}
        out = decide(root, cfg, tool, args)
        if out.get("permissionDecision") in ("deny", "ask"):
            ledger(root, "guard_" + out["permissionDecision"], tool=tool, session=session_id(payload),
                   reason=out["permissionDecisionReason"])
        return out
    except Exception as e:  # noqa: BLE001
        sys.stderr.write(f"golden-path guard error (allowing; the stop gate is the backstop): {e}\n")
        return {}


def main(argv):
    cmd = argv[0] if argv else "stop"
    if cmd == "check":
        root = repo_root()
        res = run_checks(root, load_config(root))
        print(json.dumps(res, indent=1))
        return 0 if res["ok"] else 1
    payload = read_payload()
    if cmd == "start":
        out = on_start(payload)
    elif cmd == "guard":
        out = on_guard(payload)
    elif cmd == "subagent":
        out = on_subagent(payload, argv[1] if len(argv) > 1 else "start")
    else:
        out = on_stop(payload)
    emit(out)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
