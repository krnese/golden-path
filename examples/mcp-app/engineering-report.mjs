import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import {
  acceptanceChanges, testIntegrity, diffHash, matches, resolveBase,
} from "../../plugin/scripts/gate.mjs";
import { captureSchema, inspectionSchema, sessionIdSchema } from "./engineering-schema.mjs";

const CONFIG = ".golden-path/config.json";
const METHOD = ".github/skills/golden-path/references/METHOD.md";
const MAX_FILE = 2 * 1024 * 1024;
const MAX_ITEMS = 100;
export const evidencePath = (id) => `.local/golden-path-evidence/${sessionIdSchema.parse(id)}.json`;
const statePath = (id) => `.golden-path/state/${sessionIdSchema.parse(id)}.json`;

export function boundFile(root, rel) {
  if (!rel || path.isAbsolute(rel) || rel.includes("\\") || rel.split("/").some((x) => !x || x === "." || x === "..") ||
    rel.split("/").includes(".git")) throw new Error("A repository-relative artifact path is required.");
  const resolved = fs.realpathSync(path.join(root, ...rel.split("/")));
  const inside = path.relative(root, resolved);
  if (inside.startsWith(`..${path.sep}`) || inside === ".." || path.isAbsolute(inside) ||
    inside.split(path.sep).includes(".git")) throw new Error(`Artifact escapes the bound repository: ${rel}`);
  if (!fs.statSync(resolved).isFile()) throw new Error(`Not a file: ${rel}`);
  return resolved;
}
function read(root, rel) {
  const file = boundFile(root, rel);
  if (fs.statSync(file).size > MAX_FILE) throw new Error(`${rel} exceeds the 2 MiB inspection limit.`);
  const bytes = fs.readFileSync(file);
  if (bytes.includes(0)) throw new Error(`${rel} is binary; inspect it in the editor.`);
  return bytes.toString("utf8");
}
const present = (root, rel) => fs.existsSync(path.join(root, ...rel.split("/")));
function git(root, ...args) {
  const result = spawnSync("git", ["--no-pager", "--no-optional-locks", "--literal-pathspecs", ...args], {
    cwd: root, encoding: "utf8", timeout: 10000, maxBuffer: 8 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(`Git inspection unavailable: ${result.error?.message || result.stderr.trim()}`);
  return result.stdout;
}
function record(root, id) {
  const value = JSON.parse(read(root, statePath(id)));
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`Invalid session state: ${id}`);
  if (value.base_sha != null && !/^[a-f0-9]{40,64}$/.test(value.base_sha)) throw new Error(`Invalid session baseline: ${id}`);
  return value;
}
export function sessionRecord(root, id) {
  sessionIdSchema.parse(id);
  return record(root, id);
}
function config(root, findings) {
  if (!present(root, CONFIG)) {
    findings.push({ name: "Golden Path configuration", status: "unavailable",
      output: "No gate configuration is installed. Method-only guidance remains usable; this inspection does not create checks, acceptance or session records. Review a checked installation only when real project checks are available." });
    return { owner: "Not recorded", check: null, acceptanceCommand: null, acceptancePaths: [], protected: [] };
  }
  const cfg = JSON.parse(read(root, CONFIG));
  const acc = cfg.acceptance || {};
  for (const [name, value] of [["acceptance.paths", acc.paths || []], ["protected", cfg.protected || []]]) {
    if (!Array.isArray(value) || value.some((x) => typeof x !== "string")) throw new Error(`Invalid ${name} configuration.`);
  }
  for (const value of [cfg.check, acc.command, acc.owner]) {
    if (value != null && typeof value !== "string") throw new Error("Invalid command or owner configuration.");
  }
  return { owner: acc.owner || "Not recorded", check: cfg.check || null, acceptanceCommand: acc.command || null,
    acceptancePaths: acc.paths || [], protected: cfg.protected || [] };
}
const ids = (text) => [...new Set(text.match(/\b(?:T|E)\d{1,4}\b/g) || [])].slice(0, 30);
export function checkStatus(check) {
  if (check.skipped || check.status === "SKIPPED") return "skipped";
  if (check.unverified || check.timed_out) return "unverified";
  return check.ok === true ? "passed" : check.ok === false ? "failed" : "unavailable";
}
function evidence(root, id, head, hash, base, findings) {
  const source = id ? evidencePath(id) : null;
  const checks = ["check", "acceptance", "test-integrity", "acceptance-integrity"].map((name) => ({
    name, status: "unavailable", output: "No retained per-check result. Inspection does not run commands.",
  }));
  const empty = { source: null, freshness: "unavailable", recordedAt: null, recordedHead: null, outcome: "Unavailable", checks };
  if (!source || !present(root, source)) return empty;
  try {
    const saved = captureSchema.parse(JSON.parse(read(root, source)));
    if (saved.sessionId !== id || path.resolve(saved.root) !== root) throw new Error("Evidence belongs to another repository or session.");
    const current = saved.stable && saved.head === head && !!hash && saved.diffHash === hash && !!base && saved.result.base_sha === base;
    for (const result of saved.result.results) {
      const item = { name: result.name, status: checkStatus(result), output: result.output };
      const at = checks.findIndex((x) => x.name === item.name);
      if (at >= 0) checks[at] = item;
      else checks.push(item);
    }
    return { source, freshness: current ? "current" : "stale", recordedAt: saved.recordedAt,
      recordedHead: saved.head, outcome: saved.result.outcome, checks };
  } catch (error) {
    findings.push({ name: "Retained verification", status: "unavailable", output: error.message });
    return { ...empty, source };
  }
}
function history(root, id, findings) {
  if (!id || !present(root, ".golden-path/ledger.jsonl")) return [];
  try {
    const lines = read(root, ".golden-path/ledger.jsonl").split("\n").filter((x) => x.trim());
    const events = lines.map((line) => JSON.parse(line)).filter((x) => x.session === id &&
      /^(gate_|gave_up$|acceptance_change_attempt$|guard_deny$)/.test(x.event));
    return events.slice(-15).map((x) => ({
      event: x.event, at: new Date(x.ts * 1000).toISOString(),
      detail: [x.outcome, x.note, x.reason, x.requires_owner_review ? `Owner review: ${x.requires_owner_review}` : "",
        x.head_sha ? `Recorded HEAD ${x.head_sha}` : "", x.failed?.length ? `Failed: ${x.failed.join(", ")}` : "",
        x.unverified?.length ? `Unverified: ${x.unverified.join(", ")}` : ""].filter(Boolean).join("\n"),
    }));
  } catch (error) {
    findings.push({ name: "Gate history", status: "unavailable", output: error.message });
    return [];
  }
}
export function handoff(report) {
  const gaps = report.findings.filter((x) => x.status !== "passed");
  return [
    `Golden Path inspection — ${report.session?.id || "no session selected"}`,
    `Observed ${report.inspectedAt}; HEAD ${report.head}; working-tree fingerprint ${report.diffHash || "unavailable"}.`,
    `Comparison baseline: ${report.session?.base || "unavailable"} (${report.session?.baseSource || "not recorded"}). A comparison baseline is not proof of approval.`,
    `Intent/context source: ${report.contract || "unavailable; ask the owner to identify the authoritative request"}.`,
    `Configured acceptance owner: ${report.config.owner}; ${report.acceptance.length} acceptance artifact(s). Owner approval is unverified.`,
    `Changes: ${report.changes.length} displayed; no verified implementation-to-acceptance coverage mapping.`,
    `Agreement-source change signals: ${report.agreementDelta.filter((x) => x.classification === "agreement-source").length}; semantic impact requires owner judgment.`,
    `Local verification: ${report.evidence.outcome}; freshness ${report.evidence.freshness}; source ${report.evidence.source || "unavailable"}.`,
    `Recorded checks: ${report.evidence.checks.map((x) => `${x.name} ${x.status.toUpperCase()}`).join("; ")}.`,
    "Needs attention:",
    ...gaps.slice(0, 8).map((x) => `- ${x.name}: ${x.status.toUpperCase()}.`),
    ...(gaps.length > 8 ? [`- ${gaps.length - 8} further findings; inspect the App before acting.`] : []),
    "Next: re-inspect current artifacts before acting. Continue only already-authorized implementation and validation within the existing boundary. This inspection grants no permission.",
    "If intent, boundaries or acceptance must change, stop the affected work and return the change, reason, consequence, evidence, unknowns and decision needed to the owner. Never modify owner-approved acceptance here.",
    "Missing verification needs an explicit developer-run check, not a presumed pass. Use the PR's actual checks and owner review for handoff. Passing tests is not business correctness, merge or deployment authorization.",
  ].join("\n");
}
export function inspectEngineering(target, { sessionId, file, view = "source" } = {}) {
  const root = fs.realpathSync(target);
  if (path.resolve(git(root, "rev-parse", "--show-toplevel").trim()) !== root) throw new Error("Select the application repository root.");
  const head = git(root, "rev-parse", "HEAD").trim();
  const hash = diffHash(root);
  const findings = [];
  const cfg = config(root, findings);
  const sessions = [];
  if (present(root, ".golden-path/state")) {
    const directory = fs.realpathSync(path.join(root, ".golden-path", "state"));
    if (path.relative(root, directory).startsWith("..")) throw new Error("Session directory escapes the repository.");
    const names = fs.readdirSync(directory).filter((x) => x.endsWith(".json"));
    if (names.length > MAX_ITEMS) findings.push({ name: "Session listing", status: "unverified", output: "Only the first 100 session records are displayed." });
    for (const name of names.slice(0, MAX_ITEMS)) {
      const id = name.slice(0, -5);
      try {
        sessionIdSchema.parse(id);
        const st = record(root, id);
        sessions.push({ id, task: typeof st.task === "string" ? st.task : null, started: Number.isFinite(st.started) ? st.started : null });
      } catch (error) {
        findings.push({ name: `Session ${id}`, status: "unavailable", output: error.message });
      }
    }
  }
  sessions.sort((a, b) => (b.started || 0) - (a.started || 0));
  let session = null;
  let st;
  if (sessionId) {
    st = sessionRecord(root, sessionId);
    session = { id: sessionId, base: st.base_sha || null, baseSource: st.base_source || "Not recorded",
      task: typeof st.task === "string" ? st.task : null, outcome: st.outcome || st.last || "Not recorded" };
  }
  let base = null;
  if (session?.base) {
    const resolved = resolveBase(root, session.base);
    if (resolved.error) findings.push({ name: "Comparison baseline", status: "unverified", output: resolved.error });
    else base = resolved.sha;
  }
  if (!base) findings.push({ name: "Comparison baseline", status: "unavailable", output: "No readable fixed session baseline. No implementation diff or integrity verdict is available." });
  let contract = null, contractText = null;
  if (session?.task) {
    try { contractText = read(root, session.task).slice(0, 3000); contract = session.task; }
    catch (error) { findings.push({ name: "Intent and context", status: "unavailable", output: `Recorded task is not a readable repository document: ${error.message}` }); }
  }
  if (!contract) findings.push({ name: "Engineering contract", status: "unavailable",
    output: "No authoritative intent/context document is linked by this session. Identify it with the owner; do not infer authorization from a branch, diff or method file." });
  findings.push({ name: "Owner-approved acceptance", status: "unverified",
    output: "Configured paths and owner names are not evidence of owner approval. Approval and the latest owner baseline must be checked in the reviewed record." });
  if (!cfg.acceptancePaths.length || !cfg.acceptanceCommand) findings.push({ name: "Acceptance configuration", status: "unavailable",
    output: "Acceptance paths and/or command are not configured. Developer checks and empty integrity comparisons do not prove business acceptance." });
  const tracked = git(root, "ls-files", "-z", "--cached", "--others", "--exclude-standard").split("\0").filter(Boolean);
  const acceptanceFiles = [...new Set(tracked.filter((x) => matches(x, cfg.acceptancePaths)))];
  if (acceptanceFiles.length > MAX_ITEMS) findings.push({ name: "Acceptance listing", status: "unverified", output: "Only the first 100 matching files are displayed." });
  if (cfg.acceptancePaths.length && !acceptanceFiles.length) findings.push({ name: "Acceptance artifacts", status: "unavailable", output: "Configured patterns match no tracked or non-ignored acceptance files." });
  const acceptance = acceptanceFiles.slice(0, MAX_ITEMS).map((rel) => {
    let text = "";
    let provenance;
    try {
      text = read(root, rel);
      provenance = git(root, "log", "-1", "--format=%H", "--", rel).trim() || "Uncommitted artifact";
    } catch (error) {
      provenance = `Unavailable: ${error.message}`;
      findings.push({ name: rel, status: "unavailable", output: error.message });
    }
    return { path: rel, ids: ids(text), status: "unverified", provenance };
  });
  const changes = [];
  if (base) {
    const changed = git(root, "diff", "--no-ext-diff", "--no-textconv", "--name-only", "-z", base, "--").split("\0").filter(Boolean);
    const untracked = git(root, "ls-files", "--others", "--exclude-standard", "-z").split("\0").filter(Boolean);
    const paths = [...new Set([...changed, ...untracked])];
    if (paths.length > MAX_ITEMS) findings.push({ name: "Change listing", status: "unverified", output: "Only the first 100 changed files are displayed." });
    for (const rel of paths.slice(0, MAX_ITEMS)) {
      changes.push({ path: rel, status: untracked.includes(rel) ? "untracked" : present(root, rel) ? "changed" : "deleted",
        kind: matches(rel, cfg.acceptancePaths) ? "acceptance" : matches(rel, cfg.protected) ? "protected developer test" : "implementation / other",
        ids: [] });
    }
    for (const [name, patterns, inspect] of [
      ["Acceptance integrity (current inspection)", cfg.acceptancePaths, acceptanceChanges],
      ["Developer-test integrity (current inspection)", cfg.protected, testIntegrity],
    ]) {
      if (!patterns.length) { findings.push({ name, status: "unavailable", output: "No paths configured; no protection verdict." }); continue; }
      try {
        const protectedFiles = git(root, "ls-tree", "-r", "--name-only", "-z", base).split("\0").filter((rel) => rel && matches(rel, patterns));
        for (const rel of protectedFiles) if (present(root, rel)) boundFile(root, rel);
        const problems = inspect(root, patterns, base);
        findings.push({ name, status: problems.length ? "failed" : "passed",
          output: problems.join("\n") || `No changes flagged relative to ${base}. This is the existing heuristic, not approval or a test run.` });
      } catch (error) { findings.push({ name, status: "unverified", output: error.message }); }
    }
  }
  findings.push({ name: "Delegation and unresolved assumptions", status: "unverified",
    output: "The gate has no semantic delegation-change or assumption detector. Read the contract, diff and owner discussion; absence of a gate finding is not clearance." });
  findings.push({ name: "GitHub and deployment authority", status: "unverified",
    output: "This local inspection does not query PR checks, reviews, branch protection or deployment authorization." });
  if (st?.terminal || st?.outcome === "FAILED") findings.push({ name: "Terminal session failure", status: "failed",
    output: `The recorded session requires review by ${cfg.owner}. A permitted stop after retry exhaustion is not success; this App does not reset or override it.` });
  const events = history(root, sessionId, findings);
  const result = evidence(root, sessionId, head, hash, base, findings);
  if (!cfg.acceptanceCommand) {
    const acceptanceCheck = result.checks.find((x) => x.name === "acceptance");
    acceptanceCheck.status = "unavailable";
    acceptanceCheck.output = "No acceptance command is configured; no business acceptance execution can be established here.";
  }
  if (!cfg.acceptancePaths.length) {
    const integrityCheck = result.checks.find((x) => x.name === "acceptance-integrity");
    integrityCheck.status = "unavailable";
    integrityCheck.output = "No acceptance paths configured. Any recorded gate success compares an empty path set, not owner-approved acceptance. Inspect the retained JSON for the original mechanical result.";
  }
  if (result.freshness !== "current") findings.push({ name: "Verification freshness", status: "unverified",
    output: result.freshness === "stale" ? "Retained checks describe a different or unstable snapshot. Recorded passes are not passes for the current work." : "No provenance-bound per-check result is available. Ledger summaries below are historical observations, not reconstructed test output." });
  const files = [...new Set([...(present(root, CONFIG) ? [CONFIG] : []), ...(present(root, METHOD) ? [METHOD] : []), ...(contract ? [contract] : []),
    ...acceptance.map((x) => x.path), ...changes.map((x) => x.path), ...(result.source ? [result.source] : [])])];
  const relationships = [];
  for (const item of acceptance) {
    relationships.push({ from: item.path, to: CONFIG, confidence: "verified", reason: "Path matches the configured acceptance patterns. This establishes membership, not owner approval." });
    relationships.push({ from: item.path, to: result.source, confidence: "unavailable", reason: "Per-example execution is not established by an aggregate command result." });
  }
  if (contract) relationships.push({ from: statePath(sessionId), to: contract, confidence: "verified", reason: "The existing session state explicitly names this task document; that link is not proof of approval." });
  if (result.source) relationships.push({ from: result.source, to: present(root, CONFIG) ? CONFIG : null,
    confidence: present(root, CONFIG) ? "verified" : "unavailable",
    reason: present(root, CONFIG) ? `Retained gate JSON for this session; freshness ${result.freshness}. Configuration may have changed since that run.` :
      "Retained gate JSON exists, but the current gate configuration is unavailable." });
  for (const file of files) {
    if (!present(root, file)) continue;
    try {
      const text = read(root, file);
      for (const destination of files) {
        if (destination !== file && text.includes(destination)) relationships.push({
          from: file, to: destination, confidence: "verified",
          reason: "Exact repository path appears in source text. A textual reference does not establish rationale, execution or coverage.",
        });
      }
      const found = ids(text);
      for (const criterion of acceptance) {
        const common = found.filter((id) => criterion.ids.includes(id));
        if (file !== criterion.path && common.length) relationships.push({
          from: file, to: criterion.path, confidence: "inferred",
          reason: `Shared text IDs (${common.join(", ")}); possible association only, not verified coverage or intent.`,
        });
      }
    } catch (error) {
      relationships.push({ from: file, to: null, confidence: "unavailable", reason: error.message });
    }
    if (!relationships.some((x) => x.from === file && x.to === contract && contract)) relationships.push({
      from: file, to: contract, confidence: "unavailable", reason: "No explicit rationale-to-intent relationship established. Ask the owner or inspect the reviewed discussion.",
    });
  }
  const agreementDelta = changes.map((item) => {
    const agreement = item.path === session?.task || item.path === CONFIG || item.path === METHOD ||
      item.kind === "acceptance" || /(^|\/)(CODEOWNERS|copilot-instructions\.md|AGENTS\.md)$/.test(item.path) ||
      /^\.github\/(workflows|hooks|skills\/golden-path)\//.test(item.path) ||
      /^plugin\/(scripts\/gate\.mjs|skills\/golden-path\/)/.test(item.path);
    return { path: item.path, classification: agreement ? "agreement-source" : "implementation-candidate",
      basis: agreement ? "Verified change to a known contract, acceptance or control source; material meaning still needs human review." :
        "Not a recognized agreement source. Ordinary implementation candidate only; semantic impact is unverified.",
      decision: agreement ? "Pause affected agreement changes for the accountable owner/control maintainer. Explain what changed, why, consequence, evidence and unknowns. Do not treat this detector as approval." :
        "Continue only within existing authorization. If the change alters outcome, boundary, authority or acceptance, escalate to the owner before that affected work proceeds." };
  });
  const report = { root, inspectedAt: new Date().toISOString(), head, diffHash: hash, sessions, session, config: cfg, contract, contractText,
    acceptance, changes, evidence: result, findings, events, files, relationships, agreementDelta, handoff: "" };
  if (head !== git(root, "rev-parse", "HEAD").trim() || hash !== diffHash(root)) {
    report.evidence.freshness = "stale";
    findings.push({ name: "Repository changed during inspection", status: "unverified",
      output: "The repository changed while artifacts were being read. Refresh before relying on this snapshot." });
  }
  report.handoff = handoff(report);
  if (file) {
    if (!files.includes(file)) throw new Error("Artifact is not part of this inspection.");
    if (view === "diff" && (!base || !changes.some((x) => x.path === file))) throw new Error("No baseline diff is available for this artifact.");
    let text;
    if (view === "diff" && changes.some((x) => x.path === file && x.status === "untracked")) {
      text = `Untracked file; absent from the baseline.\n\n${read(root, file)}`;
    } else text = view === "diff" ? git(root, "diff", "--no-ext-diff", "--no-textconv", "--no-renames", base, "--", file) : read(root, file);
    report.artifact = { path: file, view, text: text.slice(0, 64000), truncated: text.length > 64000,
      editorUrl: `vscode://file/${pathToFileURL(path.join(root, ...file.split("/"))).pathname.replace(/^\/+/, "")}` };
  }
  return inspectionSchema.parse(report);
}
