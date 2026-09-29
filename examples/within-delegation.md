# Example: within delegation

Illustrative scenario, not an executed trial or evidence of reliable behavior.

## Request and existing agreement

"Reduce memory use in our invoice export."

The existing issue and tests require every eligible invoice exactly once, exact
integer-cent totals, deterministic output and unchanged input files. The job has
read access to its input and uses its existing output channel. Local code and
test changes are delegated; normal PR review and deployment controls still apply.

## Intended behavior

The agent reads the implementation and agreement, then replaces an unnecessary
intermediate copy without changing selection, arithmetic, ordering or effects.
No new service, permission or agent is needed. It adds a regression case and runs
the existing correctness suite and memory measurement against the candidate.

This is **WITHIN DELEGATION**. The agent does not ask for approval merely to choose
the algorithm. It does not merge or deploy unless separately permitted.

## Illustrative completion report

The following assumes the described checks actually passed; it is not a test log:

> Removed an intermediate invoice copy to reduce peak memory. Existing correctness
> tests and the added regression passed for this candidate; the retained benchmark
> output shows lower peak memory on the fixture. Input permissions, external
> effects and accepted behavior are unchanged. Work remained within delegation.
> Production memory improvement is still unproved; normal review and deployment
> checks remain. See the actual test and benchmark results for scope and values.

No new agreement or Golden Path evidence record is created. Tests and operating
measurements remain with their existing owners.
