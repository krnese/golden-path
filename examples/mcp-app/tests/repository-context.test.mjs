import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, execFile } from "node:child_process";
import { promisify } from "node:util";
import { test } from "node:test";
import { inspectRepository } from "../repository-context.mjs";
import { inspectionInput } from "../engineering-schema.mjs";

const execute = promisify(execFile);
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "gp-repository-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  execFileSync("git", ["init", "-q"], { cwd: root });
  execFileSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.invalid", "commit", "--allow-empty", "-qm", "Fixture"], { cwd: root });
  execFileSync("git", ["remote", "add", "origin", "https://github.com/example/project.git"], { cwd: root });
  fs.mkdirSync(path.join(root, ".github", "workflows"), { recursive: true });
  fs.writeFileSync(path.join(root, ".github", "workflows", "ci.yml"), "jobs:\n  build:\n    steps:\n      - uses: actions/checkout@v4\n");
  fs.writeFileSync(path.join(root, "package.json"), JSON.stringify({ scripts: { test: "node must-not-run.mjs" } }));
  return root;
}

test("repository pulse reads local definitions without running project scripts, GitHub or writing records", async t => {
  const root = fixture(t);
  const before = execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" });
  const report = await inspectRepository(root, { run: async (name, args, options) => {
    assert.equal(name, "git");
    return execute(name, args, options);
  } });
  assert.equal(report.github.inspectedAt, null);
  assert.match(report.github.facts[0].detail, /Not fetched/);
  assert.match(report.local.find(item => item.name === ".github/workflows/ci.yml").detail, /actions\/checkout@v4/);
  assert.equal(report.local.find(item => item.name === "Workflow definitions").status, "configured");
  assert.match(report.local.find(item => item.name === "Project commands").detail, /must-not-run/);
  assert.equal(execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" }), before);
});

test("repository pulse distinguishes malformed declarations from missing files", async t => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, "package.json"), "{broken");
  fs.rmSync(path.join(root, ".github", "workflows", "ci.yml"));
  const report = await inspectRepository(root);
  assert.equal(report.local.find(item => item.name === "Project commands").status, "unknown");
  assert.equal(report.local.find(item => item.name === "Workflow definitions").status, "missing");
});

test("explicit GitHub inspection is GET-only, bounded, and keeps failures and other revisions distinct", async t => {
  const root = fixture(t);
  const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
  const endpoints = [];
  let controlReports = 0;
  const report = await inspectRepository(root, { github: true, run: async (name, args, options) => {
    if (name === "git") return execute(name, args, options);
    if (name === process.execPath) {
      controlReports++;
      assert.deepEqual(args.slice(1), ["adoption", "--target", root, "--github", "--json"]);
      assert.equal(options.env.GH_REPO, "example/project");
      assert.equal(options.env.GH_HOST, "github.com");
      throw Object.assign(new Error("Diagnostic findings"), { code: 2, stdout: JSON.stringify({ root, checks: [
        { id: "github-required-checks", status: "unverified", evidence: "Partial evidence: HTTP 403", next: "Verify application checks." },
        { id: "github-owner-review", status: "verified", evidence: "Code Owner review configured.", next: "Verify bypass policy." },
        { id: "github-stale-approvals", status: "missing", evidence: "Stale dismissal absent.", next: "Review settings." },
        { id: "github-bypass-policy", status: "unverified", evidence: "Not audited.", next: "Owner review." },
      ] }) });
    }
    assert.equal(name, "gh");
    assert.deepEqual(args.slice(0, 5), ["api", "--hostname", "github.com", "--method", "GET"]);
    assert.equal(options.timeout, 8000);
    const endpoint = args[5];
    endpoints.push(endpoint);
    let data;
    if (endpoint.includes("/actions/workflows?")) data = { workflows: [{ name: "CI", path: ".github/workflows/ci.yml", state: "active" }] };
    else if (endpoint.includes("/actions/runs?")) data = { workflow_runs: [
      { id: 1, name: "Current failure", head_sha: head, status: "completed", conclusion: "failure", updated_at: "2026-10-29T12:00:00Z" },
      { id: 2, name: "Older success", head_sha: "b".repeat(40), status: "completed", conclusion: "success", updated_at: "2026-10-28T12:00:00Z" },
    ] };
    else if (endpoint.startsWith("search/issues?")) data = { total_count: 0, incomplete_results: false, items: [] };
    else if (endpoint.includes("/pulls?")) data = [{ number: 42, title: "Work in progress", draft: true }];
    else throw new Error(`Unexpected REST endpoint: ${endpoint}`);
    return { stdout: JSON.stringify(data) };
  } });
  assert.equal(endpoints.length, 4);
  assert.equal(controlReports, 1);
  const facts = report.github.facts;
  assert.equal(facts.find(item => item.name === "Current failure").status, "failed");
  assert.equal(facts.find(item => item.name === "Older success").status, "stale");
  assert.equal(facts.find(item => item.name === "Open issues").status, "verified");
  assert.equal(facts.find(item => item.name.startsWith("#42")).url, "https://github.com/example/project/pull/42");
  assert.equal(facts.find(item => item.name === "Code Owner review").status, "configured");
  assert.equal(facts.find(item => item.name === "Stale review dismissal").status, "missing");
  assert.equal(facts.find(item => item.name === "Required kit check").status, "unknown");
  assert.match(facts.find(item => item.name === "Required kit check").detail, /Partial evidence/);
});

test("missing GitHub tooling and invalid API responses remain explicit unknowns, not empty success", async t => {
  const root = fixture(t);
  const report = await inspectRepository(root, { github: true, run: async (name, args, options) => {
    if (name === "git") return execute(name, args, options);
    throw Object.assign(new Error("not installed"), { code: "ENOENT" });
  } });
  assert.ok(report.github.facts.length >= 5);
  assert.ok(report.github.facts.every(item => item.status === "unknown"));
  assert.ok(report.github.facts.every(item => item.detail.includes("not installed")));
  const invalid = await inspectRepository(root, { github: true, run: async (name, args, options) =>
    name === "git" ? execute(name, args, options) : { stdout: "{}" } });
  assert.ok(invalid.github.facts.every(item => item.status === "unknown"));
});

test("unsupported origins do not execute GitHub and conversational drafts cannot carry approval or arbitrary fields", async t => {
  const root = fixture(t);
  execFileSync("git", ["remote", "set-url", "origin", "https://unrelated.invalid/example/project"], { cwd: root });
  const report = await inspectRepository(root, { github: true, run: async (name, args, options) => {
    assert.equal(name, "git");
    return execute(name, args, options);
  } });
  assert.match(report.github.facts[0].detail, /No GitHub request/);
  assert.equal(report.github.facts[0].status, "unknown");
  assert.deepEqual(inspectionInput.parse({ brief: { outcome: "Proposed outcome" }, github: false }).brief, { outcome: "Proposed outcome" });
  for (const brief of [{ ownerDecision: "approve" }, { outcome: " " }, { outcome: "x".repeat(2001) }]) {
    assert.throws(() => inspectionInput.parse({ brief }));
  }
  assert.throws(() => inspectionInput.parse({ github: "true" }));
});
