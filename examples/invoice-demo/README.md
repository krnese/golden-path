# Demo adopter repo: invoice calculator

← [Golden Path README](https://github.com/krnese/golden-path/blob/main/README.md) · [Documentation index](https://github.com/krnese/golden-path/blob/main/README.md#documentation)

A tiny dependency-free Node.js app (ES modules, `node:test`) that uses the Golden Path kit **the way an adopter
would**. The kit is installed by `plugin/install.mjs`, never copied by hand. This is a demonstration fixture, not
evidence. Everything (app, tests, kit hook, demo builder) is Node.js 22+; there is no Python requirement, and it
runs on Windows, macOS and Linux.

- Acceptance ownership is **per increment**, each owner on their own path (all owners are fictional):
  - *Finance: Ingrid Berg* owns T01..T04: `acceptance/EXAMPLES.md` and `acceptance/t01.test.mjs` .. `t04.test.mjs`.
  - *Marketing* owns T05: `acceptance/marketing/EXAMPLES.md` and `acceptance/marketing/t05.test.mjs`.
- The test files are the protected acceptance tests built from those examples, one file per increment. Owners
  enable increments by naming their files in the acceptance command; enabled now: T01
  (`acceptance/t01.test.mjs`) and T05 (`acceptance/marketing/t05.test.mjs`). Both are red until implemented, so
  the stop gate holds the agent to them.
- `make-demo.mjs` protects all of `acceptance/**` and writes a `CODEOWNERS` with one line per owner path. The kit's
  config holds a single `acceptance.owner` string, so per-path owners come from `CODEOWNERS` (used by the
  authorised-revision check); the config string names both owners for the agent-facing messages.
- `invoice.mjs`, `tests/`: the app and the developer's own tests. Money is exact (`Decimal`: a BigInt coefficient
  and a decimal exponent, half-up rounding); JS numbers are refused for money, as Python floats were.
- `tasks/T01..T05.md`: frozen tasks. `FREEZE.sha256` pins the tasks and the acceptance files.
- `simulator/refusal_scenario.mjs`: a **scripted** run of "the agent tries to edit a protected test and is refused".

Create a runnable copy (a separate git repo, so `.github/hooks` load at its root). Needs Node.js 22+ and git
(any OS; on Windows use PowerShell or cmd):

    node examples/make-demo.mjs ~/golden-path-demo
    cd ~/golden-path-demo
    node simulator/refusal_scenario.mjs
    code .

Run the checks yourself: `node --test "tests/**/*.test.mjs"` (developer tests, green) and
`node --test acceptance/t01.test.mjs acceptance/marketing/t05.test.mjs` (acceptance, red until T01 and T05 are
implemented). `examples/make-demo.sh` is a thin bash wrapper around `make-demo.mjs`.
