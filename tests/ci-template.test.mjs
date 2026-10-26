// The CI template runs the adopter's own test commands, so it must set up the project first. A pilot on an existing
// Node.js repository failed on GitHub with ERR_MODULE_NOT_FOUND because the template installed nothing.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const Y = () => fs.readFileSync(path.join(REPO, "plugin/extras/workflows/golden-path-check.yml"), "utf8").replace(/\r\n/g, "\n");
const BASH = process.platform === "win32" ? ["C:\\Program Files\\Git\\bin\\bash.exe"].find((p) => fs.existsSync(p)) : "bash";

function setupScript() {
  const m = Y().match(/- name: Project setup[^\n]*\n\s+run: \|\n((?: {10}.*\n)+)/);
  assert.ok(m, "the workflow has a project setup step");
  return m[1].split("\n").map((l) => l.slice(10)).join("\n");
}
/** Run the setup step in a scratch repo with a stub npm that records its arguments. */
function runSetup(files) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "gp-setup-"));
  try {
    for (const [rel, body] of Object.entries(files)) { fs.mkdirSync(path.dirname(path.join(d, rel)), { recursive: true }); fs.writeFileSync(path.join(d, rel), body); }
    const bin = path.join(d, ".bin"); fs.mkdirSync(bin);
    fs.writeFileSync(path.join(bin, "npm"), "#!/usr/bin/env bash\necho \"npm $*\" >> calls.log\n", { mode: 0o755 });
    fs.writeFileSync(path.join(d, "setup.sh"), `export PATH="$PWD/.bin:$PATH"\n` + setupScript());
    const r = spawnSync(BASH, ["-e", "setup.sh"], { cwd: d, encoding: "utf8" });
    const calls = fs.existsSync(path.join(d, "calls.log")) ? fs.readFileSync(path.join(d, "calls.log"), "utf8").trim() : "";
    return { status: r.status, stdout: r.stdout, stderr: r.stderr, calls };
  } finally { fs.rmSync(d, { recursive: true, force: true }); }
}

describe("CI template: the project is set up before its own tests run", () => {
  test("setup-node (pinned, Node 24) and project setup run before the Golden Path check", () => {
    const y = Y();
    const node = y.indexOf("actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1"), setup = y.indexOf("- name: Project setup"),
      check = y.indexOf("- name: Golden Path check");
    assert.ok(node > 0 && setup > node && check > setup, "order: setup-node, project setup, check");
    assert.match(y, /node-version: "24"/);
    assert.match(y, /package-manager-cache: false/, "no automatic cache that fails without a root lockfile");
  });
  test("an adopter-owned .golden-path/ci-setup.sh wins, so the kit workflow stays unmodified", { skip: !BASH && "no bash" }, () => {
    const r = runSetup({ ".golden-path/ci-setup.sh": "echo custom-setup-ran\n", "package-lock.json": "{}" });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /custom-setup-ran/);
    assert.equal(r.calls, "");
  });
  test("a Node.js project with a lockfile gets npm ci --ignore-scripts", { skip: !BASH && "no bash" }, () => {
    const r = runSetup({ "package-lock.json": "{}" });
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.calls, "npm ci --ignore-scripts");
  });
  test("a project with neither runs nothing and says so", { skip: !BASH && "no bash" }, () => {
    const r = runSetup({});
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.calls, "");
    assert.match(r.stdout, /no project setup run/);
  });
  test("a failing ci-setup.sh fails the job instead of running the check half set up", { skip: !BASH && "no bash" }, () => {
    const r = runSetup({ ".golden-path/ci-setup.sh": "exit 3\n" });
    assert.notEqual(r.status, 0);
  });
});
