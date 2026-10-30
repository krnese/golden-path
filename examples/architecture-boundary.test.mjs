// Scripted mechanism replay, not an AI evaluation or owner-approved project acceptance.
// Domain-specific constraints below are fixture inputs, not architectural defaults for adopters.
// Run: node --test examples/architecture-boundary.test.mjs
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const GATE = path.join(ROOT, "plugin", "scripts", "gate.mjs");
const { NODE_TEST_CONTEXT, ...ENV } = process.env; // nested node --test must run, not inherit the outer worker context
const TASK = "design.md";
const ORIGINAL = "# Fixture design\n\nDecision owner: the simulated architect.\n" +
  "A1: One active conversational interface. Ordinary forms are not conversations.\n" +
  "A replacement may retire the old interface. Changing A1 needs an explicit owner decision.\n";
const app = (inputs) => `export const inputs = ${JSON.stringify(inputs)};\n`;
const main = { id: "main", purpose: "conversation", active: true };
const search = { id: "search", purpose: "filter", active: true };
const developerTest = (expected) => `import assert from "node:assert/strict";
import { test } from "node:test";
import { inputs } from "./app.mjs";
test("developer: expected conversational inputs", () => {
  assert.equal(inputs.filter(i => i.active && i.purpose === "conversation").length, ${expected});
});
`;
const fitnessTest = (expected) => `import assert from "node:assert/strict";
import { test } from "node:test";
import { inputs } from "../app.mjs";
test("A1: one active conversational interface", () => {
  assert.equal(inputs.filter(i => i.active && i.purpose === "conversation").length, ${expected});
});
`;
const CONFIG = {
  check: "node --test developer.test.mjs",
  protected: ["developer.test.mjs"],
  acceptance: {
    paths: ["acceptance/**"],
    owner: "the simulated architect",
    command: "node --test acceptance/architecture.test.mjs",
  },
  hook_budget_sec: 30,
};

function run(command, args, cwd, options = {}) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", timeout: 60000, env: ENV, ...options });
  assert.ifError(result.error);
  return result;
}
function git(root, ...args) {
  const result = run("git", ["-c", "user.name=boundary-replay", "-c", "user.email=replay@example.invalid", ...args], root);
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}
function write(root, rel, content) {
  const target = path.join(root, rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}
function scratch(t, task = ORIGINAL) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "gp-boundary-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const files = {
    [TASK]: task,
    "app.mjs": app([main, search]),
    "developer.test.mjs": developerTest(1),
    "acceptance/architecture.test.mjs": fitnessTest(1),
    ".golden-path/config.json": JSON.stringify(CONFIG),
    ".gitignore": ".golden-path/state/\n.golden-path/ledger.jsonl\n",
  };
  for (const [rel, content] of Object.entries(files)) write(root, rel, content);
  git(root, "init", "-q");
  git(root, "config", "core.autocrlf", "false");
  git(root, "add", "-A");
  git(root, "commit", "-qm", "Scripted fixture baseline");
  return { root, base: git(root, "rev-parse", "HEAD") };
}
function hook(root, command, payload = {}, task = "") {
  const result = run(process.execPath, [GATE, command], root, {
    input: JSON.stringify({ cwd: root, sessionId: "boundary-replay", ...payload }),
    env: { ...ENV, GOLDEN_PATH_TASK: task, GOLDEN_PATH_SESSION: "" },
  });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}
function check(root, base) {
  const result = run(process.execPath, [GATE, "check", "--base", base], root);
  const report = JSON.parse(result.stdout);
  assert.equal(result.status, report.ok ? 0 : 1, result.stderr);
  assert.match(resultOf(report, "check").output, /developer: expected conversational inputs/);
  assert.match(resultOf(report, "acceptance").output, /A1: one active conversational interface/);
  return report;
}
function records(root) {
  return fs.readFileSync(path.join(root, ".golden-path/ledger.jsonl"), "utf8").trim().split("\n").map(line => JSON.parse(line));
}
const resultOf = (report, name) => report.results.find(result => result.name === name);

test("boundary context: replay the original task on resume, despite rewritten and committed documentation", (t) => {
  const { root, base } = scratch(t);
  const first = hook(root, "start", { source: "new" }, TASK);
  assert.ok(first.additionalContext.includes(ORIGINAL));
  assert.ok(first.additionalContext.includes(base));
  assert.match(first.additionalContext, /preserves, modifies, contradicts or uncertain/);
  write(root, TASK, "# Revised by the implementer\nMultiple competing conversations are now the architecture.\n");
  write(root, "replacement.md", "Use this different agreement instead.\n");
  git(root, "add", TASK, "replacement.md");
  git(root, "commit", "-qm", "Attempt to redefine the architecture");

  const resumed = hook(root, "start", { source: "resume" }, "replacement.md");
  assert.ok(resumed.additionalContext.includes(ORIGINAL));
  assert.ok(!resumed.additionalContext.includes("Multiple competing conversations"));
  assert.ok(!resumed.additionalContext.includes("Use this different agreement instead."));
  assert.match(resumed.additionalContext, /requested task differs.*original context is retained/);
  const record = records(root).at(-1);
  assert.equal(record.base_sha, base);
  assert.equal(record.task, TASK);
  assert.deepEqual(record.task_context, {
    status: "offered", path: TASK, base_sha: base,
    content_sha256: createHash("sha256").update(ORIGINAL).digest("hex"), excerpted: false,
  });
  assert.match(record.note, /does not show the agent read or followed/);
});

test("boundary context: snake_case resume and an absolute local task retain the same pinned source", (t) => {
  const { root, base } = scratch(t);
  const started = hook(root, "start", {}, path.join(root, TASK));
  assert.ok(started.additionalContext.includes(ORIGINAL), started.additionalContext);
  write(root, TASK, "Uncommitted replacement intent.\n");
  const resumed = hook(root, "start", { sessionId: undefined, session_id: "boundary-replay", source: "resume" });
  assert.ok(resumed.additionalContext.includes(ORIGINAL), resumed.additionalContext);
  assert.ok(!resumed.additionalContext.includes("Uncommitted replacement intent."));
  assert.equal(records(root).at(-1).task_context.base_sha, base);
});

test("boundary context: filesystem aliases resolve to the original repository task", (t) => {
  const { root } = scratch(t);
  const alias = path.join(root, "workspace-alias");
  fs.symlinkSync(root, alias, process.platform === "win32" ? "junction" : "dir");
  const started = hook(root, "start", {}, path.join(alias, TASK));
  assert.ok(started.additionalContext.includes(ORIGINAL), started.additionalContext);
  assert.equal(records(root).at(-1).task_context.path, TASK);
  write(root, TASK, "A rewritten task through the same filesystem alias.\n");
  const resumed = hook(root, "start", { source: "resume" });
  assert.ok(resumed.additionalContext.includes(ORIGINAL), resumed.additionalContext);
});

test("boundary context: replay project-defined constraints without assuming a UI architecture", async (t) => {
  const cases = [
    ["state ownership", "The order service owns order status; other services must not write it directly."],
    ["API compatibility", "Existing clients must continue receiving the accepted response fields and types."],
    ["business effects", "Retrying a completed payment request must not create another charge."],
  ];
  for (const [label, boundary] of cases) {
    await t.test(label, (t) => {
      const original = `# Project decision\nOwner: the simulated decision owner.\nMust stay true: ${boundary}\n`;
      const { root, base } = scratch(t, original);
      assert.ok(hook(root, "start", {}, TASK).additionalContext.includes(original));
      write(root, TASK, "# Implementation rationale\nThe previous boundary no longer applies.\n");
      const resumed = hook(root, "start", { source: "resume" });
      assert.ok(resumed.additionalContext.includes(original));
      assert.ok(!resumed.additionalContext.includes("The previous boundary no longer applies."));
      assert.equal(records(root).at(-1).task_context.base_sha, base);
    });
  }
});

test("boundary context: no task remains optional and does not manufacture authority", (t) => {
  const { root } = scratch(t);
  const start = hook(root, "start");
  assert.match(start.additionalContext, /accepted "must stay true" statements/);
  assert.match(start.additionalContext, /pause affected work and its dependents/);
  assert.equal(records(root).at(-1).task_context.status, "not-configured");
  assert.ok(!start.additionalContext.includes(ORIGINAL));
});

test("boundary context: missing, uncommitted and external sources are explicitly unverified", async (t) => {
  for (const task of ["missing.md", "new.md", "https://example.invalid/issues/1", path.join(os.tmpdir(), "outside-boundary.md")]) {
    await t.test(task, (t) => {
      const { root } = scratch(t);
      write(root, "new.md", "Uncommitted intent must not become the baseline.\n");
      const start = hook(root, "start", {}, task);
      assert.match(start.additionalContext, /Task context UNVERIFIED/);
      assert.ok(!start.additionalContext.includes("Uncommitted intent must not become the baseline."));
      assert.equal(records(root).at(-1).task_context.status, "unverified");
    });
  }
});

test("boundary context: excerpts disclose omitted content and retain the full source hash", (t) => {
  const source = ORIGINAL + "x".repeat(12000) + "\nA2: important statement at the end.\n";
  const { root } = scratch(t, source);
  const start = hook(root, "start", {}, TASK);
  assert.match(start.additionalContext, /EXCERPT:.*read the full file at this revision/);
  assert.ok(!start.additionalContext.includes("A2: important statement at the end."));
  assert.equal(records(root).at(-1).task_context.excerpted, true);
  assert.equal(records(root).at(-1).task_context.content_sha256, createHash("sha256").update(source).digest("hex"));
});

test("boundary replay: an added competing conversation fails the unchanged architectural check even when developer tests follow it", (t) => {
  const { root, base } = scratch(t);
  write(root, "app.mjs", app([main, search, { ...main, id: "activity-chat" }]));
  write(root, "developer.test.mjs", developerTest(2));
  const report = check(root, base);
  assert.equal(resultOf(report, "check").ok, true);
  assert.equal(resultOf(report, "test-integrity").ok, true, "equal-count semantic changes escape developer-test heuristics");
  assert.equal(resultOf(report, "acceptance").ok, false);
  assert.equal(resultOf(report, "acceptance-integrity").ok, true);
  assert.equal(report.outcome, "FAILED");
});

test("boundary replay: legitimate replacement, ordinary fields and separable work need no new approval", async (t) => {
  const cases = [
    ["replacement", [{ ...main, active: false }, { ...main, id: "replacement" }, search]],
    ["ordinary form", [main, search, { id: "address", purpose: "form", active: true }]],
    ["separable styling", [main, search]],
  ];
  for (const [label, inputs] of cases) {
    await t.test(label, (t) => {
      const { root, base } = scratch(t);
      write(root, "app.mjs", app(inputs));
      write(root, "theme.css", "body { color: black; }\n");
      assert.deepEqual(hook(root, "guard", { toolName: "edit", toolArgs: { path: "theme.css" } }), {});
      assert.equal(check(root, base).outcome, "PASSED");
    });
  }
});

test("boundary replay: self-validation cannot clear fixed-baseline integrity by rewriting and committing tests", (t) => {
  const { root, base } = scratch(t);
  hook(root, "start", {}, TASK);
  const denied = hook(root, "guard", {
    toolName: "edit", toolArgs: { path: "acceptance/architecture.test.mjs" },
  });
  assert.equal(denied.permissionDecision, "deny");
  assert.match(denied.permissionDecisionReason, /DELEGATION CHANGE/);

  write(root, "app.mjs", app([main, { ...main, id: "second" }]));
  write(root, TASK, "The implementer now declares two conversations correct.\n");
  write(root, "developer.test.mjs", developerTest(2));
  write(root, "acceptance/architecture.test.mjs", fitnessTest(2));
  git(root, "add", "-A");
  git(root, "commit", "-qm", "Attempt to bless the regressed implementation");
  const report = check(root, base);
  assert.equal(resultOf(report, "check").ok, true);
  assert.equal(resultOf(report, "acceptance").ok, true, "rewritten tests can go green");
  assert.equal(resultOf(report, "acceptance-integrity").ok, false);
  assert.equal(report.outcome, "FAILED");
  assert.ok(hook(root, "start", { source: "resume" }).additionalContext.includes(ORIGINAL));
  const stop = hook(root, "stop");
  assert.equal(stop.decision, "block");
  assert.match(stop.reason, /acceptance-integrity/);
});
