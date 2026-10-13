# Demo adopter repo: invoice calculator

A tiny stdlib-only Python app that uses the Golden Path kit **the way an adopter would**: the kit
is installed by `plugin/install.py`, never copied by hand. It is a demonstration fixture, not evidence.

- `acceptance/EXAMPLES.md`: business examples written by the (fictional) acceptance owner, *Finance: Ingrid Berg*.
- `acceptance/test_T0*.py`: the protected acceptance tests built from those examples. The agent can't change them.
  `acceptance/ENABLED` lists the increments the owner has released (initially `T01`).
- `invoice/`, `tests/`: the app and the developer's own tests.
- `tasks/T01..T04.md`: frozen tasks. `FREEZE.sha256` pins the tasks and the acceptance files.
- `simulator/refusal_scenario.py`: a **scripted** run of "the agent tries to edit a protected test and is refused".
- `simulator/sim_agent.py`: a **rigged** stand-in used only by research-tool tests. Not evidence.

Create a runnable copy (a separate git repo, so `.github/hooks` load at its root):

    examples/make-demo.sh ~/golden-path-demo
    cd ~/golden-path-demo && python3 simulator/refusal_scenario.py
