import assert from 'node:assert/strict';
import { test } from 'node:test';
import { report, triage } from './workbench.mjs';

test('report preserves candidate and passing evidence', () => {
  assert.deepEqual(report([{ project: 'Atlas', candidate: 'a1', passed: 2, failed: 0, label: 'CI' }]),
    [{ project: 'Atlas', candidate: 'a1', passed: 2, label: 'CI' }]);
});
test('project selection excludes unrelated intake', () => {
  const rows = ['Atlas', 'Boreal'].map(project => ({ project, candidate: 'c', passed: 2, failed: 0 }));
  assert.equal(report(rows, 'Atlas').length, 1);
  assert.throws(() => report(rows, 'Unknown'), /No matching/);
});
test('invalid evidence fails visibly', () => {
  assert.throws(() => report([{ project: 'Atlas', candidate: 'a', passed: 2, failed: 1 }]), /Invalid/);
});
test('triage is a separate read-only function', () => {
  assert.equal(triage('triage-cache').owner, 'Dev');
  assert.throws(() => triage('missing'), /Unknown/);
});
