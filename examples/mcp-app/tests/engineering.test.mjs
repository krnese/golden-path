import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, test } from "node:test";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { inspectEngineering, checkStatus, evidencePath } from "../engineering-report.mjs";
import { captureEvidence } from "../capture-evidence.mjs";
import { DIRECTORY, INSPECT_SESSION, ENGINEERING_RESOURCE } from "../server.mjs";
import { diffHash } from "../../../plugin/scripts/gate.mjs";
import { startPreview } from "../preview.mjs";

const scratch = [];
afterEach(() => {
  for (const root of scratch.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});
function git(root, ...args) {
  const out = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  assert.equal(out.status, 0, out.stderr);
  return out.stdout.trim();
}
function write(root, rel, text) {
  const file = path.join(root, ...rel.split("/"));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}
function fixture() {
  const root = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), "gp-engineering-")));
  scratch.push(root);
  write(root, ".gitignore", ".local/\n.golden-path/state/\n.golden-path/ledger.jsonl\n");
  write(root, ".golden-path/config.json", JSON.stringify({
    check: 'node -e "require(\'node:fs\').writeFileSync(\'unexpected\', \'executed\')"',
    acceptance: { paths: ["acceptance/**"], owner: "@acceptance-owner", command: "not-an-executable" },
    protected: ["tests/**"],
  }));
  write(root, "task.md", "# Outcome\nE1: Inspect an invoice. See acceptance/e1.test.mjs.\n\n## Boundary\nDo not change acceptance.\n\n## Unresolved assumption\nDemand is unproved.");
  write(root, "acceptance/e1.test.mjs", 'test("E1 owner example", () => assert.equal(1, 1));\n');
  write(root, "tests/unit.test.mjs", 'test("unit", () => assert.equal(1, 1));\n');
  write(root, "implementation.mjs", "// E1 invoice implementation\nexport const value = 1;\n");
  git(root, "init", "-q");
  git(root, "config", "core.autocrlf", "false");
  git(root, "add", "-A");
  git(root, "-c", "user.name=Test", "-c", "user.email=test@example.invalid", "commit", "-qm", "approved baseline fixture");
  const base = git(root, "rev-parse", "HEAD");
  write(root, ".golden-path/state/real-session.json", JSON.stringify({
    base_sha: base, base_source: "session-start", task: "task.md", started: 100, outcome: "PASSED",
  }));
  return { root, base };
}
function retained({ root, base }, results = []) {
  write(root, evidencePath("real-session"), JSON.stringify({
    version: 1, sessionId: "real-session", root, recordedAt: new Date().toISOString(),
    head: git(root, "rev-parse", "HEAD"), diffHash: diffHash(root), stable: true,
    result: { base_sha: base, outcome: "PASSED_WITH_SKIPPED", results },
  }));
}
const inspect = (root, extra = {}) => inspectEngineering(root, { sessionId: "real-session", ...extra });

test("repository and evidence identity use native path equivalence without accepting other roots", () => {
  const f = fixture();
  retained(f, [{ name: "check", ok: true, output: "passed" }]);
  const equivalent = process.platform === "win32"
    ? f.root[0].toLowerCase() + f.root.slice(1)
    : path.join(f.root, ".");
  const report = inspect(equivalent);
  assert.equal(report.session.base, f.base);
  assert.equal(report.evidence.freshness, "current");
  assert.equal(report.evidence.checks[0].status, "passed");
  fs.mkdirSync(path.join(f.root, "nested"));
  assert.throws(() => inspect(path.join(f.root, "nested")), /Select the application repository root/);
  const other = fixture();
  retained(other);
  fs.copyFileSync(path.join(f.root, evidencePath("real-session")), path.join(other.root, evidencePath("real-session")));
  const foreign = inspect(other.root);
  assert.notEqual(foreign.evidence.freshness, "current");
  assert.ok(foreign.findings.some(finding => /another repository or session/.test(finding.output)));
});

test("engineering inspection uses actual task, acceptance and changes without executing commands or writing files", () => {
  const { root, base } = fixture();
  write(root, "implementation.mjs", "// E1 invoice change\nexport const value = 2;\n");
  const before = git(root, "status", "--porcelain");
  const report = inspect(root);
  assert.equal(report.session.base, base);
  assert.equal(report.contract, "task.md");
  assert.match(report.contractText, /Demand is unproved/);
  assert.equal(report.acceptance[0].status, "unverified");
  assert.equal(report.acceptance[0].provenance, base);
  assert.equal(report.changes[0].path, "implementation.mjs");
  assert.equal(report.evidence.freshness, "unavailable");
  assert.ok(report.evidence.checks.every((x) => x.status === "unavailable"));
  assert.equal(fs.existsSync(path.join(root, "unexpected")), false);
  assert.equal(git(root, "status", "--porcelain"), before);
  assert.match(report.handoff, /approval is unverified/);
  assert.ok(report.handoff.includes("business correctness"));
});

test("evidence distinguishes every status and stale passes cannot become current passes", () => {
  const f = fixture();
  retained(f, [
    { name: "check", ok: true, output: "7 passed" },
    { name: "acceptance", ok: false, output: "E1 failed" },
    { name: "test-integrity", ok: true, skipped: true, output: "not run" },
    { name: "acceptance-integrity", ok: false, unverified: true, output: "timeout" },
  ]);
  const report = inspect(f.root);
  assert.equal(report.evidence.freshness, "current");
  assert.deepEqual(report.evidence.checks.map((x) => x.status), ["passed", "failed", "skipped", "unverified"]);
  assert.equal(checkStatus({ ok: true, skipped: true }), "skipped");
  assert.equal(checkStatus({ ok: true, unverified: true }), "unverified");
  assert.equal(checkStatus({}), "unavailable");
  write(f.root, "implementation.mjs", "export const changed = true;");
  assert.equal(inspect(f.root).evidence.freshness, "stale");
});

test("invalid or foreign evidence is unavailable, not a successful inspection result", () => {
  const f = fixture();
  retained(f);
  const source = path.join(f.root, ...evidencePath("real-session").split("/"));
  const value = JSON.parse(fs.readFileSync(source, "utf8"));
  value.root = path.dirname(f.root);
  fs.writeFileSync(source, JSON.stringify(value));
  const report = inspect(f.root);
  assert.equal(report.evidence.freshness, "unavailable");
  assert.ok(report.findings.some((x) => /another repository/.test(x.output)));
  fs.writeFileSync(source, "{");
  assert.equal(inspect(f.root).evidence.freshness, "unavailable");
});

test("actual acceptance edits, terminal failure and malformed ledger are surfaced without fabricated semantic enforcement", () => {
  const { root, base } = fixture();
  write(root, "acceptance/e1.test.mjs", "// owner example modified\n");
  write(root, ".golden-path/state/real-session.json", JSON.stringify({
    base_sha: base, base_source: "session-start", task: "task.md", terminal: true, outcome: "FAILED",
  }));
  write(root, ".golden-path/ledger.jsonl", "{invalid\n");
  const report = inspect(root);
  assert.equal(report.findings.find((x) => x.name.startsWith("Acceptance integrity")).status, "failed");
  assert.equal(report.findings.find((x) => x.name === "Terminal session failure").status, "failed");
  assert.equal(report.findings.find((x) => x.name === "Gate history").status, "unavailable");
  assert.equal(report.findings.find((x) => x.name.startsWith("Delegation")).status, "unverified");
  assert.equal(report.agreementDelta.find((x) => x.path === "acceptance/e1.test.mjs").classification, "agreement-source");
});

test("historical ledger success never reconstructs check output or current approval", () => {
  const { root } = fixture();
  write(root, ".golden-path/ledger.jsonl", JSON.stringify({
    session: "real-session", ts: 100, event: "gate_green", outcome: "PASSED", head_sha: "old",
  }) + "\n");
  const report = inspect(root);
  assert.equal(report.events[0].event, "gate_green");
  assert.equal(report.evidence.freshness, "unavailable");
  assert.ok(report.evidence.checks.every((x) => x.status === "unavailable"));
});

test("why links distinguish explicit source references, inferred IDs and unavailable intent", () => {
  const { root } = fixture();
  write(root, "implementation.mjs", "// E1 changed implementation\n");
  const report = inspect(root);
  assert.ok(report.relationships.some((x) => x.from === "task.md" && x.to === "acceptance/e1.test.mjs" && x.confidence === "verified"));
  assert.ok(report.relationships.some((x) => x.from === "implementation.mjs" && x.to === "acceptance/e1.test.mjs" && x.confidence === "inferred"));
  assert.ok(report.relationships.some((x) => x.from === "implementation.mjs" && x.to === "task.md" && x.confidence === "unavailable"));
  assert.equal(report.agreementDelta.find((x) => x.path === "implementation.mjs").classification, "implementation-candidate");
  write(root, "task.md", "Changed outcome");
  assert.equal(inspect(root).agreementDelta.find((x) => x.path === "task.md").classification, "agreement-source");
});

test("missing session, missing contract, invalid baseline and unconfigured acceptance stay explicit", () => {
  const { root } = fixture();
  const listing = inspectEngineering(root);
  assert.equal(listing.session, null);
  assert.equal(listing.sessions.length, 1);
  write(root, ".golden-path/state/real-session.json", JSON.stringify({ base_sha: "a".repeat(40) }));
  write(root, ".golden-path/config.json", JSON.stringify({ check: "unused" }));
  const report = inspect(root);
  assert.equal(report.contract, null);
  assert.equal(report.changes.length, 0);
  assert.ok(report.findings.some((x) => x.name === "Acceptance configuration" && x.status === "unavailable"));
  assert.throws(() => inspectEngineering(root, { sessionId: "../other" }));
});

test("an empty acceptance path set is not displayed as passed acceptance protection", () => {
  const f = fixture();
  write(f.root, ".golden-path/config.json", JSON.stringify({ check: "unused" }));
  retained(f, [
    { name: "check", ok: true, output: "developer checks passed" },
    { name: "acceptance-integrity", ok: true, output: "" },
  ]);
  const report = inspect(f.root);
  assert.equal(report.evidence.checks.find((x) => x.name === "acceptance-integrity").status, "unavailable");
  assert.match(report.evidence.checks.find((x) => x.name === "acceptance-integrity").output, /empty path set/);
});

test("artifact symlinks cannot escape the repository or become integrity evidence", () => {
  const f = fixture();
  const outside = fixture();
  fs.symlinkSync(path.join(outside.root, "acceptance"), path.join(f.root, "linked"), process.platform === "win32" ? "junction" : "dir");
  write(f.root, ".golden-path/config.json", JSON.stringify({
    check: "unused", acceptance: { paths: ["linked/**"], owner: "@owner" },
  }));
  const report = inspect(f.root);
  const link = report.changes.find((x) => x.path.startsWith("linked"));
  assert.ok(link);
  assert.throws(() => inspect(f.root, { file: "linked/e1.test.mjs" }));
  assert.throws(() => inspect(f.root, { file: "linked" }));
});

test("unstable captures are stale, and semantic agreement detection is never asserted", () => {
  const f = fixture();
  retained(f, [{ name: "check", ok: true, output: "pass" }]);
  const source = path.join(f.root, ...evidencePath("real-session").split("/"));
  const saved = JSON.parse(fs.readFileSync(source, "utf8"));
  saved.stable = false;
  fs.writeFileSync(source, JSON.stringify(saved));
  assert.equal(inspect(f.root).evidence.freshness, "stale");
  fs.unlinkSync(path.join(f.root, "task.md"));
  const report = inspect(f.root);
  assert.equal(report.agreementDelta.find((x) => x.path === "task.md").classification, "agreement-source");
  assert.ok(report.findings.some((x) => /no semantic/.test(x.output)));
});

test("artifact navigation is allowlisted, bounded, and source/diff text is actual repository content", () => {
  const { root } = fixture();
  write(root, "implementation.mjs", "// E1\nexport const value = 2;\n");
  assert.match(inspect(root, { file: "implementation.mjs", view: "diff" }).artifact.text, /\+export const value = 2/);
  assert.match(inspect(root, { file: "task.md" }).artifact.text, /Outcome/);
  for (const file of ["../outside", ".git/config", "not-listed.txt"]) assert.throws(() => inspect(root, { file }));
  assert.throws(() => inspect(root, { file: "task.md", view: "diff" }));
});

test("explicit evidence capture runs the existing gate once and retains failures and skips verbatim", () => {
  const { root, base } = fixture();
  const result = { ok: false, outcome: "FAILED", base_sha: base, results: [
    { name: "acceptance", ok: false, output: "E1 actual failure", failed_tests: ["E1"] },
    { name: "acceptance-integrity", ok: true, skipped: true, output: "authorized revision; not a pass" },
  ] };
  write(root, ".github/hooks/golden-path/gate.mjs", `console.log(JSON.stringify(${JSON.stringify(result)})); process.exitCode = 1;`);
  assert.equal(captureEvidence(root, "real-session"), 1);
  const report = inspect(root);
  assert.equal(report.evidence.freshness, "current");
  assert.equal(report.evidence.checks.find((x) => x.name === "acceptance").status, "failed");
  const captured = JSON.parse(fs.readFileSync(path.join(root, ...evidencePath("real-session").split("/")), "utf8"));
  assert.deepEqual(captured.result, result);
  assert.equal(fs.existsSync(path.join(root, "unexpected")), false);
});

test("real MCP tool is read-only, strict, exposes self-contained UI and rejects path redirection", async (t) => {
  const { root } = fixture();
  const client = new Client({ name: "engineering-inspection-test", version: "0.1.0" });
  t.after(() => client.close());
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [path.join(DIRECTORY, "server.mjs"), "--target", root] }));
  const tool = (await client.listTools()).tools.find((x) => x.name === INSPECT_SESSION);
  assert.equal(tool.annotations.readOnlyHint, true);
  assert.equal(tool.inputSchema.additionalProperties, false);
  const response = await client.callTool({ name: INSPECT_SESSION, arguments: { sessionId: "real-session" } });
  assert.equal(response.structuredContent.inspection.contract, "task.md");
  const rejected = await client.callTool({ name: INSPECT_SESSION, arguments: { target: os.tmpdir() } });
  assert.equal(rejected.isError, true);
  const resource = await client.readResource({ uri: ENGINEERING_RESOURCE });
  assert.match(resource.contents[0].text, /Agreement delta/);
  assert.match(resource.contents[0].text, /Why does this exist/);
  assert.deepEqual(resource.contents[0]._meta.ui.csp, { connectDomains: [], resourceDomains: [] });
  assert.equal(fs.existsSync(path.join(root, "unexpected")), false);
});

test("loopback engineering host serves actual read-only reports and refuses foreign origins", async (t) => {
  const { root } = fixture();
  const preview = await startPreview(root, 0, undefined, "real-session");
  t.after(() => preview.close());
  const result = await fetch(`${preview.url}/engineering?sessionId=real-session`);
  assert.equal((await result.json()).structuredContent.inspection.contract, "task.md");
  assert.match(await (await fetch(`${preview.url}/app`)).text(), /Engineering with Golden Path/);
  const rejected = await fetch(`${preview.url}/engineering?`, { headers: { Origin: "https://example.invalid" } });
  assert.equal(rejected.status, 403);
});
