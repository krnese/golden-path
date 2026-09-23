import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { parseDocument } from 'yaml';
import { artifactPaths, deriveGraph, loadArtifacts, trace, validateArtifacts, inspectRepository, validateTransition } from '../scripts/validate.mjs';

const record = (id, kind, spec) => ({ schemaVersion: 2, id, kind, title: id, spec });

// Git-ignored personal files (for example editor settings) are never committed, so
// they cannot become unreviewed repository state. Customization surfaces that local
// agents may still load are never tolerated, even when ignored.
const localReasoningSurface = /^\.github\/|(^|\/)(AGENTS|CLAUDE|GEMINI)\.md$|\.(instructions|prompt|chatmode)\.md$|\.(mjs|cjs|js|ts|py|ps1|sh)$/;
function reviewableUnbound(root, unbound) {
  const candidates = unbound.filter(path => !localReasoningSurface.test(path));
  if (!candidates.length) return unbound;
  let ignored = [];
  try {
    ignored = execFileSync('git', ['check-ignore', '-z', '--stdin'], { cwd: root, encoding: 'utf8', input: candidates.join('\0') + '\0' }).split('\0').filter(Boolean);
  } catch (error) {
    if (error.status !== 1) throw error;
  }
  return unbound.filter(path => !ignored.includes(path));
}
const spec = (artifacts, id) => artifacts.find(item => item.id === id).spec;
const approval = { reviewer: 'Fixture reviewer', date: '2026-09-22', source: 'Synthetic test', statement: 'Fixture approval only', scope: 'Test only' };

function fixture() {
  return [
    record('out-test', 'outcome', { metric: 'Correct results', target: 'All acceptance cases' }),
    record('wl-test', 'workload', { outcomeId: 'out-test', owner: 'Test owner', stage: 'development', usesAI: false, acceptance: [{ id: 'ac-test', metric: 'Cases passing', target: 'All cases' }] }),
    record('req-test', 'requirement', { workloadId: 'wl-test', acceptanceIds: ['ac-test'], description: 'Return a deterministic result' }),
    record('adr-test', 'decision', {
      requirementIds: ['req-test'], status: 'proposed', unmetRequirement: 'Repeatable correctness', simplestViableOption: 'Deterministic check', selectedOption: 'Deterministic check',
      capabilityGained: 'Repeatable validation', alternatives: ['Manual inspection'], simplerOptionAssessment: 'Selected simplest option is sufficient', operationalResponsibility: 'Maintain tests', rationale: 'No model needed'
    }),
    record('cap-test', 'capability', { decisionId: 'adr-test', executable: true, authority: 'READ', identity: 'Developer', boundary: 'Read repository; stdout only' }),
    record('impl-test', 'implementation', { capabilityIds: ['cap-test'], paths: ['scripts/validate.mjs'], state: 'draft' }),
    record('eval-test', 'evaluation', { requirementIds: ['req-test'], capabilityIds: ['cap-test'], method: 'deterministic', scenarios: ['Valid', 'Invalid'], passCriteria: 'All assertions', procedure: 'npm test' })
  ];
}

function scratch(context) {
  const root = mkdtempSync(join(tmpdir(), 'golden-path-'));
  context.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

function addPolicy(artifacts) {
  artifacts.push(record('pol-test', 'policy', { requirementIds: ['req-test'], rules: ['Authorized scope only'], approval: { mode: 'human', rationale: 'Consequential write', enforcement: 'Approval before execution' }, failureHandling: 'Deny and stop', observability: 'Record principal, decision and result' }));
  Object.assign(spec(artifacts, 'cap-test'), { policyId: 'pol-test', authorization: { principal: 'Operator', scope: 'Test resource', enforcement: 'Boundary gate', deniedBehavior: 'No execution' } });
}

function addEvidence(artifacts, environment = 'development') {
  artifacts.push(record('ev-test', 'evidence', { evaluationId: 'eval-test', subjectRevision: 'synthetic-fixture', recordedAt: '2026-09-22T00:00:00Z', result: 'pass', location: 'https://example.invalid/fixture', environment, observations: 'Synthetic, not real operational proof' }));
}

test('A: deterministic workload needs no AI or agent', () => {
  const artifacts = fixture();
  assert.deepEqual(validateArtifacts(artifacts), []);
  assert.equal(artifacts.some(item => item.kind === 'agent'), false);
});

test('derive inverse and transitive traceability without mirrored authority', () => {
  const artifacts = fixture();
  addEvidence(artifacts);
  const graph = deriveGraph(artifacts);
  assert.deepEqual(graph.workloads('ev-test'), ['wl-test']);
  assert.deepEqual(graph.workloads('impl-test'), ['wl-test']);
  assert.equal(graph.incoming.get('cap-test').filter(edge => edge.from === 'eval-test').length, 1);
  assert.deepEqual(trace(artifacts, 'out-test'), trace(artifacts, 'ev-test'));
  assert.throws(() => trace(artifacts, 'missing-id'), /Unknown artifact/);
  assert.equal('verificationIds' in spec(artifacts, 'cap-test'), false);
  assert.equal('decisionIds' in spec(artifacts, 'impl-test'), false);
});

test('reject mirrored and transitive fields rather than reconcile them', () => {
  for (const [id, field, value] of [
    ['cap-test', 'evaluationIds', ['eval-test']], ['cap-test', 'workloadId', 'wl-test'],
    ['cap-test', 'requirementIds', ['req-test']], ['impl-test', 'decisionIds', ['adr-test']],
    ['eval-test', 'workloadId', 'wl-test'], ['out-test', 'workloadIds', ['wl-test']]
  ]) {
    const artifacts = fixture();
    spec(artifacts, id)[field] = value;
    assert.match(validateArtifacts(artifacts).join('\n'), /additional properties/);
  }
});

test('reject duplicate IDs, missing/wrong-kind references and missing authority', () => {
  const artifacts = fixture();
  spec(artifacts, 'cap-test').decisionId = 'wl-test';
  assert.match(validateArtifacts(artifacts).join('\n'), /invalid reference/);
  artifacts.push(artifacts[0]);
  assert.match(validateArtifacts(artifacts).join('\n'), /duplicate ID/);
  const missing = fixture();
  delete spec(missing, 'cap-test').authority;
  assert.match(validateArtifacts(missing).join('\n'), /authority/);
});

test('proposed decisions cannot authorize active implementation through derived paths', () => {
  const artifacts = fixture();
  spec(artifacts, 'impl-test').state = 'active';
  assert.match(validateArtifacts(artifacts).join('\n'), /I15/);
  Object.assign(spec(artifacts, 'adr-test'), { status: 'approved', approval });
  assert.deepEqual(validateArtifacts(artifacts), []);
  delete spec(artifacts, 'adr-test').approval;
  assert.match(validateArtifacts(artifacts).join('\n'), /I15/);
});

test('B: reasoning and retrieval need behavioral evaluation, not an agent', () => {
  const artifacts = fixture();
  spec(artifacts, 'wl-test').usesAI = true;
  assert.match(validateArtifacts(artifacts).join('\n'), /I7/);
  Object.assign(spec(artifacts, 'eval-test'), { method: 'behavioral', scenarios: ['Grounded answer', 'Missing source', 'Injected retrieval'] });
  assert.deepEqual(validateArtifacts(artifacts), []);
});

test('C: external writes require authorization, identity and policy', () => {
  const artifacts = fixture();
  spec(artifacts, 'cap-test').authority = 'WRITE';
  assert.match(validateArtifacts(artifacts).join('\n'), /I5/);
  addPolicy(artifacts);
  assert.deepEqual(validateArtifacts(artifacts), []);
  delete spec(artifacts, 'cap-test').identity;
  assert.match(validateArtifacts(artifacts).join('\n'), /identity/);
});

test('D: three specialists without earned boundaries are rejected', () => {
  const artifacts = fixture();
  for (const name of ['architect', 'developer', 'tester']) artifacts.push(record(`agent-${name}`, 'agent', { capabilityIds: ['cap-test'], boundary: 'subagent', path: `.github/agents/${name}.agent.md` }));
  assert.equal(validateArtifacts(artifacts).filter(error => error.includes('I11')).length, 3);
});

test('E: evidence-backed bounded concurrency may be proposed', () => {
  const artifacts = fixture();
  spec(artifacts, 'req-test').description = 'Independent investigations must finish within 12 seconds at p95';
  addEvidence(artifacts);
  artifacts.push(record('agent-investigator', 'agent', { capabilityIds: ['cap-test'], boundary: 'subagent', path: '.github/agents/investigator.agent.md', justification: { basis: 'parallelism', requirementId: 'req-test', evidenceIds: ['ev-test'], reason: 'Synthetic latency evidence motivates bounded investigation' } }));
  assert.deepEqual(validateArtifacts(artifacts), []);
  spec(artifacts, 'agent-investigator').justification.evidenceIds = ['ev-missing'];
  assert.match(validateArtifacts(artifacts).join('\n'), /invalid reference/);
});

test('F: RECOMMEND to WRITE requires a new explicit authority decision', () => {
  const before = fixture();
  spec(before, 'cap-test').authority = 'RECOMMEND';
  const after = structuredClone(before);
  spec(after, 'cap-test').authority = 'WRITE';
  addPolicy(after);
  assert.match(validateTransition(before, after).join('\n'), /new governing decision/);
  const decision = structuredClone(after.find(item => item.id === 'adr-test'));
  decision.id = 'adr-authority';
  decision.spec.authorityChanges = [{ capabilityId: 'cap-test', from: 'RECOMMEND', to: 'WRITE', reason: 'Requested scoped remediation' }];
  after.push(decision);
  spec(after, 'cap-test').decisionId = decision.id;
  assert.deepEqual(validateArtifacts(after), []);
  assert.deepEqual(validateTransition(before, after), []);
  spec(after, 'impl-test').state = 'active';
  assert.match(validateTransition(before, after).join('\n'), /approved decision/);
  Object.assign(decision.spec, { status: 'approved', approval });
  assert.deepEqual(validateArtifacts(after), []);
  assert.deepEqual(validateTransition(before, after), []);
});

test('scope and identity changes are consequential even without enum escalation', () => {
  const before = fixture();
  const after = structuredClone(before);
  spec(after, 'cap-test').boundary = 'Read additional sensitive resources';
  assert.match(validateTransition(before, after).join('\n'), /new governing decision/);
});

test('historical authority decisions remain valid without governing current execution', () => {
  const artifacts = fixture();
  const history = structuredClone(artifacts.find(item => item.id === 'adr-test'));
  history.id = 'adr-history';
  Object.assign(history.spec, { status: 'superseded', authorityChanges: [{ capabilityId: 'cap-test', from: 'RECOMMEND', to: 'WRITE', reason: 'Historical scope, no longer governing' }] });
  artifacts.push(history);
  assert.deepEqual(validateArtifacts(artifacts), []);
  spec(artifacts, 'cap-test').decisionId = history.id;
  assert.match(validateArtifacts(artifacts).join('\n'), /current authority declaration/);
});

test('high-impact authority cannot omit approval control', () => {
  const artifacts = fixture();
  spec(artifacts, 'cap-test').authority = 'HIGH_IMPACT_WRITE';
  addPolicy(artifacts);
  spec(artifacts, 'pol-test').approval.mode = 'none';
  assert.match(validateArtifacts(artifacts).join('\n'), /I6/);
});

test('production signal and evidence scope are owned only by evaluation and evidence', () => {
  const artifacts = fixture();
  spec(artifacts, 'wl-test').stage = 'production';
  assert.match(validateArtifacts(artifacts).join('\n'), /I8/);
  spec(artifacts, 'impl-test').state = 'active';
  Object.assign(spec(artifacts, 'adr-test'), { status: 'approved', approval });
  Object.assign(spec(artifacts, 'eval-test'), { method: 'operational', operational: { signal: 'Correct outcome rate', owner: 'Operator', retention: '30 days' } });
  addEvidence(artifacts, 'production');
  assert.deepEqual(validateArtifacts(artifacts), []);
  assert.deepEqual(deriveGraph(artifacts).workloads('ev-test'), ['wl-test']);
  spec(artifacts, 'eval-test').method = 'deterministic';
  assert.match(validateArtifacts(artifacts).join('\n'), /I12/);
});

test('criteria and requirements require derived evaluation coverage', () => {
  const artifacts = fixture();
  artifacts.splice(artifacts.findIndex(item => item.id === 'eval-test'), 1);
  assert.match(validateArtifacts(artifacts).join('\n'), /I2/);
  const duplicate = fixture();
  spec(duplicate, 'wl-test').acceptance.push(spec(duplicate, 'wl-test').acceptance[0]);
  assert.match(validateArtifacts(duplicate).join('\n'), /duplicate acceptance/);
});

test('validation and graph derivation do not mutate authoritative input', () => {
  const artifacts = fixture();
  const before = JSON.stringify(artifacts);
  validateArtifacts(artifacts);
  trace(artifacts, 'wl-test');
  assert.equal(JSON.stringify(artifacts), before);
});

test('canonical discovery needs no manifest and enforces filename identity', context => {
  const root = scratch(context);
  mkdirSync(join(root, 'engineering'));
  for (const artifact of fixture()) writeFileSync(join(root, 'engineering', `${artifact.id}.json`), JSON.stringify(artifact));
  assert.deepEqual(validateArtifacts(loadArtifacts(root)), []);
  writeFileSync(join(root, 'engineering/state.json'), JSON.stringify({ records: fixture() }));
  assert.throws(() => loadArtifacts(root), /aggregate ledgers/);
});

test('Git-base discovery reads canonical artifacts without using working-tree state', context => {
  const root = scratch(context);
  execFileSync('git', ['init', '--quiet', root]);
  const git = (args, input) => execFileSync('git', args, { cwd: root, encoding: 'utf8', input }).trim();
  const artifacts = fixture();
  const entries = artifacts.map(artifact => {
    const blob = git(['hash-object', '-w', '--stdin'], JSON.stringify(artifact));
    return `100644 blob ${blob}\t${artifact.id}.json\n`;
  }).sort().join('');
  const engineeringTree = git(['mktree'], entries);
  const rootTree = git(['mktree'], `040000 tree ${engineeringTree}\tengineering\n`);
  const revision = git(['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit-tree', rootTree, '-m', 'Synthetic test snapshot']);
  const previous = loadArtifacts(root, revision);
  assert.deepEqual(validateArtifacts(previous), []);
  const changed = structuredClone(previous);
  spec(changed, 'cap-test').identity = 'Changed principal';
  assert.match(validateTransition(previous, changed).join('\n'), /new governing decision/);
  assert.throws(() => loadArtifacts(root, '--untrusted'), /full Git commit SHA/);
});

test('malformed artifacts and missing branch rationale produce diagnostics', () => {
  assert.match(validateArtifacts([null]).join('\n'), /schema/);
  const artifacts = fixture();
  delete spec(artifacts, 'adr-test').simplerOptionAssessment;
  assert.match(validateArtifacts(artifacts).join('\n'), /simplerOptionAssessment/);
});

test('cross-workload evaluation cannot borrow unrelated capability coverage', () => {
  const artifacts = fixture();
  const second = fixture().filter(item => ['outcome', 'workload', 'requirement'].includes(item.kind));
  for (const artifact of second) artifact.id = artifact.id.replace('-test', '-other');
  second.find(item => item.kind === 'workload').spec.outcomeId = 'out-other';
  second.find(item => item.kind === 'requirement').spec.workloadId = 'wl-other';
  artifacts.push(...second);
  spec(artifacts, 'eval-test').requirementIds = ['req-other'];
  assert.match(validateArtifacts(artifacts).join('\n'), /different workloads/);
});

test('repository inspection reports incidental unbound files and rejects executable drift', context => {
  const root = scratch(context);
  mkdirSync(join(root, 'scripts'));
  writeFileSync(join(root, 'scripts/validate.mjs'), 'export {};');
  const artifacts = fixture();
  assert.deepEqual(inspectRepository(root, artifacts).errors, []);
  writeFileSync(join(root, 'notes.md'), 'Review notes');
  assert.deepEqual(inspectRepository(root, artifacts).unbound, ['notes.md']);
  writeFileSync(join(root, 'surprise-agent.mjs'), 'export {};');
  assert.match(inspectRepository(root, artifacts).errors.join('\n'), /Unbound executable/);
  spec(artifacts, 'impl-test').paths = ['../outside.mjs'];
  assert.match(inspectRepository(root, artifacts).errors.join('\n'), /unsafe repository path/);
});

test('path authority cannot be mirrored by another binding', context => {
  const root = scratch(context);
  mkdirSync(join(root, 'scripts'));
  writeFileSync(join(root, 'scripts/validate.mjs'), 'export {};');
  const artifacts = fixture();
  artifacts.push(record('impl-copy', 'implementation', structuredClone(spec(artifacts, 'impl-test'))));
  assert.match(inspectRepository(root, artifacts).errors.join('\n'), /duplicate path authority/);
});

test('skill discovery cannot grant tools or authority', context => {
  const root = scratch(context);
  mkdirSync(join(root, '.github/skills/test'), { recursive: true });
  const path = '.github/skills/test/SKILL.md';
  writeFileSync(join(root, path), '---\nname: test\ndescription: Test procedure\ntools: [execute]\n---\n');
  const artifacts = [record('skill-test', 'skill', { decisionId: 'adr-test', path, references: [], authority: 'NONE' })];
  assert.match(inspectRepository(root, artifacts).errors.join('\n'), /I9/);
  const invalid = fixture();
  invalid.push(record('skill-test', 'skill', { decisionId: 'adr-test', path, references: ['reference.md'], authority: 'WRITE' }));
  assert.match(validateArtifacts(invalid).join('\n'), /constant/);
});

test('CI retains pinned actions, read-only source permissions and required gates', () => {
  const document = parseDocument(readFileSync(new URL('../.github/workflows/golden-path.yml', import.meta.url), 'utf8'));
  assert.deepEqual(document.errors, []);
  const workflow = document.toJS();
  assert.deepEqual(workflow.permissions, { contents: 'read' });
  assert.equal(Object.hasOwn(workflow.on, 'pull_request_target'), false);
  const steps = workflow.jobs.validate.steps;
  for (const step of steps.filter(step => step.uses)) assert.match(step.uses, /^actions\/[a-z-]+@[a-f0-9]{40}$/);
  assert.equal(steps.find(step => step.uses?.startsWith('actions/checkout@')).with['persist-credentials'], false);
  for (const command of ['npm ci --ignore-scripts', 'npm run validate', 'npm test', 'npm audit --audit-level=moderate']) assert.ok(steps.some(step => step.run === command));
  assert.ok(steps.find(step => step.env?.BASE_SHA).run.includes('npm run validate -- --base "$BASE_SHA"'));
});

test('real bootstrap has one skill, one agent, no ledger and no unbound artifacts', () => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const artifacts = loadArtifacts(root);
  assert.deepEqual(validateArtifacts(artifacts), []);
  const inventory = inspectRepository(root, artifacts);
  assert.deepEqual(inventory.errors, []);
  assert.deepEqual(reviewableUnbound(root, inventory.unbound), []);
  assert.equal(artifacts.filter(item => item.kind === 'skill').length, 1);
  assert.equal(artifacts.filter(item => item.kind === 'agent').length, 1);
  assert.equal(existsSync(join(root, 'engineering/state.json')), false);
  assert.equal(spec(artifacts, 'adr-bootstrap-minimum').status, 'approved');
  const graph = deriveGraph(artifacts);
  for (const artifact of artifacts.filter(item => item.kind !== 'outcome')) assert.deepEqual(graph.workloads(artifact.id), ['wl-engineering']);
});

test('only Git-ignored personal files are tolerated as unbound; ignored reasoning and executable surfaces are not', context => {
  const root = scratch(context);
  execFileSync('git', ['init', '--quiet'], { cwd: root });
  mkdirSync(join(root, '.vscode'));
  mkdirSync(join(root, '.github/instructions'), { recursive: true });
  mkdirSync(join(root, '.github/skills/hidden'), { recursive: true });
  writeFileSync(join(root, '.gitignore'), '/.vscode/settings.json\n/notes.md\n/.github/instructions/\n/.github/skills/hidden/\n/hidden.mjs\n');
  writeFileSync(join(root, '.vscode/settings.json'), '{}');
  writeFileSync(join(root, 'notes.md'), 'Ignored personal notes');
  writeFileSync(join(root, 'draft.md'), 'Untracked but not ignored');
  writeFileSync(join(root, '.github/instructions/local.instructions.md'), 'Ignored local instruction');
  writeFileSync(join(root, '.github/skills/hidden/SKILL.md'), '---\nname: hidden\ndescription: hidden\n---\n');
  writeFileSync(join(root, 'hidden.mjs'), 'export {};');
  const inventory = inspectRepository(root, []);
  assert.deepEqual(reviewableUnbound(root, inventory.unbound).sort(), ['.github/instructions/local.instructions.md', '.github/skills/hidden/SKILL.md', '.gitignore', 'draft.md', 'hidden.mjs']);
  assert.match(inventory.errors.join('\n'), /Unbound executable or reasoning artifact: \.github\/skills\/hidden\/SKILL\.md/);
  assert.match(inventory.errors.join('\n'), /Unbound executable or reasoning artifact: hidden\.mjs/);
});

test('canonical scaffold documentation links resolve without obsolete skill or ledger links', () => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  for (const path of loadArtifacts(root).flatMap(artifactPaths).filter(path => path.endsWith('.md'))) {
    const text = readFileSync(join(root, path), 'utf8');
    for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      const target = match[1].split('#')[0];
      if (!target || /^https?:\/\//.test(target)) continue;
      assert.ok(existsSync(resolve(root, dirname(path), decodeURIComponent(target))), `${path}: unresolved link ${target}`);
    }
  }
});