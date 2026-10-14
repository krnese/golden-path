# Demo adopter repo: invoice calculator

A tiny stdlib Python app that uses the Golden Path kit **the way an adopter would**. The kit is installed
by `plugin/install.mjs`, never copied by hand. This is a demonstration fixture, not evidence. The app is
Python; the kit's hook script is Node.js.

- Acceptance ownership is **per increment**, each owner on their own path (all owners are fictional):
  - *Finance: Ingrid Berg* owns T01..T04: `acceptance/EXAMPLES.md` and `acceptance/test_acceptance.py`.
  - *Marketing* owns T05: `acceptance/marketing/EXAMPLES.md` and `acceptance/marketing/test_acceptance.py`.
- The test modules are the protected acceptance tests built from those examples, one class per
  increment. Owners enable increments in the acceptance command; enabled now: T01
  (`acceptance.test_acceptance.T01`) and T05 (`acceptance.marketing.test_acceptance.T05`). Both are red until
  implemented, so the stop gate holds the agent to them.
- `make-demo.sh` protects all of `acceptance/**` and writes a `CODEOWNERS` with one line per owner path. The kit's
  config holds a single `acceptance.owner` string, so per-path owners come from `CODEOWNERS` (used by the
  authorised-revision check); the config string names both owners for the agent-facing messages.
- `invoice.py`, `tests/`: the app and the developer's own tests.
- `tasks/T01..T05.md`: frozen tasks. `FREEZE.sha256` pins the tasks and the acceptance files.
- `simulator/refusal_scenario.mjs`: a **scripted** run of "the agent tries to edit a protected test and is refused".

Create a runnable copy (a separate git repo, so `.github/hooks` load at its root). Needs Node.js 22+, Python 3, git, bash:

    examples/make-demo.sh ~/golden-path-demo
    cd ~/golden-path-demo && node simulator/refusal_scenario.mjs
