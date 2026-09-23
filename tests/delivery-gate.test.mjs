import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateDeliveryGate, validateDeliveryRecord } from '../scripts/delivery-gate.mjs';

const candidateDigest = 'a'.repeat(64);
const planHash = 'b'.repeat(64);
const target = { type: 'synthetic-environment', id: 'fixture-target', environment: 'development' };

function fixture(authority = 'WRITE') {
  const requiredApproval = authority === 'HIGH_IMPACT_WRITE' ? 'human' : 'none';
  return {
    request: {
      contractVersion: 1,
      requestId: 'request-test',
      workloadId: 'wl-test',
      requirementIds: ['req-test'],
      candidateDigest,
      operation: 'deploy',
      target,
      requestingPrincipal: 'fixture-principal',
      completionCriteria: ['Synthetic result is correlated']
    },
    candidate: {
      contractVersion: 1,
      candidateId: 'candidate-test',
      sourceRevision: 'synthetic-revision',
      digest: candidateDigest,
      provenanceRef: 'fixture://provenance',
      verificationRef: 'fixture://candidate-verification'
    },
    plan: {
      contractVersion: 1,
      planId: 'plan-test',
      planHash,
      candidateDigest,
      operation: 'deploy',
      target,
      changes: { creates: ['fixture-resource'], updates: [], replacements: [], deletes: [] },
      effectAssessment: {
        environment: 'development',
        resourceScope: 'isolated',
        reversibility: 'automatic',
        dataConsequence: 'synthetic',
        securityConsequence: 'none',
        blastRadius: 'isolated',
        operationalConsequence: 'bounded',
        requiredAuthority: authority,
        rationale: 'Synthetic contract fixture'
      },
      recoveryStrategy: 'Discard the synthetic fixture',
      unresolvedValues: []
    },
    authorization: {
      contractVersion: 1,
      decisionId: 'authorization-test',
      decision: 'allow',
      principal: 'fixture-principal',
      target,
      operation: 'deploy',
      candidateDigest,
      planHash,
      authorizedAuthority: authority,
      policyRef: 'fixture://policy',
      policyVersion: '1',
      requiredApproval,
      ...(requiredApproval === 'none' ? {} : { approvalEvidenceRef: 'fixture://approval' }),
      enforcementRef: 'fixture://enforcement',
      issuedAt: '2026-09-22T00:00:00Z',
      expiresAt: '2026-09-23T00:00:00Z',
      revoked: false
    },
    adapter: {
      contractVersion: 1,
      adapterId: 'adapter-test',
      version: '1',
      supportedTargetTypes: ['synthetic-environment'],
      supportedOperations: ['deploy'],
      authorityCeiling: authority,
      identityMechanism: 'Synthetic fixture identity',
      enforcement: 'In-memory fixture boundary',
      idempotency: 'Same key returns the same fixture result',
      timeout: 'One second',
      retry: 'No automatic retries',
      partialFailure: 'Return a failed fixture result',
      recovery: 'Discard the fixture',
      evidenceOutputs: ['Synthetic execution result']
    },
    executionRequest: {
      contractVersion: 1,
      executionRequestId: 'execution-request-test',
      candidateDigest,
      planHash,
      authorizationDecisionId: 'authorization-test',
      adapterId: 'adapter-test',
      operation: 'deploy',
      target,
      idempotencyKey: 'fixture-idempotency-key'
    },
    currentTime: '2026-09-22T12:00:00Z'
  };
}

function expectDenied(input, reason) {
  const result = evaluateDeliveryGate(input);
  assert.equal(result.decision, 'deny');
  assert.ok(result.reasons.some(item => item.includes(reason)), result.reasons.join('\n'));
}

test('bounded WRITE with matching synthetic authorization is admitted without effects', () => {
  let adapterCalls = 0;
  const result = evaluateDeliveryGate(fixture());
  assert.equal(result.decision, 'allow');
  assert.equal(adapterCalls, 0);
  assert.equal(result.requiredAuthority, 'WRITE');
  assert.equal(result.boundPlanHash, planHash);
});

test('HIGH_IMPACT_WRITE with approval evidence and a sufficient adapter is admitted', () => {
  const result = evaluateDeliveryGate(fixture('HIGH_IMPACT_WRITE'));
  assert.equal(result.decision, 'allow');
  assert.equal(result.requiredAuthority, 'HIGH_IMPACT_WRITE');
});

test('denied, expired, revoked and not-yet-valid authorization fail closed', () => {
  const denied = fixture();
  denied.authorization.decision = 'deny';
  denied.authorization.denialReason = 'Fixture denial';
  expectDenied(denied, 'authorization-denied');

  const expired = fixture();
  expired.currentTime = expired.authorization.expiresAt;
  expectDenied(expired, 'authorization-expired');

  const revoked = fixture();
  revoked.authorization.revoked = true;
  revoked.authorization.revocationRef = 'fixture://revocation';
  expectDenied(revoked, 'authorization-revoked');

  const early = fixture();
  early.currentTime = '2026-09-21T23:59:59Z';
  expectDenied(early, 'authorization-not-yet-valid');
});

test('missing identity and approval evidence are rejected by the contract schema', () => {
  const missingIdentity = fixture();
  delete missingIdentity.authorization.principal;
  expectDenied(missingIdentity, 'schema');

  const missingApproval = fixture('HIGH_IMPACT_WRITE');
  delete missingApproval.authorization.approvalEvidenceRef;
  expectDenied(missingApproval, 'schema');
});

test('candidate, plan, operation and target mismatches fail closed', () => {
  const candidate = fixture();
  candidate.executionRequest.candidateDigest = 'c'.repeat(64);
  expectDenied(candidate, 'execution-candidate-mismatch');

  const plan = fixture();
  plan.authorization.planHash = 'c'.repeat(64);
  expectDenied(plan, 'authorization-plan-mismatch');

  const operation = fixture();
  operation.authorization.operation = 'delete';
  expectDenied(operation, 'request-authorization-operation-mismatch');

  const mismatchedTarget = fixture();
  mismatchedTarget.executionRequest.target = { ...target, id: 'other-target' };
  expectDenied(mismatchedTarget, 'request-execution-target-mismatch');
});

test('adapter support and authority ceiling constrain admission', () => {
  const unsupportedTarget = fixture();
  unsupportedTarget.adapter.supportedTargetTypes = ['other-environment'];
  expectDenied(unsupportedTarget, 'adapter-target-unsupported');

  const unsupportedOperation = fixture();
  unsupportedOperation.adapter.supportedOperations = ['inspect'];
  expectDenied(unsupportedOperation, 'adapter-operation-unsupported');

  const insufficient = fixture('HIGH_IMPACT_WRITE');
  insufficient.adapter.authorityCeiling = 'WRITE';
  expectDenied(insufficient, 'adapter-authority-ceiling-exceeded');

  const unauthorized = fixture('HIGH_IMPACT_WRITE');
  unauthorized.authorization.authorizedAuthority = 'WRITE';
  expectDenied(unauthorized, 'authorization-authority-insufficient');
});

test('unresolved plans and missing adapter semantics fail closed', () => {
  const unresolved = fixture();
  unresolved.plan.unresolvedValues = ['target credential'];
  expectDenied(unresolved, 'plan-has-unresolved-values');

  const noIdempotency = fixture();
  delete noIdempotency.adapter.idempotency;
  expectDenied(noIdempotency, 'schema');

  const noRecovery = fixture();
  delete noRecovery.adapter.recovery;
  expectDenied(noRecovery, 'schema');
});

test('repeated admission preserves plan and idempotency binding', () => {
  const input = fixture();
  assert.deepEqual(evaluateDeliveryGate(input), evaluateDeliveryGate(input));
});

test('synthetic continuation remains correlated and is not real deployment evidence', () => {
  const input = fixture();
  const admission = evaluateDeliveryGate(input);
  assert.equal(admission.decision, 'allow');

  const syntheticResult = {
    contractVersion: 1,
    executionId: 'execution-test',
    executionRequestId: input.executionRequest.executionRequestId,
    candidateDigest: admission.boundPlanHash === planHash ? candidateDigest : '',
    planHash: admission.boundPlanHash,
    target: admission.boundTarget,
    actualEffects: ['Synthetic fixture only'],
    providerCorrelationRef: 'fixture://execution',
    partialFailures: [],
    state: 'succeeded',
    startedAt: '2026-09-22T12:00:00Z',
    completedAt: '2026-09-22T12:00:01Z'
  };
  assert.deepEqual(validateDeliveryRecord('executionResult', syntheticResult), { valid: true, errors: [] });
  assert.match(syntheticResult.providerCorrelationRef, /^fixture:/);

  const verification = {
    contractVersion: 1,
    verificationId: 'verification-test',
    candidateDigest,
    executionId: syntheticResult.executionId,
    checks: ['Synthetic correlation check'],
    result: 'pass',
    evidenceRefs: ['fixture://verification']
  };
  assert.deepEqual(validateDeliveryRecord('verificationResult', verification), { valid: true, errors: [] });

  const recovery = {
    contractVersion: 1,
    recoveryId: 'recovery-test',
    executionId: syntheticResult.executionId,
    action: 'Discard synthetic fixture',
    authorizationDecisionId: input.authorization.decisionId,
    effects: ['Synthetic fixture discarded'],
    result: 'succeeded',
    remainingRisk: 'No external effects occurred'
  };
  assert.deepEqual(validateDeliveryRecord('recoveryResult', recovery), { valid: true, errors: [] });
});
