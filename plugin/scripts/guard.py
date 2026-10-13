#!/usr/bin/env python3
"""preToolUse hook: anti-test-weakening and kit-tamper guard.

Decision fields per https://docs.github.com/en/copilot/reference/hooks-reference
(`preToolUse` decision control): permissionDecision allow|deny|ask, permissionDecisionReason.
Notes from that reference: "ask" is treated as "deny" in cloud agent and CLI autopilot;
command-hook errors fail CLOSED but timeouts fail OPEN; so this script is fast and never
crashes on odd input (it falls through to {} = default behaviour).
Tool argument shapes for edit/create are not fully documented; paths are extracted
defensively from common keys. The stop gate's test-integrity check is the backstop.
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gp_common as c  # noqa: E402
import gp_integrity  # noqa: E402

KIT_PATTERNS = [".github/hooks/golden-path*", ".github/hooks/golden-path/**", ".golden-path/config.json"]
PATH_KEYS = ("path", "file_path", "filePath", "filename", "file", "target_file")
EDIT_TOOLS = {"edit", "str_replace_editor", "apply_patch", "create", "write", "Edit", "Write"}
SHELL_TOOLS = {"bash", "powershell", "Bash", "shell"}
DESTRUCTIVE = re.compile(r"\b(rm|del|rmdir|mv|move|unlink|truncate|git\s+rm|git\s+mv|git\s+checkout\s+--|git\s+restore|sed\s+-i|perl\s+-pi)\b|Remove-Item|Set-Content|Out-File")


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


def decide(root, cfg, tool, args):
    protected = cfg.get("protected", [])
    if tool in EDIT_TOOLS:
        for p in paths_in(args):
            r = rel(root, p)
            if gp_integrity.matches(r, KIT_PATTERNS):
                return {"permissionDecision": "deny", "permissionDecisionReason":
                        f"{r} is part of the Golden Path kit/config; change it in a reviewed PR, not in an agent session."}
            if gp_integrity.matches(r, protected) and os.path.exists(os.path.join(root, r)):
                return {"permissionDecision": "ask", "permissionDecisionReason":
                        f"{r} is an existing protected test. Editing it can weaken the evidence; add a new test instead, or get human approval."}
        return {}
    if tool in SHELL_TOOLS and isinstance(args, dict):
        cmd = str(args.get("command") or args.get("cmd") or "")
        norm = cmd.replace("\\", "/")
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


def main():
    try:
        payload = c.read_payload()
        root = c.repo_root(c.field(payload, "cwd"))
        cfg = c.load_config(root)
        tool = c.field(payload, "toolName", "tool_name", "")
        args = c.field(payload, "toolArgs", "tool_input", {})
        if isinstance(args, str):
            import json
            try:
                args = json.loads(args)
            except ValueError:
                args = {"command": args}
        out = decide(root, cfg, tool, args)
        if out.get("permissionDecision") in ("deny", "ask"):
            c.ledger(root, "guard_" + out["permissionDecision"], tool=tool,
                     session=c.session_id(payload), reason=out["permissionDecisionReason"])
        c.emit(out)
    except Exception as e:  # never crash: a crash would deny every tool call (fail-closed)
        sys.stderr.write(f"golden-path guard error (allowing, gate is backstop): {e}\n")
        c.emit({})


if __name__ == "__main__":
    main()
