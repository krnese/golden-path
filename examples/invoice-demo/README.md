# Demo adopter repo: invoice calculator

A tiny stdlib Python app that uses the Golden Path kit **the way an adopter would**. The kit is installed
by `plugin/install.mjs`, never copied by hand. This is a demonstration fixture, not evidence. The app is
Python; the kit's hook script is Node.js.

- `acceptance/EXAMPLES.md`: business examples written by the (fictional) acceptance owner, *Finance: Ingrid Berg*.
- `acceptance/test_acceptance.py`: the protected acceptance tests built from those examples, one class per
  increment. The owner enables increments in the acceptance command (`acceptance.test_acceptance.T01`).
- `invoice.py`, `tests/`: the app and the developer's own tests.
- `tasks/T01..T05.md`: frozen tasks. `FREEZE.sha256` pins the tasks and the acceptance files.
- `simulator/refusal_scenario.mjs`: a **scripted** run of "the agent tries to edit a protected test and is refused".

Create a runnable copy (a separate git repo, so `.github/hooks` load at its root). Needs Node.js 22+, Python 3, git, bash:

    examples/make-demo.sh ~/golden-path-demo
    cd ~/golden-path-demo && node simulator/refusal_scenario.mjs
