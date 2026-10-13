# Demo adopter repo: invoice calculator

A tiny stdlib-only Python app that consumes the Golden Path kit **exactly like an adopter**:
the kit is installed by `plugin/install.py`, never hand-copied. Demonstration fixture, not evidence.

- `invoice/`, `tests/` the app and its own tests (what the stop gate runs)
- `tests/learned/` earned regression tests (lessons), empty at start
- `tasks/T01..T04.md` frozen tasks; `tasks/acceptance/` held-out acceptance tests (removed
  from the agent's worktree by the A/B runner); `tasks/FREEZE.sha256` pins them
- `simulator/` a **rigged** deterministic stand-in for an agent, used only by CI to test the
  plumbing. It is not an agent and its numbers are not evidence.

Create a runnable copy (a separate git repo, so `.github/hooks` load at its root):

    examples/make-demo.sh ~/golden-path-demo
