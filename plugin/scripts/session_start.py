#!/usr/bin/env python3
"""sessionStart hook: record that the Golden Path method was loaded; inject context.

Output `additionalContext` is the documented sessionStart output
(https://docs.github.com/en/copilot/reference/hooks-reference#sessionstart--sessionstart).
Records the skill/method hashes and base commit in the local ledger so a run can PROVE the
method was available to the session (closing the v1 csv-smoke "loading not demonstrated" gap).
Note: this proves the hook ran and the files existed, not that the model followed them.
"""
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gp_common as c  # noqa: E402

SKILL_CANDIDATES = [".github/skills/golden-path/SKILL.md", "skills/golden-path/SKILL.md"]


def main():
    payload = c.read_payload()
    root = c.repo_root(c.field(payload, "cwd"))
    cfg = c.load_config(root)
    sid = c.session_id(payload)
    plugin_root = os.environ.get("PLUGIN_ROOT") or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    skill = next((p for p in [os.path.join(root, s) for s in SKILL_CANDIDATES]
                  + [os.path.join(plugin_root, "skills/golden-path/SKILL.md")] if os.path.exists(p)), None)
    method = os.path.join(os.path.dirname(skill), "references", "METHOD.md") if skill else None
    lessons = c.list_lessons(root, cfg) if c.lessons_enabled() else []
    state = c.load_state(root, sid)
    state.update({"base_sha": state.get("base_sha") or c.head_sha(root),
                  "started": state.get("started") or time.time(),
                  "task": os.environ.get("GOLDEN_PATH_TASK") or state.get("task"),
                  "lessons_injected": [l["id"] for l in lessons]})
    c.save_state(root, sid, state)
    c.ledger(root, "method_loaded", session=sid, source=c.field(payload, "source"),
             skill_hash=c.file_hash(skill) if skill else None,
             method_hash=c.file_hash(method) if method else None,
             skill_found=bool(skill), base_sha=state["base_sha"], task=state["task"],
             lessons=c.lessons_enabled(), lessons_injected=state["lessons_injected"])
    ctx = ["Golden Path is active in this repository. Follow the golden-path skill "
           "(Understand -> Bound -> Engineer -> Prove -> Report).",
           "A stop gate runs the repository checks when you finish; you cannot stop while they are red.",
           "Do not delete, skip or weaken existing tests; add new tests instead."]
    if lessons:
        ctx.append("Learned regression tests (lessons) from earlier tasks; respect them:")
        ctx += [f"- {l['id']}: {l['summary'] or l['path']}" for l in lessons]
    c.emit({"additionalContext": "\n".join(ctx)})


if __name__ == "__main__":
    main()
