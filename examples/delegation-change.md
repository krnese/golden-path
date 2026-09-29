# Example: delegation change

Illustrative scenario, not an executed trial or evidence of reliable detection.

## Request and existing agreement

"Remember which invoices were exported so the next run skips them."

The current exporter reads immutable audit snapshots and reports a complete batch.
Its accepted scope is read-only; it has no delegated authority to change the
snapshot or redefine the report as a pending-only worklist.

## Intended behavior

The agent investigates before implementing persistence. It recognizes that the
obvious solution adds a WRITE effect and changes report meaning. It does not
treat a convenient feature request as automatic acceptance of both consequences.

It surfaces **DELEGATION CHANGE**:

- **What changed:** remembering exports requires persistent state; skipping entries
  would turn a complete batch report into a worklist.
- **Why:** the requested behavior needs information retained between runs.
- **Consequence:** modifying the snapshot breaks immutability. A separate receipt
  store preserves the source but still adds write authority and operating duties.
- **Evidence available:** the existing agreement and tests require immutable input
  and complete reporting. No new persistence behavior has been proved.
- **What remains unknown:** whether a worklist is acceptable, who owns stored
  receipts, and what retention and recovery behavior is required.
- **Decision required:** the responsible owner must accept the changed semantics
  and persistence scope, or retain read-only complete reporting.

The agent pauses the expansion. Already permitted investigation can continue.
It does not create speculative infrastructure or claim that this explanation
proves authorization.

If the owner accepts a bounded solution, the agent still needs actual permitted
access and must use existing tests, review, security and delivery controls.
Completion must separate tested behavior from unproved operational benefit.
