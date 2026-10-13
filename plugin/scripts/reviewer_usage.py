#!/usr/bin/env python3
"""subagentStart/subagentStop hook: measure use of the opt-in golden-path-reviewer agent.

subagentStart supports a `matcher` on agentName; subagentStop has no documented matcher, so
this script filters on agentName itself (https://docs.github.com/en/copilot/reference/hooks-reference).
Never blocks: always emits {}.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gp_common as c  # noqa: E402

REVIEWER = "golden-path-reviewer"


def main():
    phase = sys.argv[1] if len(sys.argv) > 1 else "start"
    payload = c.read_payload()
    name = c.field(payload, "agentName", "agent_name", "") or ""
    if name == REVIEWER:
        root = c.repo_root(c.field(payload, "cwd"))
        resp = c.field(payload, "response", "last_assistant_message", "") or ""
        c.ledger(root, "reviewer_" + phase, session=c.session_id(payload),
                 response_chars=len(resp), head_sha=c.head_sha(root))
    c.emit({})


if __name__ == "__main__":
    main()
