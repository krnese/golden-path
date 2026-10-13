# Retired: Python research runner (L3 tools)

Retired 13 Oct 2026 by decision of the maintainer (KN). Kept for reference only: not installed, not tested in CI and not supported. It won't run from this location without changes.

**Why it was retired.** The runner reimplemented the gate's evidence logic in Python: ledger semantics, glob matching, acceptance comparison and outcome mapping. That copy drifted from `gate.mjs`. When the gate began recording `gate_red` with `outcome: UNVERIFIED`, the runner kept mapping every `gate_red` to RED, which hid unverified evidence in its summary (PR #13 review, finding 3). Two implementations of the same evidence rules are a standing source of such drift. No approved experiment currently needs the runner.

**What replaces it.** [docs/LEVEL-3-EXPERIMENTS.md](../../docs/LEVEL-3-EXPERIMENTS.md) explains how to run a matched experiment with native tools. Revive this code only for a specific, approved experiment, and first port the evidence rules from the current `gate.mjs` instead of trusting the copy here.

Contents: `research/golden_path_research.py` (A/B, lessons, ledger summary), `research/sim/` (the **rigged** simulator, which tests plumbing and isn't evidence), `tests/` (its unittest suite at retirement: 6 tests passing).
