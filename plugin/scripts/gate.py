#!/usr/bin/env python3
"""agentStop hook: the stop gate. Blocks while the repository checks are red.

Decision control per https://docs.github.com/en/copilot/reference/hooks-reference
(`agentStop` / `subagentStop` decision control): {"decision":"block","reason":...} forces
another turn with `reason` as the prompt. The CLI overrides after 8 consecutive blocks; this
gate self-limits at config.max_blocks (default 5) and then records `gave_up`.
Every evaluation is appended to the local ledger with HEAD SHA and diff hash (evidence tied
to the exact artifact checked).
"""
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gp_checks  # noqa: E402
import gp_common as c  # noqa: E402


def main():
    payload = c.read_payload()
    root = c.repo_root(c.field(payload, "cwd"))
    cfg = c.load_config(root)
    sid = c.session_id(payload)
    st = c.load_state(root, sid)
    st.setdefault("started", time.time())
    st.setdefault("base_sha", c.head_sha(root))
    st.setdefault("blocks", 0)
    st.setdefault("attempts", 0)
    st["attempts"] += 1
    res = gp_checks.run(root, cfg, base=st["base_sha"] or "HEAD")
    elapsed = round(time.time() - st["started"], 3)
    rec = dict(session=sid, task=st.get("task") or os.environ.get("GOLDEN_PATH_TASK"),
               attempt=st["attempts"], ok=res["ok"], failed=res["failed"],
               failed_tests=res["failed_tests"], elapsed_sec=elapsed,
               head_sha=c.head_sha(root), diff_hash=c.diff_hash(root),
               lessons=c.lessons_enabled(), lessons_injected=st.get("lessons_injected", []),
               stop_hook_active=bool(c.field(payload, "stop_hook_active", "stop_hook_active")))
    out = {}
    if not res["ok"]:
        if st["blocks"] >= int(cfg.get("max_blocks", 5)):
            c.ledger(root, "gave_up", **rec)
            st["blocks"] = 0
        else:
            st["blocks"] += 1
            c.ledger(root, "gate_red", **rec)
            detail = "\n\n".join(f"[{r['name']}]\n{r['output']}" for r in res["results"] if not r["ok"])
            out = {"decision": "block", "reason":
                   f"Golden Path stop gate: checks are RED (attempt {st['attempts']}, "
                   f"block {st['blocks']}/{cfg.get('max_blocks', 5)}). Fix the cause; do not weaken, "
                   f"skip or delete tests.\n\n{detail[:6000]}"}
    else:
        c.ledger(root, "gate_green", **rec)
        st["blocks"] = 0
        red_before = st.get("had_red") and not st.get("learning_asked")
        if red_before and cfg.get("learning_prompt", True):
            st["learning_asked"] = True
            out = {"decision": "block", "reason":
                   "Checks are green. Learning step (one turn, then stop): if a regression test would "
                   "have caught the mistake you just fixed, write it as a NEW file under "
                   f".golden-path/proposals/<short-name>/ named test_<short-name>.<ext> with a first-line "
                   "comment 'Lesson: <one sentence>'. Do not edit existing tests. A human will run "
                   "`golden-path learn validate` and review the diff. If no test would help, say so and stop."}
    if not res["ok"]:
        st["had_red"] = True
    c.save_state(root, sid, st)
    c.emit(out)


if __name__ == "__main__":
    main()
