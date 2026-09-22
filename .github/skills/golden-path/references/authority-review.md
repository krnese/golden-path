# Authority Review

Load for executable capability, identity, scope, policy or authority changes.
This reference grants no authority. Stop on missing identity, scope or approval.

1. Classify effects as READ, RECOMMEND, PROPOSE, WRITE or HIGH_IMPACT_WRITE.
2. Compare before/after identity, scope and classification. RECOMMEND -> WRITE
   is an architecture/security/governance event, not an implementation detail.
3. Separate discovery -> invocation -> authorization -> approval -> execution
   -> evidence. Tool availability or valid arguments are not permission.
4. For writes require principal, delegated identity, resource/action scope,
   enforcement and fail-closed denial. External execution needs real enforcement
   at its API/resource boundary, not model compliance.
5. Define policy and approval mode/rationale/enforcement. High-impact automated
   approval needs human policy review and explicit justification. Where human
   approval is necessary, bind it to the precise operation and scope.
6. Define dry-run/proposal behavior, idempotency, timeouts, partial failure,
   rollback/compensation, revocation and auditable identity/decision/result.
7. Test unauthorized identity, missing/expired approval, scope escape, replay,
   injected instructions, denied calls and partial failure.
8. Propose a new governing decision for authority-surface changes and declare
   `authorityChanges` with capability, before/after classification and reason.
   Same-classification scope changes still count. Update capability, policy and
   evaluation before execution. Do not invent a separate change registry.

Report authority delta, enforcement, evidence, unresolved risk and review needed.
See [the controls and limits](../../../../docs/golden-path.md).