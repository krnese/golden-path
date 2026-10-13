#!/usr/bin/env python3
"""Install / uninstall the Golden Path kit into an adopter repository (copy-in mode).

Levels (no level requires a higher one; copying the files by hand is equally supported, see README):
  --level 1  Method: skill + references + an instructions block. Zero code, no config.
  --level 2  Checked completion (default): level 1 + ONE hook script (gate.py) + hook JSON + config.
             Protected acceptance tests are optional config (--acceptance-path ...).
  --level 3  Learning and measurement: level 2 with research.enabled true. The research tools stay in
             the kit checkout (research/) and are never copied into the adopter repo.

Idempotent and conflict-refusing:
- Only namespaced files are written (.github/skills/golden-path/, optional .github/agents/golden-path*.agent.md,
  .github/hooks/golden-path-loop.json, .github/hooks/golden-path/, .github/prompts/golden-path-*.prompt.md,
  optional .github/workflows/golden-path-check.yml).
- Adopter files (.github/copilot-instructions.md, AGENTS.md, .gitignore) are never overwritten:
  a marked block <!-- golden-path:begin --> ... <!-- golden-path:end --> is appended/updated.
- .golden-path/config.json is adopter-owned: created once, never overwritten.
- If ANY target exists with content we did not write (or that was modified since), nothing is
  written and the exit code is 2.

  python3 install.py --target REPO --check "npm test"        # first install
  python3 install.py --target REPO                            # re-run / upgrade (no-op if unchanged)
  python3 install.py --target REPO --uninstall [--purge]
"""
import argparse
import hashlib
import json
import os
import sys

KIT = os.path.dirname(os.path.abspath(__file__))
MANIFEST = ".golden-path/install-manifest.json"
CONFIG = ".golden-path/config.json"
VERSION = json.load(open(os.path.join(KIT, "plugin.json")))["version"]
BEGIN, END = "golden-path:begin", "golden-path:end"


def sha(data):
    return hashlib.sha256(data.encode()).hexdigest()


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def planned_files(with_reviewer, with_ci, with_agent=False, level=2):
    files = {}
    skill = os.path.join(KIT, "skills", "golden-path")
    for dp, _, fns in os.walk(skill):
        for fn in fns:
            src = os.path.join(dp, fn)
            files[".github/skills/golden-path/" + os.path.relpath(src, skill).replace(os.sep, "/")] = read(src)
    if level >= 2:  # level 1 (method) is zero code: skill, references and instructions only
        files[".github/hooks/golden-path/gate.py"] = read(os.path.join(KIT, "scripts", "gate.py"))
        hooks = read(os.path.join(KIT, "com.github.copilot", "hooks", "hooks.json"))
        files[".github/hooks/golden-path-loop.json"] = hooks.replace("${PLUGIN_ROOT}/scripts/", ".github/hooks/golden-path/")
    if with_agent:  # optional preset; the skill and hooks work with Copilot's default agent
        files[".github/agents/golden-path.agent.md"] = read(os.path.join(KIT, "optional", "agents", "golden-path.agent.md"))
    if with_reviewer and level >= 2:
        files[".github/agents/golden-path-reviewer.agent.md"] = read(os.path.join(KIT, "optional", "agents", "golden-path-reviewer.agent.md"))
    files[".github/prompts/golden-path-task.prompt.md"] = read(os.path.join(KIT, "extras", "prompts", "golden-path-task.prompt.md"))
    if with_ci and level >= 2:
        files[".github/workflows/golden-path-check.yml"] = read(os.path.join(KIT, "extras", "workflows", "golden-path-check.yml"))
    return files


BLOCKS = {
    ".github/copilot-instructions.md": ("<!-- {} -->", "This repository uses Golden Path. For engineering tasks use the `golden-path` skill\n"
                                        "(`.github/skills/golden-path/SKILL.md`). Protected acceptance tests (see `.golden-path/config.json`) are owned by the business-context expert; never change them. A stop gate runs the checks."),
    "AGENTS.md": ("<!-- {} -->", "Golden Path: use the `golden-path` skill (`.github/skills/golden-path/SKILL.md`) for engineering tasks.\n"
                  "Do not delete, skip or weaken existing tests; the stop gate and integrity check enforce this."),
    ".gitignore": ("# {}", ".golden-path/state/\n.golden-path/ledger.jsonl\n.golden-path/proposals/\n.golden-path/ab/"),
}
LEVEL1_BLOCKS = {
    ".github/copilot-instructions.md": "This repository uses the Golden Path method. For engineering tasks use the `golden-path` skill\n"
                                       "(`.github/skills/golden-path/SKILL.md`). Acceptance tests owned by the business-context expert are never changed by the agent.",
}
CREATE_IF_MISSING = {".github/copilot-instructions.md", ".gitignore"}  # AGENTS.md: only if adopter has one


def block_text(fmt, body):
    return f"{fmt.format(BEGIN)}\n{body}\n{fmt.format(END)}\n"


def apply_block(existing, fmt, body, remove=False):
    b, e = fmt.format(BEGIN), fmt.format(END)
    if existing is not None and (existing.count(b) > 1 or existing.count(b) != existing.count(e)):
        raise ValueError("malformed golden-path block markers")
    if existing is not None and b in existing:
        pre, rest = existing.split(b, 1)
        post = rest.split(e, 1)[1].lstrip("\n")
        if remove:
            return (pre.rstrip("\n") + "\n" + post) if pre.strip() or post.strip() else ""
        return pre + block_text(fmt, body) + post
    if remove:
        return existing
    base = existing or ""
    if base and not base.endswith("\n"):
        base += "\n"
    return base + ("\n" if base else "") + block_text(fmt, body)


def install(target, check, test_file_cmd, with_reviewer, with_ci, dry=False, with_agent=False,
            acceptance_paths=None, acceptance_owner=None, acceptance_command=None, level=None):
    man_path = os.path.join(target, MANIFEST)
    manifest = json.loads(read(man_path)) if os.path.exists(man_path) else {"files": {}}
    level = int(level or manifest.get("level", 2))
    if level < manifest.get("level", 0):
        print(f"REFUSING: installed at level {manifest['level']}; uninstall first to go down to level {level}")
        return 2
    files = planned_files(with_reviewer or ".github/agents/golden-path-reviewer.agent.md" in manifest["files"],
                          with_ci or ".github/workflows/golden-path-check.yml" in manifest["files"],
                          with_agent or ".github/agents/golden-path.agent.md" in manifest["files"], level)
    conflicts, actions = [], []
    for rel, content in files.items():
        p = os.path.join(target, rel)
        if not os.path.exists(p):
            actions.append(("create", rel))
            continue
        cur = read(p)
        if cur == content:
            continue
        if manifest["files"].get(rel) == sha(cur):
            actions.append(("update", rel))
        else:
            conflicts.append(f"{rel}: exists with content not written by golden-path (or modified since install)")
    new_blocks = {}
    for rel, (fmt, body) in BLOCKS.items():
        if level == 1:
            if rel == ".gitignore":
                continue
            body = LEVEL1_BLOCKS.get(rel, body)
        p = os.path.join(target, rel)
        exists = os.path.exists(p)
        if not exists and rel not in CREATE_IF_MISSING:
            continue
        cur = read(p) if exists else None
        try:
            nxt = apply_block(cur, fmt, body)
        except ValueError as e:
            conflicts.append(f"{rel}: {e}")
            continue
        if nxt != cur:
            new_blocks[rel] = nxt
            actions.append(("block", rel))
    cfg_path = os.path.join(target, CONFIG)
    if level >= 2 and not os.path.exists(cfg_path):
        if not check:
            conflicts.append(f"{CONFIG}: missing; pass --check \"<your check command>\" on first install")
        else:
            actions.append(("config", CONFIG))
    if conflicts:
        print("REFUSING: conflicts found, nothing written:\n  " + "\n  ".join(conflicts))
        return 2
    if dry:
        print("\n".join(f"{a}: {r}" for a, r in actions) or "nothing to do")
        return 0
    for rel, content in files.items():
        p = os.path.join(target, rel)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        if not os.path.exists(p) or read(p) != content:
            with open(p, "w", encoding="utf-8", newline="\n") as f:
                f.write(content)
        manifest["files"][rel] = sha(content)
    for rel, content in new_blocks.items():
        with open(os.path.join(target, rel), "w", encoding="utf-8", newline="\n") as f:
            f.write(content)
    if level >= 2 and not os.path.exists(cfg_path):
        os.makedirs(os.path.dirname(cfg_path), exist_ok=True)
        cfg = {"check": check,
               "acceptance": {"paths": acceptance_paths or [], "owner": acceptance_owner or "the acceptance owner",
                              "command": acceptance_command},
               "protected": ["tests/**"], "max_blocks": 5, "check_timeout_sec": 100,
               "research": {"enabled": level >= 3}, "test_file_command": test_file_cmd,
               "learned_tests_dir": "tests/learned"}
        with open(cfg_path, "w", encoding="utf-8") as f:
            json.dump(cfg, f, indent=2)
            f.write("\n")
    manifest.update({"version": VERSION, "level": level, "blocks": sorted(set(manifest.get("blocks", [])) |
                     {r for r in BLOCKS if os.path.exists(os.path.join(target, r))})})
    os.makedirs(os.path.dirname(man_path), exist_ok=True)
    new_man = json.dumps(manifest, indent=1, sort_keys=True) + "\n"
    if not os.path.exists(man_path) or read(man_path) != new_man:
        with open(man_path, "w", encoding="utf-8") as f:
            f.write(new_man)
    print("\n".join(f"{a}: {r}" for a, r in actions) or "already installed; nothing changed")
    return 0


def uninstall(target, force=False, purge=False):
    man_path = os.path.join(target, MANIFEST)
    if not os.path.exists(man_path):
        print("not installed (no manifest); nothing to do")
        return 0
    manifest = json.loads(read(man_path))
    modified = [rel for rel, h in manifest["files"].items()
                if os.path.exists(os.path.join(target, rel)) and sha(read(os.path.join(target, rel))) != h]
    if modified and not force:
        print("REFUSING: files modified since install (use --force to remove anyway):\n  " + "\n  ".join(modified))
        return 2
    for rel in manifest["files"]:
        p = os.path.join(target, rel)
        if os.path.exists(p):
            os.remove(p)
    for rel in manifest.get("blocks", []):
        p = os.path.join(target, rel)
        if os.path.exists(p):
            fmt = BLOCKS[rel][0]
            nxt = apply_block(read(p), fmt, "", remove=True)
            if nxt == "" and rel in CREATE_IF_MISSING:
                os.remove(p)
            else:
                with open(p, "w", encoding="utf-8", newline="\n") as f:
                    f.write(nxt)
    os.remove(man_path)
    if purge:
        for rel in (CONFIG,):
            if os.path.exists(os.path.join(target, rel)):
                os.remove(os.path.join(target, rel))
    for d in [".github/skills/golden-path/references", ".github/skills/golden-path", ".github/hooks/golden-path",
              ".github/hooks", ".github/agents", ".github/prompts", ".github/skills", ".github/workflows",
              ".golden-path", ".github"]:
        p = os.path.join(target, d)
        if os.path.isdir(p) and not os.listdir(p):
            os.rmdir(p)
    print("uninstalled")
    return 0


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--target", required=True)
    ap.add_argument("--level", type=int, choices=[1, 2, 3], help="1 method only (no code); 2 (default) + stop gate "
                    "and optional protected-test guard; 3 + research tools enabled (run from the kit's research/)")
    ap.add_argument("--check", help="adopter check command (first install)")
    ap.add_argument("--test-file-command", default=None, help="run one test file, '{file}' placeholder")
    ap.add_argument("--acceptance-path", action="append", dest="acceptance_paths",
                    help="protected acceptance test path/glob (repeatable), e.g. 'acceptance/**'")
    ap.add_argument("--acceptance-owner", help="who owns acceptance (name/role), e.g. 'Finance: Ingrid'")
    ap.add_argument("--acceptance-command", help="command that runs the acceptance tests (exit 0 == pass)")
    ap.add_argument("--with-agent-preset", action="store_true", help="also install the optional golden-path custom agent")
    ap.add_argument("--with-reviewer", action="store_true", help="also install the opt-in read-only reviewer agent")
    ap.add_argument("--with-ci", action="store_true", help="also add .github/workflows/golden-path-check.yml")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--uninstall", action="store_true")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--purge", action="store_true", help="with --uninstall: also remove .golden-path/config.json")
    a = ap.parse_args(argv)
    t = os.path.abspath(a.target)
    if a.uninstall:
        return uninstall(t, a.force, a.purge)
    return install(t, a.check, a.test_file_command, a.with_reviewer, a.with_ci, a.dry_run, a.with_agent_preset,
                   a.acceptance_paths, a.acceptance_owner, a.acceptance_command, a.level)


if __name__ == "__main__":
    sys.exit(main())
