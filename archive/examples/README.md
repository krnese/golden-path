# Examples

These illustrate the [current method](../METHOD.md), not executed trials or
evidence of reliable behavior.

## Within delegation

"Reduce memory use in our invoice export."

The existing issue and tests require every eligible invoice exactly once, exact
integer-cent totals, deterministic output and unchanged input files. The job has
read access to its input and uses its existing output channel. Local code and
test changes are delegated; normal PR review and deployment controls still apply.

### Intended behavior

The agent reads the implementation and agreement, then replaces an unnecessary
intermediate copy without changing selection, arithmetic, ordering or effects.
No new service, permission or agent is needed. It adds a regression case and runs
the existing correctness suite and memory measurement against the candidate.

This is **WITHIN DELEGATION**. The agent does not ask for approval merely to choose
the algorithm. It does not merge or deploy unless separately permitted.

### Illustrative completion report

The following assumes the described checks actually passed; it is not a test log:

> Removed an intermediate invoice copy to reduce peak memory. Existing correctness
> tests and the added regression passed for this candidate; the retained benchmark
> output shows lower peak memory on the fixture. Input permissions, external
> effects and accepted behavior are unchanged. Work remained within delegation.
> Production memory improvement is still unproved; normal review and deployment
> checks remain. See the actual test and benchmark results for scope and values.

No new agreement or Golden Path evidence record is created. Tests and operating
measurements remain with their existing owners.

## Delegation change

"Remember which invoices were exported so the next run skips them."

The current exporter reads immutable audit snapshots and reports a complete batch.
Its accepted scope is read-only; it has no delegated authority to change the
snapshot or redefine the report as a pending-only worklist.

### Intended behavior

The agent investigates before implementing persistence. It recognizes that the
obvious solution adds a WRITE effect and changes report meaning. A separate
receipt store preserves the source but still adds write authority and operating
duties. The feature request does not automatically accept these consequences.

It surfaces **DELEGATION CHANGE**: remembering exports requires retained state;
skipping entries changes complete reporting into a worklist. Existing guidance
and tests require immutable input and complete reporting; no new persistence
behavior has been proved. The responsible owner must decide whether to accept
changed semantics and persistence scope, including retention and recovery, or
retain read-only complete reporting.

The agent pauses the expansion; permitted investigation can continue. It does
not build speculative infrastructure or claim that its explanation proves
authorization. If a bounded solution is accepted, actual permissions, tests,
review, security and delivery controls still apply. Tested behavior is not proof
of operational benefit.
