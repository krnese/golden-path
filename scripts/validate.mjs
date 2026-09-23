import { readFileSync, readdirSync, lstatSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve, posix } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import { parseDocument } from 'yaml';

const schema = JSON.parse(readFileSync(new URL('../contracts/engineering.schema.json', import.meta.url), 'utf8'));
const validateSchema = new Ajv2020({ allErrors: true }).compile(schema);
const referenceKinds = {
  outcomeId: ['outcome'], workloadId: ['workload'], requirementId: ['requirement'], requirementIds: ['requirement'],
  decisionId: ['decision'], capabilityId: ['capability'], capabilityIds: ['capability'], evaluationId: ['evaluation'],
  evidenceIds: ['evidence'], policyId: ['policy']
};

export function references(value, prefix = '') {
  return Object.entries(value).flatMap(([key, child]) => {
    const relation = prefix ? `${prefix}.${key}` : key;
    if (referenceKinds[key]) return (Array.isArray(child) ? child : [child]).map(id => ({ id, kinds: referenceKinds[key], relation }));
    return child && typeof child === 'object' ? references(child, relation) : [];
  });
}

// Framework state lives in engineering/; optional adopter state lives in project/.
// The owning area is derived from the file location and kept off the artifact itself.
export const STATE_AREAS = ['engineering', 'project'];
const stateArea = Symbol('golden-path.stateArea');
export function stateOf(artifact) { return artifact?.[stateArea] ?? 'engineering'; }
export function assignStateArea(artifact, area) {
  if (!STATE_AREAS.includes(area)) throw new Error(`Unknown state area: ${area}`);
  artifact[stateArea] = area;
  return artifact;
}

export function loadArtifacts(root, revision) {
  let paths;
  if (revision) {
    if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error('Base revision must be a full Git commit SHA');
    execFileSync('git', ['cat-file', '-e', `${revision}^{commit}`], { cwd: root });
    paths = execFileSync('git', ['ls-tree', '-r', '-z', '--name-only', revision, '--', ...STATE_AREAS.map(area => `${area}/`)], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
  } else {
    paths = STATE_AREAS.flatMap(area => {
      const directory = resolve(root, area);
      if (area === 'project' && !existsSync(directory)) return [];
      const status = lstatSync(directory);
      if (status.isSymbolicLink() || !status.isDirectory()) throw new Error(`${area}/ must be a regular directory`);
      return readdirSync(directory, { withFileTypes: true }).map(entry => {
        if (!entry.isFile()) throw new Error(`Engineering artifacts must be regular files: ${area}/${entry.name}`);
        return `${area}/${entry.name}`;
      });
    });
  }
  return paths.sort().map(path => {
    const match = /^(engineering|project)\/[a-z][a-z0-9-]+\.json$/.exec(path);
    if (!match) throw new Error(`Unexpected canonical artifact path: ${path}`);
    const text = revision ? execFileSync('git', ['show', `${revision}:${path}`], { cwd: root, encoding: 'utf8' }) : readFileSync(resolve(root, path), 'utf8');
    const artifact = JSON.parse(text);
    if (path !== `${match[1]}/${artifact.id}.json`) throw new Error(`${path}: filename must match stable artifact ID; aggregate ledgers are not supported`);
    return assignStateArea(artifact, match[1]);
  });
}

export function deriveGraph(artifacts) {
  const byId = new Map(artifacts.map(artifact => [artifact.id, artifact]));
  const edges = artifacts.flatMap(artifact => references(artifact.spec).map(reference => ({ from: artifact.id, to: reference.id, relation: reference.relation })));
  const incoming = new Map(artifacts.map(artifact => [artifact.id, edges.filter(edge => edge.to === artifact.id)]));
  function workloads(id) {
    const artifact = byId.get(id);
    if (!artifact) throw new Error(`Unknown artifact: ${id}`);
    const spec = artifact.spec;
    if (artifact.kind === 'workload') return [id];
    const parents = {
      outcome: [], requirement: [spec.workloadId], decision: spec.requirementIds, capability: [spec.decisionId],
      implementation: spec.capabilityIds, evaluation: spec.requirementIds, evidence: [spec.evaluationId],
      policy: spec.requirementIds, agent: spec.capabilityIds, skill: [spec.decisionId]
    }[artifact.kind];
    return [...new Set(parents.flatMap(parent => workloads(parent)))].sort();
  }
  return { byId, edges, incoming, workloads };
}

export function validateArtifacts(artifacts) {
  if (!Array.isArray(artifacts) || !artifacts.length) return ['At least one canonical engineering artifact is required'];
  const errors = [];
  const byId = new Map();
  const fail = (artifact, message) => errors.push(`${artifact.id}: ${message}`);
  for (const artifact of artifacts) {
    if (!validateSchema(artifact)) {
      errors.push(...validateSchema.errors.map(error => `${artifact?.id ?? '(unknown)'} schema ${error.instancePath}: ${error.message} ${JSON.stringify(error.params)}`));
      continue;
    }
    if (byId.has(artifact.id)) fail(artifact, 'duplicate ID');
    byId.set(artifact.id, artifact);
  }
  if (errors.length) return errors;
  for (const artifact of artifacts) {
    if (stateOf(artifact) === 'project' && ['agent', 'skill'].includes(artifact.kind)) fail(artifact, `project/ cannot contain ${artifact.kind} artifacts in V0.1; these kinds describe Golden Path engineering-environment customizations`);
    for (const reference of references(artifact.spec)) {
      const target = byId.get(reference.id);
      if (!reference.kinds.includes(target?.kind)) fail(artifact, `invalid reference ${reference.id}; expected ${reference.kinds.join('/')}`);
      else if (stateOf(target) !== stateOf(artifact)) fail(artifact, `cross-boundary reference ${reference.id}: V0.1 allows no authoritative graph edges between engineering/ and project/`);
    }
  }
  if (errors.length) return errors;
  const graph = deriveGraph(artifacts);
  const ofKind = kind => artifacts.filter(artifact => artifact.kind === kind);
  const get = id => byId.get(id).spec;
  const evaluations = ofKind('evaluation');
  for (const artifact of artifacts) {
    const spec = artifact.spec;
    const workloads = graph.workloads(artifact.id);
    if (artifact.kind !== 'outcome' && workloads.length !== 1) fail(artifact, 'must derive exactly one workload; split cross-workload responsibilities');
    if (artifact.kind === 'outcome' && !ofKind('workload').some(item => item.spec.outcomeId === artifact.id)) fail(artifact, 'outcome has no workload');
    if (artifact.kind === 'workload') {
      const criteria = new Set();
      for (const criterion of spec.acceptance) {
        if (criteria.has(criterion.id)) fail(artifact, `duplicate acceptance ID ${criterion.id}`);
        criteria.add(criterion.id);
        const requirements = ofKind('requirement').filter(item => item.spec.workloadId === artifact.id && item.spec.acceptanceIds.includes(criterion.id));
        if (!requirements.some(item => evaluations.some(evaluation => evaluation.spec.requirementIds.includes(item.id)))) fail(artifact, `I2 criterion ${criterion.id} needs a requirement and evaluation`);
      }
      const ownEvaluations = evaluations.filter(item => graph.workloads(item.id).includes(artifact.id));
      if (spec.usesAI && !ownEvaluations.some(item => item.spec.method === 'behavioral')) fail(artifact, 'I7 AI workload needs behavioral evaluations');
      if (spec.stage === 'production' && !ownEvaluations.some(item => item.spec.method === 'operational')) fail(artifact, 'I8 production workload needs operational evidence requirements');
    }
    if (artifact.kind === 'requirement') {
      if (spec.acceptanceIds.some(id => !get(spec.workloadId).acceptance.some(criterion => criterion.id === id))) fail(artifact, 'I2 requirement references unknown acceptance criteria');
      if (!evaluations.some(item => item.spec.requirementIds.includes(artifact.id))) fail(artifact, 'requirement needs an evaluation');
    }
    if (artifact.kind === 'decision') {
      if (spec.status === 'approved' && !spec.approval) fail(artifact, 'I15 approved decision needs explicit human attribution');
      if (spec.status === 'proposed' && spec.approval) fail(artifact, 'I15 proposal cannot claim approval');
      for (const transition of spec.authorityChanges ?? []) {
        const capability = get(transition.capabilityId);
        if (capability.decisionId === artifact.id && capability.authority !== transition.to) fail(artifact, 'current authority declaration must match the governed capability');
      }
    }
    if (artifact.kind === 'capability') {
      if (!evaluations.some(item => item.spec.capabilityIds.includes(artifact.id))) fail(artifact, 'capability needs evaluation coverage derived from evaluations');
      if (['WRITE', 'HIGH_IMPACT_WRITE'].includes(spec.authority) && (!spec.authorization || !spec.policyId)) fail(artifact, 'I5 writes need authorization and policy');
      if (spec.policyId && !get(spec.policyId).requirementIds.some(id => get(spec.decisionId).requirementIds.includes(id))) fail(artifact, 'policy must address a governing requirement');
      if (spec.authority === 'HIGH_IMPACT_WRITE' && spec.policyId && get(spec.policyId).approval.mode === 'none') fail(artifact, 'I6 high-impact writes cannot omit approval control');
    }
    if (artifact.kind === 'implementation' || artifact.kind === 'agent') {
      const decisions = spec.capabilityIds.map(id => get(get(id).decisionId));
      if (artifact.kind === 'implementation' && spec.state === 'active' && decisions.some(decision => decision.status !== 'approved')) fail(artifact, 'I15 active implementation requires approved derived decisions');
      if (artifact.kind === 'implementation' && spec.state === 'draft' && workloads.some(id => get(id).stage === 'production')) fail(artifact, 'production implementation cannot remain draft');
    }
    if (artifact.kind === 'agent' && spec.boundary !== 'primary') {
      if (!spec.justification) fail(artifact, 'I11 extra agent boundary needs requirement and evidence justification');
      else if (!workloads.includes(get(spec.justification.requirementId).workloadId)) fail(artifact, 'I11 justification belongs to another workload');
    }
    if (artifact.kind === 'evaluation') {
      for (const id of spec.capabilityIds) {
        if (graph.workloads(id).join() !== workloads.join()) fail(artifact, 'evaluation and capability belong to different workloads');
        if (!spec.requirementIds.some(requirementId => get(get(id).decisionId).requirementIds.includes(requirementId))) fail(artifact, 'evaluation must test a requirement governing its capability');
      }
      if (spec.method === 'operational' && !spec.operational) fail(artifact, 'I8 operational evaluation needs signal, owner and retention');
      if (spec.method !== 'operational' && spec.operational) fail(artifact, 'operational metadata belongs only on operational evaluations');
    }
    if (artifact.kind === 'evidence') {
      if (spec.environment === 'production' && get(spec.evaluationId).method !== 'operational') fail(artifact, 'I12 production evidence must reference an operational evaluation');
      if (Number.isNaN(Date.parse(spec.recordedAt))) fail(artifact, 'invalid evidence timestamp');
      const locationError = evidenceLocationError(spec.location);
      if (locationError) fail(artifact, `I18 evidence location ${locationError}`);
    }
  }
  if (ofKind('agent').filter(artifact => artifact.spec.boundary === 'primary').length > 1) errors.push('I11 only one primary boundary; additional boundaries need justification');
  return errors;
}

export function validateTransition(previous, current) {
  const errors = [];
  const currentById = new Map(current.map(artifact => [artifact.id, artifact]));
  for (const before of previous.filter(artifact => artifact.kind === 'capability')) {
    const after = currentById.get(before.id);
    if (!after || after.kind !== 'capability') continue;
    const surface = artifact => JSON.stringify(['authority', 'identity', 'boundary', 'authorization', 'policyId'].map(key => artifact.spec[key]));
    if (surface(before) === surface(after)) continue;
    const decision = currentById.get(after.spec.decisionId);
    const declared = decision?.spec.authorityChanges?.some(change => change.capabilityId === after.id && change.from === before.spec.authority && change.to === after.spec.authority);
    if (!declared || after.spec.decisionId === before.spec.decisionId) errors.push(`${after.id}: authority change needs a new governing decision with explicit before/after classification and reason`);
    const active = current.some(artifact => artifact.kind === 'implementation' && artifact.spec.state === 'active' && artifact.spec.capabilityIds.includes(after.id));
    if (active && decision?.spec.status !== 'approved') errors.push(`${after.id}: active authority change needs approved decision`);
  }
  return errors;
}

export function artifactPaths(artifact) {
  if (artifact.kind === 'implementation') return artifact.spec.paths;
  if (artifact.kind === 'agent') return [artifact.spec.path];
  if (artifact.kind === 'skill') return [artifact.spec.path, ...artifact.spec.references];
  return [];
}

const EXCLUDED_ROOTS = new Set(['.git', 'node_modules', '.local', 'coverage']);

// I18: reject only evidence locations that provably cannot be retrieved by another
// participant. Anything the validator cannot resolve is reported, never verified.
export function evidenceLocationError(location) {
  const text = location.trim();
  if (/^[A-Za-z]:[\\/]/.test(text) || /^[\\/]/.test(text) || /^~([\\/]|$)/.test(text) || /^file:/i.test(text)) return 'is machine-local and cannot be retrieved by another participant';
  const segments = text.replace(/\\/g, '/').replace(/^(\.\/)+/, '').split('/');
  if (segments.includes('..')) return 'points outside the repository';
  if (segments.length > 1 && EXCLUDED_ROOTS.has(segments[0])) return `points into the ignored ${segments[0]}/ area`;
  return null;
}

function repositoryPath(location) {
  const path = location.trim().replace(/^(\.\/)+/, '');
  if (!path || path.includes('\\') || path.includes(':') || posix.isAbsolute(path) || path.split('/').some(part => !part || part === '.' || part === '..')) return null;
  return path;
}

export function summarizeEvidence(artifacts, inventory) {
  const covered = new Set(artifacts.filter(artifact => artifact.kind === 'evidence').map(artifact => artifact.spec.evaluationId));
  return {
    verified: inventory.evidence.verified.length,
    external: inventory.evidence.external.length,
    unproven: artifacts.filter(artifact => artifact.kind === 'evaluation' && !covered.has(artifact.id)).map(artifact => artifact.id)
  };
}

export function inspectRepository(root, artifacts) {
  const errors = [];
  const unbound = [];
  const owners = new Map();
  const directories = new Map();
  const ignored = EXCLUDED_ROOTS;
  for (const artifact of artifacts) {
    for (const binding of artifactPaths(artifact)) {
      // A trailing slash binds a whole implementation directory (project implementations only).
      const isDirectory = binding.endsWith('/');
      const path = isDirectory ? binding.slice(0, -1) : binding;
      if (path.includes('\\') || path.includes(':') || posix.isAbsolute(path) || path.split('/').some(part => !part || part === '.' || part === '..')) {
        errors.push(`${artifact.id}: unsafe repository path ${binding}`);
        continue;
      }
      if (isDirectory) {
        if (artifact.kind !== 'implementation' || stateOf(artifact) !== 'project') { errors.push(`${artifact.id}: ${binding}: only project implementations may bind a directory`); continue; }
        const top = path.split('/')[0];
        if (ignored.has(top) || top === '.github' || STATE_AREAS.includes(top)) { errors.push(`${artifact.id}: ${binding}: cannot bind an excluded, customization or canonical state directory`); continue; }
      }
      if (owners.has(path) || directories.has(path)) errors.push(`${binding}: duplicate path authority in ${owners.get(path) ?? directories.get(path)} and ${artifact.id}`);
      (isDirectory ? directories : owners).set(path, artifact.id);
      try {
        for (let count = 1; count <= path.split('/').length; count++) {
          if (lstatSync(resolve(root, ...path.split('/').slice(0, count))).isSymbolicLink()) throw new Error('symbolic links are not authoritative artifacts');
        }
        if (isDirectory) {
          if (!lstatSync(resolve(root, path)).isDirectory()) throw new Error('must identify a directory');
          continue;
        }
        if (!lstatSync(resolve(root, path)).isFile()) throw new Error('must identify a file');
        if (['agent', 'skill'].includes(artifact.kind) && path === artifact.spec.path) {
          const content = readFileSync(resolve(root, path), 'utf8');
          const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(content);
          if (!match) throw new Error('missing YAML frontmatter');
          const document = parseDocument(match[1]);
          if (document.errors.length) throw new Error(document.errors.map(error => error.message).join('; '));
          const metadata = document.toJS();
          if (typeof metadata?.description !== 'string' || !metadata.description.trim()) throw new Error('missing discovery description');
          if (artifact.kind === 'skill') {
            if (!/^\.github\/skills\/[a-z0-9-]+\/SKILL\.md$/.test(path) || metadata.name !== path.split('/')[2]) throw new Error('skill name must match discovery directory');
            if (Object.keys(metadata).some(key => !['name', 'description', 'argument-hint', 'user-invocable', 'disable-model-invocation'].includes(key))) throw new Error('I9 skill metadata cannot grant tools or authority');
          } else {
            if (!/^\.github\/agents\/[a-z0-9-]+\.agent\.md$/.test(path)) throw new Error('invalid agent discovery path');
            if (!Array.isArray(metadata.tools) || metadata.tools.some(tool => !['read', 'search', 'edit', 'execute', 'todo', 'agent'].includes(tool))) throw new Error('agent needs explicit supported tool list');
            if (!artifacts.some(item => item.kind === 'agent' && item.spec.boundary !== 'primary') && (!Array.isArray(metadata.agents) || metadata.agents.length || metadata.tools.includes('agent'))) throw new Error('I10 bootstrap delegation must be disabled');
          }
        }
      } catch (error) { errors.push(`${artifact.id}: ${binding}: ${error.message}`); }
    }
  }
  // An existing regular repository file is repository-verified evidence owned by that
  // evidence artifact; every other valid location is external and unverified.
  const evidence = { verified: [], external: [] };
  for (const artifact of artifacts.filter(item => item.kind === 'evidence')) {
    if (evidenceLocationError(artifact.spec.location)) continue;
    const path = repositoryPath(artifact.spec.location);
    const segments = path ? path.split('/') : [];
    const statuses = [];
    for (let count = 1; count <= segments.length; count++) {
      try { statuses.push(lstatSync(resolve(root, ...segments.slice(0, count)))); } catch { break; }
    }
    if (!path || statuses.length < segments.length) { evidence.external.push(artifact.id); continue; }
    const reject = message => errors.push(`${artifact.id}: ${path}: I18 ${message}`);
    if (statuses.some(status => status.isSymbolicLink())) reject('repository evidence cannot be a symbolic link');
    else if (!statuses.at(-1).isFile()) reject('repository evidence must be a regular file');
    else if (STATE_AREAS.includes(segments[0])) reject('a canonical artifact cannot be its own evidence');
    else if (owners.has(path)) reject(`duplicate path authority with ${owners.get(path)}`);
    else { owners.set(path, artifact.id); evidence.verified.push(artifact.id); }
  }
  const boundDirectory = path => [...directories.keys()].find(directory => path.startsWith(`${directory}/`));
  for (const [directory, id] of directories) {
    const nested = boundDirectory(directory);
    if (nested) errors.push(`${directory}/: overlapping path authority in ${directories.get(nested)} and ${id}`);
  }
  for (const [path, id] of owners) {
    const directory = boundDirectory(path);
    if (directory) errors.push(`${path}: overlapping path authority in ${directories.get(directory)} and ${id}`);
  }
  const canonical = new Set(artifacts.map(artifact => `${stateOf(artifact)}/${artifact.id}.json`));
  function walk(directory = '') {
    for (const entry of readdirSync(resolve(root, directory), { withFileTypes: true })) {
      if (!directory && ignored.has(entry.name)) continue;
      const path = directory ? `${directory}/${entry.name}` : entry.name;
      if (entry.isSymbolicLink()) { errors.push(`Unreviewed symbolic link: ${path}`); continue; }
      if (entry.isDirectory()) walk(path);
      else if (!owners.has(path) && !canonical.has(path) && !boundDirectory(path)) {
        unbound.push(path);
        if (/\.(mjs|cjs|js|ts|py|ps1|sh)$/.test(path) || path.startsWith('.github/workflows/') || entry.name === 'SKILL.md' || entry.name.endsWith('.agent.md')) errors.push(`Unbound executable or reasoning artifact: ${path}`);
      }
    }
  }
  walk();
  if (existsSync(resolve(root, 'engineering/state.json'))) errors.push('Centralized authoritative ledger must not coexist with canonical artifacts');
  return { errors, unbound, owners, evidence };
}

export function trace(artifacts, startId) {
  const graph = deriveGraph(artifacts);
  if (!graph.byId.has(startId)) throw new Error(`Unknown artifact: ${startId}`);
  const visited = new Set([startId]);
  const pending = [startId];
  while (pending.length) {
    const current = pending.shift();
    for (const edge of graph.edges) {
      const neighbor = edge.from === current ? edge.to : edge.to === current ? edge.from : undefined;
      if (neighbor && !visited.has(neighbor)) { visited.add(neighbor); pending.push(neighbor); }
    }
  }
  return graph.edges.filter(edge => visited.has(edge.from) && visited.has(edge.to));
}

function main() {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const [mode, argument, ...extra] = process.argv.slice(2);
  if (extra.length || (mode && !['--trace', '--base'].includes(mode)) || (mode && !argument)) throw new Error('Usage: npm run validate [-- --base <sha> | --trace <id>]');
  const artifacts = loadArtifacts(root);
  const errors = validateArtifacts(artifacts);
  if (errors.length) throw new Error(errors.join('\n'));
  const inventory = inspectRepository(root, artifacts);
  errors.push(...inventory.errors);
  if (mode === '--base') {
    const previous = loadArtifacts(root, argument);
    if (previous.length) {
      const baseErrors = validateArtifacts(previous);
      if (baseErrors.length) throw new Error(`Base artifacts invalid; explicit migration review required:\n${baseErrors.join('\n')}`);
      errors.push(...validateTransition(previous, artifacts));
    } else console.log('Bootstrap baseline: no canonical artifacts at base commit.');
  }
  if (errors.length) throw new Error(errors.join('\n'));
  if (mode === '--trace') {
    for (const edge of trace(artifacts, argument)) console.log(`${edge.from} --${edge.relation}--> ${edge.to}`);
  } else {
    const projectCount = artifacts.filter(artifact => stateOf(artifact) === 'project').length;
    console.log(`Validated ${artifacts.length} canonical artifacts (${artifacts.length - projectCount} framework in engineering/, ${projectCount} project in project/) and ${deriveGraph(artifacts).edges.length} single-owner references.`);
    if (!projectCount) console.log('Project state: none. No adopter outcome has been established in project/ yet.');
    console.log(`Unbound repository files: ${inventory.unbound.length}${inventory.unbound.length ? `\n${inventory.unbound.join('\n')}` : ''}`);
    const evidence = summarizeEvidence(artifacts, inventory);
    console.log(`Evidence: ${evidence.verified} repository-verified, ${evidence.external} external (retrievability unverified); ${evidence.unproven.length} evaluations have no evidence.`);
    console.log('Structural validity is not behavioral proof, authentic approval, or runtime authorization.');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}