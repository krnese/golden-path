import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import Ajv2020 from 'ajv/dist/2020.js';

const schema = JSON.parse(readFileSync(new URL('../contracts/delivery.schema.json', import.meta.url), 'utf8'));
const ajv = new Ajv2020({ allErrors: true });
ajv.addSchema(schema);
const validateGateInput = ajv.getSchema(schema.$id);
const authorityRank = { WRITE: 1, HIGH_IMPACT_WRITE: 2 };

function validationErrors(validate) {
  return (validate.errors ?? []).map(error => `schema${error.instancePath}: ${error.message}`);
}

export function validateDeliveryRecord(kind, value) {
  if (!Object.hasOwn(schema.$defs, kind)) return { valid: false, errors: [`Unknown delivery record kind: ${kind}`] };
  const id = `${schema.$id}#/$defs/${kind}`;
  const validate = ajv.getSchema(id) ?? ajv.compile({ $ref: id });
  const valid = validate(value);
  return { valid, errors: valid ? [] : validationErrors(validate) };
}

export function evaluateDeliveryGate(input) {
  if (!validateGateInput(input)) return { decision: 'deny', reasons: validationErrors(validateGateInput) };

  const { request, candidate, plan, authorization, adapter, executionRequest } = input;
  const reasons = new Set();
  const requireEqual = (actual, expected, reason) => {
    if (!isDeepStrictEqual(actual, expected)) reasons.add(reason);
  };

  requireEqual(request.candidateDigest, candidate.digest, 'request-candidate-mismatch');
  requireEqual(plan.candidateDigest, candidate.digest, 'plan-candidate-mismatch');
  requireEqual(authorization.candidateDigest, candidate.digest, 'authorization-candidate-mismatch');
  requireEqual(executionRequest.candidateDigest, candidate.digest, 'execution-candidate-mismatch');
  requireEqual(authorization.planHash, plan.planHash, 'authorization-plan-mismatch');
  requireEqual(executionRequest.planHash, plan.planHash, 'execution-plan-mismatch');
  requireEqual(authorization.principal, request.requestingPrincipal, 'principal-mismatch');

  for (const [value, reason] of [
    [plan.operation, 'request-plan-operation-mismatch'],
    [authorization.operation, 'request-authorization-operation-mismatch'],
    [executionRequest.operation, 'request-execution-operation-mismatch']
  ]) requireEqual(value, request.operation, reason);

  for (const [value, reason] of [
    [plan.target, 'request-plan-target-mismatch'],
    [authorization.target, 'request-authorization-target-mismatch'],
    [executionRequest.target, 'request-execution-target-mismatch']
  ]) requireEqual(value, request.target, reason);

  requireEqual(executionRequest.authorizationDecisionId, authorization.decisionId, 'authorization-decision-mismatch');
  requireEqual(executionRequest.adapterId, adapter.adapterId, 'adapter-mismatch');

  if (authorization.decision !== 'allow') reasons.add('authorization-denied');
  if (authorization.revoked) reasons.add('authorization-revoked');
  const now = Date.parse(input.currentTime);
  const issuedAt = Date.parse(authorization.issuedAt);
  const expiresAt = Date.parse(authorization.expiresAt);
  if (![now, issuedAt, expiresAt].every(Number.isFinite)) reasons.add('invalid-authorization-time');
  else {
    if (now < issuedAt) reasons.add('authorization-not-yet-valid');
    if (now >= expiresAt) reasons.add('authorization-expired');
    if (issuedAt >= expiresAt) reasons.add('invalid-authorization-window');
  }

  const requiredAuthority = plan.effectAssessment.requiredAuthority;
  if (authorityRank[authorization.authorizedAuthority] < authorityRank[requiredAuthority]) reasons.add('authorization-authority-insufficient');
  if (authorityRank[adapter.authorityCeiling] < authorityRank[requiredAuthority]) reasons.add('adapter-authority-ceiling-exceeded');
  if (requiredAuthority === 'HIGH_IMPACT_WRITE' && authorization.requiredApproval === 'none') reasons.add('high-impact-approval-missing');
  if (authorization.requiredApproval !== 'none' && !authorization.approvalEvidenceRef) reasons.add('approval-evidence-missing');
  if (!adapter.supportedTargetTypes.includes(request.target.type)) reasons.add('adapter-target-unsupported');
  if (!adapter.supportedOperations.includes(request.operation)) reasons.add('adapter-operation-unsupported');
  if (plan.unresolvedValues.length) reasons.add('plan-has-unresolved-values');

  if (reasons.size) return { decision: 'deny', reasons: [...reasons].sort() };
  return {
    decision: 'allow',
    reasons: [],
    boundPlanHash: plan.planHash,
    boundTarget: request.target,
    requiredAuthority,
    adapterId: adapter.adapterId,
    idempotencyKey: executionRequest.idempotencyKey
  };
}
