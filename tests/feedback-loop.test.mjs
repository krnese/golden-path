// The loop back to the owner: the skill asks for owner-readable evidence, and the optional CI template puts the
// gate's verdict on the PR page (job summary) instead of relying on the local, gitignored ledger.
import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { install } from "../plugin/install.mjs";

const REPO = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const KIT = path.join(REPO, "plugin");
const lf = (s) => s.replace(/\r\n/g, "\n");
const rd = (...p) => lf(fs.readFileSync(path.join(...p), "utf8"));
const WORKFLOW = () => rd(KIT, "extras/workflows/golden-path-check.yml");

/** The inline Node.js summary script from the workflow (the heredoc body, YAML indentation removed). */
function summaryScript() {
  const m = WORKFLOW().match(/<<'JS'\n([\s\S]*?)\n\s*JS\n/);
  assert.ok(m, "the workflow has a JS heredoc summary step");
  return m[1].split("\n").map((l) => l.replace(/^ {10}/, "")).join("\n");
}
function summarise(outFile, env = {}) {
  const r = spawnSync(process.execPath, ["-"], { input: summaryScript(), encoding: "utf8",
    env: { ...process.env, OUT: outFile, BASE_SHA: "b".repeat(40), HEAD_SHA: "c".repeat(40), ...env } });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout;
}

describe("Owner evidence: the skill asks for what passing tests cannot show", () => {
  const skill = rd(KIT, "skills/golden-path/SKILL.md");
  const method = rd(KIT, "skills/golden-path/references/METHOD.md");
  test("the report shows real output per example, uncovered cases and the PR's check results", () => {
    assert.match(skill, /real output next to the expected result/);
    assert.match(skill, /cases the examples do not cover/);
    assert.match(skill, /pull request's check results/);
  });
  test("drafted acceptance traces each test to an example and gives the owner a table, outside the implementing session", () => {
    assert.match(skill, /its own change for the owner to approve, never in the session\s+that implements it/);
    assert.match(skill, /test name with its example's ID/);
    assert.match(skill, /table: example, test, what it checks/);
    assert.match(method, /Owners approve meaning, not code/);
  });
  test("the agent checks it starts from the owner's latest acceptance", () => {
    assert.match(skill, /starting commit has the owner's latest acceptance/);
    assert.match(skill, /start a new session/);
  });
  test("the no-change rules for acceptance are still there", () => {
    assert.match(skill, /\*\*Never edit, delete, skip or add to them\.\*\*/);
    assert.match(skill, /never undo their change/);
  });
});

describe("PR verdict: the CI template writes the gate result to the job summary", () => {
  let d;
  const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => k !== "NODE_TEST_CONTEXT")); // nested node --test would skip
  const gate = (...a) => spawnSync(process.execPath, [path.join(d, ".github/hooks/golden-path/gate.mjs"), ...a], { cwd: d, encoding: "utf8", env });
  const git = (...a) => { const r = spawnSync("git", a, { cwd: d, encoding: "utf8" }); assert.equal(r.status, 0, r.stderr); return r.stdout.trim(); };
  const out = (name, s) => { const p = path.join(d, name); fs.writeFileSync(p, s); return p; };
  before(() => {
    d = fs.mkdtempSync(path.join(os.tmpdir(), "gp-verdict-"));
    git("init", "-q"); git("config", "user.email", "t@example.com"); git("config", "user.name", "t"); git("config", "core.autocrlf", "false");
    fs.mkdirSync(path.join(d, "acceptance"));
    fs.writeFileSync(path.join(d, "acceptance/t01.test.mjs"), "import { test } from 'node:test';\ntest('T01 test_ok', () => {});\n");
    fs.writeFileSync(path.join(d, ".gitignore"), "*.out\n");
    const log = console.log; console.log = () => {};
    try {
      assert.equal(install(d, { check: "node -e 0", ci: true, acceptancePaths: ["acceptance/**"], acceptanceOwner: "Finance: Ingrid",
        acceptanceCommand: "node --test --test-reporter=tap acceptance/t01.test.mjs" }), 0);
    } finally { console.log = log; }
    git("add", "-A"); git("commit", "-qm", "base");
  });
  after(() => fs.rmSync(d, { recursive: true, force: true }));

  test("the workflow captures the gate output and summarises it even when the check fails", () => {
    const y = WORKFLOW();
    assert.match(y, /exec >"\$RUNNER_TEMP\/golden-path\.out"\n/);
    assert.match(y, /"\$gate" check --base "\$BASE_SHA"\n/);
    assert.match(y, /- name: Golden Path verdict \(job summary\)\n\s+if: always\(\)/);
    assert.match(y, />>"\$GITHUB_STEP_SUMMARY"/);
    assert.doesNotMatch(y, /upload-artifact/, "the local ledger is never uploaded");
  });
  test("a green run names the outcome, the PR base and that acceptance is unchanged", () => {
    const r = gate("check", "--base", git("rev-parse", "HEAD"));
    assert.equal(r.status, 0, r.stdout + r.stderr);
    const s = summarise(out("green.out", r.stdout));
    assert.match(s, /Outcome: \*\*PASSED\*\* · base `[0-9a-f]{7}` \(PR base\) · PR head `ccccccc`/);
    assert.match(s, /\| acceptance \| passed \|/);
    assert.match(s, /Protected acceptance unchanged since the PR base \(owner: Finance: Ingrid\)/);
    assert.match(s, /not approval/);
  });
  test("a changed acceptance test is shown as FAILED with the file named", () => {
    const base = git("rev-parse", "HEAD");
    fs.appendFileSync(path.join(d, "acceptance/t01.test.mjs"), "// weakened\n");
    try {
      const r = gate("check", "--base", base);
      assert.equal(r.status, 1);
      const s = summarise(out("changed.out", r.stdout));
      assert.match(s, /Outcome: \*\*FAILED\*\*/);
      assert.match(s, /\| acceptance-integrity \| FAILED \|/);
      assert.match(s, /Protected acceptance differs from the PR base[\s\S]*acceptance\/t01\.test\.mjs: protected acceptance file modified/);
    } finally { git("checkout", "--", "acceptance/t01.test.mjs"); }
  });
  test("failing acceptance tests are listed by name", () => {
    const base = git("rev-parse", "HEAD");
    fs.writeFileSync(path.join(d, "acceptance/t01.test.mjs"), "import { test } from 'node:test';\ntest('T01 test_ok', () => { throw new Error('x'); });\n");
    git("commit", "-qam", "red");
    try {
      const r = gate("check", "--base", base, "--authorized-acceptance-revision");
      assert.equal(r.status, 1, r.stdout + r.stderr);
      const s = summarise(out("red.out", r.stdout));
      assert.match(s, /Failing tests \(1\):\n- T01 test_ok/);
      assert.match(s, /\| acceptance-integrity \| skipped \(not a pass\) \|/);
    } finally { git("reset", "-q", "--hard", base); }
  });
  test("an authorisation result is reported next to the check, and a refusal is explicit", () => {
    const auth = JSON.stringify({ authorized: false, base: "b", head: "c", files: [], problems: ["acceptance/t01.test.mjs: no approval by a Code Owner"] }, null, 1);
    const s = summarise(out("auth.out", auth + "\n"));
    assert.match(s, /\*\*UNVERIFIED\*\*: no check result was produced/);
    assert.match(s, /Acceptance revision NOT authorised:\n- acceptance\/t01\.test\.mjs: no approval by a Code Owner/);
  });
  test("no output at all is UNVERIFIED, never a pass", () => {
    const s = summarise(path.join(d, "missing.out"));
    assert.match(s, /\*\*UNVERIFIED\*\*/);
    assert.doesNotMatch(s, /PASSED/);
  });
});
