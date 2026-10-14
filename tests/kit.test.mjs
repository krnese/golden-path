// Golden Path kit tests (Node.js built-ins only): node --test tests/
// Ported one-for-one from the Python v3 kit tests, plus the v3.1 hardening regressions.
// Format sources:
// https://code.visualstudio.com/docs/agent-customization/agent-plugins
// https://github.com/agentplugins/agent-plugins-spec/blob/main/spec/1.0.0.md
// https://docs.github.com/en/copilot/reference/hooks-reference
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, beforeEach, afterEach, describe, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as gate from "../plugin/scripts/gate.mjs";
import { plannedFiles } from "../plugin/install.mjs";

const REPO = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const KIT = path.join(REPO, "plugin");
const GATE = path.join(KIT, "scripts", "gate.mjs");
const INSTALL = path.join(KIT, "install.mjs");
const NODE = process.execPath;

// ---------- helpers ----------
const sh = (cmd, cwd, opts = {}) => spawnSync(cmd, { shell: true, cwd, encoding: "utf8", ...opts });
const run = (args, cwd, opts = {}) => spawnSync(args[0], args.slice(1), { cwd, encoding: "utf8", ...opts });
const git = (cwd, ...a) => run(["git", "-c", "user.name=t", "-c", "user.email=t@t", ...a], cwd);
const w = (d, rel, s) => { fs.mkdirSync(path.dirname(path.join(d, rel)), { recursive: true }); fs.writeFileSync(path.join(d, rel), s); };
const rd = (d, rel) => fs.readFileSync(path.join(d, rel), "utf8");
function scratch(files = {}) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "gp-test-"));
  git(d, "init", "-q");
  git(d, "config", "core.autocrlf", "false");
  for (const [rel, s] of Object.entries(files)) w(d, rel, s);
  git(d, "add", "-A");
  git(d, "commit", "-qm", "base", "--allow-empty");
  return d;
}
const rm = (d) => fs.rmSync(d, { recursive: true, force: true });
const cfg = (d, c) => w(d, ".golden-path/config.json", JSON.stringify(c));
const CMD = { stop: ["stop"], start: ["start"], guard: ["guard"], reviewer: ["subagent", "start"] };
function hook(d, kind, payload, env = {}) {
  const r = run([NODE, GATE, ...(CMD[kind] || kind.split(" "))], d, { input: JSON.stringify(payload), env: { ...process.env, ...env } });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout || "{}");
}
const ledger = (d) => {
  const p = path.join(d, ".golden-path/ledger.jsonl");
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : [];
};
function tree(d) {
  const out = {};
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === ".git") continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p); else out[path.relative(d, p).split(path.sep).join("/")] = fs.readFileSync(p, "utf8");
    }
  };
  walk(d);
  return out;
}
const frontmatter = (p) => {
  const m = fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(m, p);
  return Object.fromEntries([...m[1].matchAll(/^(\w[\w-]*):\s*(.+)$/gm)].map((x) => [x[1], x[2]]));
};
// Portable shell commands (sh on POSIX, cmd.exe on Windows): use node itself instead of sleep/echo/exit.
const nodeCmd = (js) => `node -e "${js}"`;
const PASS = nodeCmd("process.exit(0)");
// Windows CI checks out with core.autocrlf=true, so frontmatter is parsed after CRLF->LF (as VS Code does).
const FAIL = nodeCmd("console.log('FAIL: test_x (t.T)');process.exit(1)");
const SLEEP = (s) => nodeCmd(`setTimeout(()=>{},${s * 1000})`);

// ---------- plugin format ----------
const DOC_EVENTS = new Set(["agentStop", "errorOccurred", "notification", "permissionRequest", "postToolUse", "postToolUseFailure",
  "preCompact", "preToolUse", "sessionEnd", "sessionStart", "subagentStart", "subagentStop", "userPromptSubmitted", "userPromptTransformed"]);
const ENTRY_FIELDS = new Set(["type", "bash", "powershell", "command", "cwd", "env", "timeoutSec", "timeout", "matcher", "exec", "args"]);

describe("Packaging: the plugin ships in the documented format", () => {
  test("the plugin manifest uses the published schema, a valid name and only allowed fields", () => {
    const m = JSON.parse(fs.readFileSync(path.join(KIT, "plugin.json"), "utf8"));
    assert.equal(m.$schema, "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json");
    assert.match(m.name, /^[a-z0-9.-]+$/);
    const allowed = new Set(["$schema", "name", "version", "description", "author", "homepage", "repository", "license", "keywords", "extensions"]);
    for (const k of Object.keys(m)) assert.ok(allowed.has(k), k);
  });
  test("the plugin ships exactly one core skill, named like its directory", () => {
    assert.deepEqual(fs.readdirSync(path.join(KIT, "skills")), ["golden-path"]);
    const fm = frontmatter(path.join(KIT, "skills/golden-path/SKILL.md"));
    assert.equal(fm.name, "golden-path");
    assert.ok(fm.description);
    assert.ok(fs.existsSync(path.join(KIT, "skills/golden-path/references/METHOD.md")));
  });
  test("local-model skill: separate, named like its dir, recommends only, labelled references", () => {
    const dir = path.join(KIT, "optional/skills/golden-path-local-models");
    const fm = frontmatter(path.join(dir, "SKILL.md"));
    assert.equal(fm.name, "golden-path-local-models");
    const body = rd(dir, "SKILL.md");
    assert.match(body, /No automatic cloud fallback/);
    assert.match(body, /cannot switch the model in a running conversation/);
    assert.match(body, /no router/i);
    assert.match(body, /Local inference does not mean local-only handling/);
    assert.match(body, /protocol compatibility/);
    assert.match(rd(dir, "references/windows.md"), /chat\.agentHost\.byokModels\.enabled/);
    assert.match(rd(dir, "references/windows.md"), /foundry model unload/);
    assert.match(rd(dir, "references/windows.md"), /API-verified, client verification pending/);
    assert.match(rd(dir, "references/macos.md"), /not yet verified/);
    assert.doesNotMatch(rd(KIT, "skills/golden-path/SKILL.md") + rd(KIT, "skills/golden-path/references/METHOD.md"), /local-models/);
  });
  test("agents are optional presets; reviewer is read-only", () => {
    assert.ok(!fs.existsSync(path.join(KIT, "com.github.copilot", "agents")));
    assert.deepEqual(fs.readdirSync(path.join(KIT, "optional/agents")).sort(), ["golden-path-reviewer.agent.md", "golden-path.agent.md"]);
    const fm = frontmatter(path.join(KIT, "optional/agents/golden-path-reviewer.agent.md"));
    assert.equal(fm.name, "golden-path-reviewer");
    assert.ok(!(fm.tools || "").includes("edit"));
  });
  test("one hook script, plain JS, no Python or research code in the plugin", () => {
    assert.deepEqual(fs.readdirSync(path.join(KIT, "scripts")), ["gate.mjs"]);
    const code = Object.keys(tree(KIT)).filter((p) => /\.(py|js|mjs|cjs|ts)$/.test(p)).sort();
    assert.deepEqual(code, ["install.mjs", "scripts/gate.mjs"]);
    for (const f of code) {
      const imports = [...fs.readFileSync(path.join(KIT, f), "utf8").matchAll(/^import .* from "([^"]+)"/gm)].map((m) => m[1]);
      for (const i of imports) assert.match(i, /^node:/, `${f} imports ${i}: built-ins only`);
    }
  });
  test("skill is short and level-agnostic (no level 2 enforcement wording)", () => {
    const s = rd(KIT, "skills/golden-path/SKILL.md") + rd(KIT, "skills/golden-path/references/METHOD.md");
    assert.ok(rd(KIT, "skills/golden-path/SKILL.md").split("\n").length <= 40);
    assert.doesNotMatch(s, /stop gate|guard|hook|preToolUse|level 2/i);
  });
  test("hooks.json uses the documented schema and calls node with the local script (no npx, no network)", () => {
    const h = JSON.parse(rd(KIT, "com.github.copilot/hooks/hooks.json"));
    assert.equal(h.version, 1);
    for (const [ev, entries] of Object.entries(h.hooks)) {
      assert.ok(DOC_EVENTS.has(ev), ev);
      for (const e of entries) {
        for (const k of Object.keys(e)) assert.ok(ENTRY_FIELDS.has(k), `${ev}.${k}`);
        assert.equal(e.type, "command");
        assert.ok(e.timeoutSec < 300);
        for (const line of [e.bash, e.powershell]) {
          assert.match(line, /^node "\$\{PLUGIN_ROOT\}\/scripts\/gate\.mjs"/);
          assert.doesNotMatch(line, /npx|npm|https?:/);
        }
      }
    }
    const cfgBudget = gate.DEFAULT_CONFIG.hook_budget_sec;
    assert.ok(h.hooks.agentStop[0].timeoutSec > cfgBudget, "hook timeout must exceed the gate's own budget");
  });
  test("the plugin needs no mcp.json (no MCP server)", () => assert.ok(!fs.existsSync(path.join(KIT, "mcp.json"))));
});

// ---------- installer ----------
const CHECK = "npm test";
const install = (d, ...a) => run([NODE, INSTALL, "--target", d, ...a], d);
describe("Installer: installs, upgrades and uninstalls safely", () => {
  let d;
  beforeEach(() => { d = scratch({ "README.md": "hi\n" }); });
  afterEach(() => rm(d));

  test("a fresh install writes the expected, namespaced layout", () => {
    const r = install(d, "--check", CHECK);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    const f = tree(d);
    for (const p of Object.keys(f)) if (p !== "README.md") assert.ok(p.includes("golden-path") || [".github/copilot-instructions.md", ".gitignore"].includes(p), p);
    assert.ok(".github/hooks/golden-path-loop.json" in f && ".github/skills/golden-path/SKILL.md" in f);
    assert.ok(!(".github/agents/golden-path-reviewer.agent.md" in f) && !("AGENTS.md" in f));
    assert.equal(JSON.parse(f[".github/hooks/golden-path-loop.json"]).version, 1);
    assert.doesNotMatch(f[".github/hooks/golden-path-loop.json"], /PLUGIN_ROOT/);
    assert.match(f[".github/hooks/golden-path-loop.json"], /node \\"\.github\/hooks\/golden-path\/gate\.mjs\\" stop/);
    const c = JSON.parse(f[".golden-path/config.json"]);
    assert.equal(c.check, CHECK);
    assert.deepEqual(c.acceptance.paths, []);
    assert.ok(!("research" in c));
    assert.deepEqual(Object.keys(f).filter((p) => p.endsWith(".agent.md")), []);
  });
  test("level 2 installs exactly one script", () => {
    install(d, "--check", CHECK);
    assert.deepEqual(Object.keys(tree(d)).filter((p) => /\.(py|mjs|js)$/.test(p)), [".github/hooks/golden-path/gate.mjs"]);
  });
  test("level 1 is method only: zero code, and no level 2 enforcement wording in files or output", () => {
    const r = install(d, "--level", "1");
    assert.equal(r.status, 0, r.stdout + r.stderr);
    const f = tree(d);
    assert.ok(".github/skills/golden-path/SKILL.md" in f);
    assert.deepEqual(Object.keys(f).filter((p) => /\.(py|mjs|js|json)$/.test(p) && !p.includes("manifest")), []);
    assert.ok(!(".golden-path/config.json" in f) && !(".gitignore" in f));
    const text = r.stdout + Object.entries(f).filter(([p]) => p !== "README.md" && !p.includes("manifest")).map(([, s]) => s).join("\n");
    assert.doesNotMatch(text, /stop gate|guard|hook|enforce[sd]? by|blocks? while/i);
    assert.match(r.stdout, /Nothing is enforced/);
    const up = install(d, "--level", "2", "--check", CHECK);
    assert.equal(up.status, 0, up.stdout);
    assert.ok(".github/hooks/golden-path/gate.mjs" in tree(d));
    assert.match(tree(d)[".github/copilot-instructions.md"], /stop gate/);
    assert.equal(install(d, "--level", "1").status, 2); // no silent downgrade
  });
  test("level 3 is docs only: the installer refuses it and writes nothing", () => {
    const b = tree(d);
    const r = install(d, "--level", "3", "--check", CHECK);
    assert.equal(r.status, 64);
    assert.match(r.stderr, /LEVEL-3-EXPERIMENTS\.md/);
    assert.deepEqual(tree(d), b);
    assert.ok(fs.existsSync(path.join(REPO, "docs/LEVEL-3-EXPERIMENTS.md")));
    assert.ok(!fs.existsSync(path.join(REPO, "research")), "research runner is retired to archive/research-runner");
  });
  test("the agent-preset and acceptance flags are written into the install and config", () => {
    const r = install(d, "--check", CHECK, "--with-agent-preset", "--acceptance-path", "acceptance/**", "--acceptance-path", "specs/*.feature",
      "--acceptance-owner", "Finance", "--acceptance-command", "python3 acceptance/run.py");
    assert.equal(r.status, 0, r.stdout + r.stderr);
    const f = tree(d);
    assert.ok(".github/agents/golden-path.agent.md" in f);
    assert.deepEqual(JSON.parse(f[".golden-path/config.json"]).acceptance,
      { paths: ["acceptance/**", "specs/*.feature"], owner: "Finance", command: "python3 acceptance/run.py" });
  });
  test("re-running the installer is idempotent: nothing changes", () => {
    install(d, "--check", CHECK);
    const b = tree(d);
    const r = install(d);
    assert.equal(r.status, 0);
    assert.match(r.stdout, /nothing changed/);
    assert.deepEqual(tree(d), b);
  });
  test("the first install refuses without --check and writes nothing", () => {
    assert.equal(install(d).status, 2);
    assert.deepEqual(Object.keys(tree(d)), ["README.md"]);
  });
  test("appends to existing adopter files without overwriting, and uninstall restores them", () => {
    const orig = { ".github/copilot-instructions.md": "# Team rules\nUse tabs.\n", "AGENTS.md": "# Agents\nBe nice.\n", ".gitignore": "node_modules/\n" };
    for (const [k, v] of Object.entries(orig)) w(d, k, v);
    install(d, "--check", CHECK);
    const f = tree(d);
    assert.ok(f[".github/copilot-instructions.md"].startsWith(orig[".github/copilot-instructions.md"]));
    assert.match(f["AGENTS.md"], /<!-- golden-path:begin -->/);
    assert.ok(f[".gitignore"].startsWith("node_modules/\n"));
    assert.equal(install(d, "--uninstall").status, 0);
    const g = tree(d);
    for (const [k, v] of Object.entries(orig)) assert.equal(g[k], v, k);
  });
  test("the installer refuses a conflicting file and writes nothing", () => {
    w(d, ".github/skills/golden-path/SKILL.md", "someone else's skill\n");
    const b = tree(d);
    const r = install(d, "--check", CHECK);
    assert.equal(r.status, 2);
    assert.match(r.stdout, /REFUSING/);
    assert.deepEqual(tree(d), b);
  });
  test("the installer refuses to overwrite an existing CI file", () => {
    w(d, ".github/workflows/golden-path-check.yml", "name: mine\n");
    assert.equal(install(d, "--check", CHECK, "--with-ci").status, 2);
  });
  test("the installer refuses an adopter file with a malformed golden-path block", () => {
    w(d, "AGENTS.md", "<!-- golden-path:begin -->\nno end\n");
    assert.equal(install(d, "--check", CHECK).status, 2);
  });
  test("an existing config is never overwritten by a reinstall", () => {
    install(d, "--check", CHECK);
    w(d, ".golden-path/config.json", '{"check": "make test"}\n');
    assert.equal(install(d, "--check", "other").status, 0);
    assert.equal(rd(d, ".golden-path/config.json"), '{"check": "make test"}\n');
  });
  test("uninstall refuses modified files, then --force --purge removes everything", () => {
    install(d, "--check", CHECK, "--with-reviewer", "--with-ci");
    const f = tree(d);
    assert.ok(".github/agents/golden-path-reviewer.agent.md" in f && ".github/workflows/golden-path-check.yml" in f);
    fs.appendFileSync(path.join(d, ".github/hooks/golden-path/gate.mjs"), "// local edit\n");
    assert.equal(install(d, "--uninstall").status, 2);
    assert.equal(install(d, "--uninstall", "--force", "--purge").status, 0);
    assert.deepEqual(Object.keys(tree(d)), ["README.md"]);
  });
  test("a locally modified kit file blocks the upgrade and nothing changes", () => {
    install(d, "--check", CHECK);
    fs.appendFileSync(path.join(d, ".github/skills/golden-path/SKILL.md"), "local tweak\n");
    const b = tree(d);
    assert.equal(install(d).status, 2);
    assert.deepEqual(tree(d), b);
  });
  test("local-model skill is optional: core installs exclude it unless chosen", () => {
    for (const lvl of ["1", "2", "3"]) assert.ok(!Object.keys(plannedFiles({ level: Number(lvl) })).some((f) => f.includes("local-models")), lvl);
    install(d, "--check", CHECK);
    assert.ok(!Object.keys(tree(d)).some((f) => f.includes("local-models")));
    assert.ok(!/local.model/i.test(rd(d, ".github/skills/golden-path/SKILL.md") + rd(d, ".github/copilot-instructions.md")));
    assert.equal(install(d, "--with-local-models").status, 0);
    const t = tree(d);
    for (const f of ["SKILL.md", "references/windows.md", "references/macos.md"]) assert.ok(`.github/skills/golden-path-local-models/${f}` in t, f);
    assert.match(install(d).stdout, /nothing changed/);
    assert.equal(install(d, "--uninstall").status, 0);
    assert.ok(!fs.existsSync(path.join(d, ".github/skills/golden-path-local-models")));
  });
  test("reinstall preserves optional components", () => {
    install(d, "--check", CHECK, "--with-reviewer");
    assert.match(install(d).stdout, /nothing changed/);
    assert.ok(".github/agents/golden-path-reviewer.agent.md" in tree(d));
  });
  test("CI template compares against the fixed PR base commit", () => {
    const y = rd(KIT, "extras/workflows/golden-path-check.yml");
    assert.match(y, /gate=\.github\/hooks\/golden-path\/gate\.mjs/);
    assert.match(y, /"\$gate" check --base "\$BASE_SHA"\r?\n/);
    assert.match(y, /BASE_SHA: \$\{\{ github\.event\.pull_request\.base\.sha \}\}/);
  });
});

// ---------- stop gate ----------
describe("Gate & time budget", () => {
  describe("the stop gate blocks until the checks are green", () => {
    let d;
    beforeEach(() => { d = scratch({ "tests/test_a.py": "def test_a():\n    assert 1\n" }); });
    afterEach(() => rm(d));
    const stop = (extra = {}) => hook(d, "stop", { sessionId: "s1", cwd: d, stopReason: "end_turn", stop_hook_active: false, ...extra });

    test("the stop gate blocks while checks are red, then allows once they are green", () => {
      cfg(d, { check: FAIL, max_blocks: 5 });
      const o = stop();
      assert.equal(o.decision, "block");
      assert.match(o.reason, /RED/);
      assert.match(o.reason, /FAIL: test_x/);
      cfg(d, { check: PASS });
      assert.deepEqual(stop(), {});
      assert.deepEqual(ledger(d).map((r) => r.event), ["gate_red", "gate_green"]);
      const red = ledger(d)[0];
      assert.deepEqual(red.failed_tests, ["test_x"]);
      assert.ok(red.head_sha && red.diff_hash);
    });
    test("checks that are green the first time allow the stop", () => { cfg(d, { check: PASS }); assert.deepEqual(stop(), {}); });
    test("block limit is recorded as FAILED, requires owner review, never a pass and never 'escalated'", () => {
      cfg(d, { check: FAIL, max_blocks: 2, acceptance: { owner: "Finance: Ingrid" } });
      const outs = [stop(), stop(), stop()];
      assert.deepEqual(outs.map((o) => o.decision), ["block", "block", undefined]);
      assert.match(outs[1].reason, /last block/);
      assert.match(outs[1].reason, /requires review by Finance: Ingrid/);
      const last = ledger(d).at(-1);
      assert.deepEqual([last.event, last.outcome, last.ok], ["gave_up", "FAILED", false]);
      assert.equal(last.requires_owner_review, "Finance: Ingrid");
      assert.ok(!ledger(d).some((r) => r.event === "gate_green"));
      assert.doesNotMatch(fs.readFileSync(path.join(d, ".golden-path/ledger.jsonl"), "utf8") + outs.map((o) => o.reason || "").join(""), /escalat/i);
      assert.equal(JSON.parse(rd(d, ".golden-path/state/s1.json")).outcome, "FAILED");
    });
    test("a missing check command counts as red", () => assert.match(stop().reason, /No check command/));
    test("a check that times out counts as red", () => {
      cfg(d, { check: SLEEP(3), hook_budget_sec: 1 });
      assert.match(stop().reason, /timed out/);
    });
    test("timeout kills the whole process tree (no grandchild survives)", async () => {
      fs.writeFileSync(path.join(d, "kid.js"), 'const fs = require("fs"); setTimeout(() => fs.writeFileSync("late.txt", "x"), 1500);\n');
      fs.writeFileSync(path.join(d, "parent.js"), 'require("child_process").spawn(process.execPath, ["kid.js"], { stdio: "inherit" }); setTimeout(() => {}, 5000);\n');
      cfg(d, { check: "node parent.js", hook_budget_sec: 1 });
      assert.match(stop().reason, /timed out/);
      await new Promise((r) => setTimeout(r, 2500));
      assert.ok(!fs.existsSync(path.join(d, "late.txt")), "grandchild outlived the hook timeout");
    });
    test("ONE time budget for the whole hook, not per command", () => {
      // Structural, not wall-clock: with per-command timeouts of 2 s, both 1.2 s commands would finish green.
      cfg(d, { check: SLEEP(1.2), hook_budget_sec: 2, acceptance: { command: SLEEP(1.2) } });
      const t = Date.now();
      const o = stop();
      const ms = Date.now() - t;
      assert.equal(o.decision, "block");
      assert.match(o.reason, /\[acceptance\]\n.*(timed out|budget)/);
      // Generous sanity bound for process start-up on slow runners; the structural assertion above is the real test.
      assert.ok(ms < 2000 + 6000, `hook took ${ms} ms`);
    });
    test("budget covers integrity checks and git calls: nothing starts after the deadline", () => {
      cfg(d, { check: SLEEP(2.5), hook_budget_sec: 2, acceptance: { ...ACC, command: PASS } });
      git(d, "add", "-A"); git(d, "commit", "-qm", "config");
      const r = run([NODE, GATE, "check", "--base", gate.headSha(d)], d);
      assert.equal(r.status, 1);
      const res = JSON.parse(r.stdout);
      assert.equal(res.outcome, "UNVERIFIED");
      for (const x of res.results) {
        if (x.started_ms >= res.deadline_ms) assert.match(x.output, /not run: the hook time budget was used up/, x.name);
      }
      for (const n of ["acceptance", "test-integrity", "acceptance-integrity"]) {
        const x = res.results.find((y) => y.name === n);
        assert.ok(!x.ok && x.unverified, n);
        assert.match(x.output, /not run: the hook time budget was used up/, n);
      }
    });
    test("a snake_case (VS Code style) stop payload is understood and recorded", () => {
      cfg(d, { check: PASS });
      assert.deepEqual(hook(d, "stop", { hook_event_name: "Stop", session_id: "vs1", cwd: d, stop_hook_active: false }), {});
      assert.equal(ledger(d)[0].session, "vs1");
    });
    test("weakening a protected test blocks the stop even when the check is green", () => {
      cfg(d, { check: PASS, protected: ["tests/**"] });
      w(d, "tests/test_a.py", "# emptied\n");
      const o = stop();
      assert.equal(o.decision, "block");
      assert.match(o.reason, /test-integrity/);
    });
  });

  describe("session start records what happened, not what was claimed", () => {
    test("records method_files_present (not method_loaded) and the fixed base commit", () => {
      const d = scratch();
      try {
        cfg(d, { check: PASS });
        const o = hook(d, "start", { sessionId: "s", cwd: d, source: "new" });
        assert.match(o.additionalContext, /Golden Path is active/);
        const rec = ledger(d)[0];
        assert.equal(rec.event, "method_files_present");
        assert.doesNotMatch(JSON.stringify(ledger(d)), /method_loaded/);
        assert.match(rec.note, /does not show the agent read or followed/);
        assert.ok(rec.skill_found && rec.skill_hash && rec.method_hash);
        assert.equal(rec.base_sha, gate.headSha(d));
      } finally { rm(d); }
    });
  });

  describe("the reviewer subagent is recorded but never blocks", () => {
    test("only the reviewer is recorded and it never blocks", () => {
      const d = scratch();
      try {
        assert.deepEqual(hook(d, "reviewer", { agentName: "explore", cwd: d }), {});
        assert.deepEqual(ledger(d), []);
        for (const phase of ["start", "stop"]) assert.deepEqual(hook(d, `subagent ${phase}`, { agentName: "golden-path-reviewer", cwd: d, response: "ok" }), {});
        assert.deepEqual(ledger(d).map((r) => r.event), ["reviewer_start", "reviewer_stop"]);
      } finally { rm(d); }
    });
  });

  describe("one time budget covers the whole hook (observed subprocess launches)", () => {
    test("no subprocess starts after the deadline; every timeout fits in what is left; provenance recorded as unavailable", () => {
      const d = scratch({ "tests/test_a.py": "def test_a():\n    assert 1\n" });
      try {
        cfg(d, { check: SLEEP(1.5), hook_budget_sec: 1, protected: ["tests/**"] });
        const tf = path.join(d, ".git", "trace.jsonl");
        const o = hook(d, "stop", { sessionId: "tr", cwd: d }, { GOLDEN_PATH_TRACE: tf });
        assert.equal(o.decision, "block");
        const tr = fs.readFileSync(tf, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
        assert.ok(tr.length >= 2 && tr.some((x) => x.cmd.startsWith("check:")));
        for (const x of tr) {
          assert.notEqual(x.deadline, null, `${x.cmd} ran without a deadline`);
          assert.ok(x.t < x.deadline, `${x.cmd} started ${x.t - x.deadline} ms after the deadline`);
          // 50 ms slack: the trace timestamp is taken just after gate.mjs computes timeout = deadline - now.
          assert.ok(x.t + x.timeout <= x.deadline + 50, `${x.cmd} timeout ${x.timeout} ms reaches past the deadline`);
        }
        assert.ok(!ledger(d).some((r) => r.event === "acceptance_change_attempt"), "unverified is not a change attempt");
        const rec = ledger(d).at(-1);
        assert.equal(rec.event, "gate_red", JSON.stringify(rec));
        assert.equal(rec.outcome, "UNVERIFIED");
        assert.equal(rec.head_sha, null);
        assert.match(rec.provenance_unavailable, /budget was used up/);
      } finally { rm(d); }
    });
    test("slow bookkeeping: a check that ends just before the deadline leaves provenance reads bounded by what is left", () => {
      const d = scratch({ "tests/test_a.py": "def test_a():\n    assert 1\n" });
      try {
        // The check takes most of the budget but leaves ~1.5 s of slack: a 0.8 s / 1 s split was flaky because
        // node startup on a loaded runner could push the check past the deadline, leaving no bookkeeping to observe.
        cfg(d, { check: SLEEP(3.5), hook_budget_sec: 5 });
        const tf = path.join(d, ".git", "trace.jsonl");
        hook(d, "stop", { sessionId: "tr2", cwd: d }, { GOLDEN_PATH_TRACE: tf });
        const tr = fs.readFileSync(tf, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
        const after = tr.slice(tr.findIndex((x) => x.cmd.startsWith("check:")) + 1);
        assert.ok(after.length, "bookkeeping git calls were traced");
        // The trace timestamp is taken a moment AFTER gate.mjs computes timeout = deadline - now, so t + timeout can
        // overshoot the deadline by a clock tick or two; allow a small measurement slack, far below any real overrun.
        const TRACE_SLACK_MS = 50;
        for (const x of after) assert.ok(x.t < x.deadline && x.t + x.timeout <= x.deadline + TRACE_SLACK_MS && x.timeout < 30000, JSON.stringify(x));
        const rec = ledger(d).at(-1);
        assert.ok(rec.head_sha === null ? /budget|git/.test(rec.provenance_unavailable) : rec.head_sha.length === 40);
      } finally { rm(d); }
    });
  });
});

// ---------- guard ----------
describe("Agent cannot tamper with tests: the guard asks or denies", () => {
  let d;
  beforeEach(() => { d = scratch({ "tests/test_a.py": "def test_a():\n    assert 1\n", "src/a.py": "x=1\n" }); cfg(d, { check: PASS, protected: ["tests/**"] }); });
  afterEach(() => rm(d));
  const g = (toolName, toolArgs) => hook(d, "guard", { sessionId: "s", cwd: d, toolName, toolArgs });

  test("editing an existing test asks for permission", () => assert.equal(g("edit", { path: "tests/test_a.py" }).permissionDecision, "ask"));
  test("creating a new test file is allowed", () => assert.deepEqual(g("create", { path: "tests/test_new.py" }), {}));
  test("editing source code is allowed", () => assert.deepEqual(g("edit", { path: path.join(d, "src/a.py") }), {}));
  test("editing the kit files (hooks, gate script, config) is denied", () => {
    for (const p of [".github/hooks/golden-path-loop.json", ".github/hooks/golden-path/gate.mjs", ".golden-path/config.json"])
      assert.equal(g("edit", { path: p }).permissionDecision, "deny", p);
  });
  test("shell commands that delete or overwrite tests are denied", () => {
    for (const c of ["rm -rf tests", "git rm tests/test_a.py", "echo x > tests/test_a.py", "sed -i s/assert/#/ tests/test_a.py"])
      assert.equal(g("bash", { command: c }).permissionDecision, "deny", c);
  });
  test("shell commands that only run tests are allowed", () => {
    for (const c of ["python3 -m unittest discover -s tests", "pytest tests -q > out.log", "npm test"]) assert.deepEqual(g("bash", { command: c }), {}, c);
  });
  test("git commit --no-verify is denied", () => assert.equal(g("bash", { command: "git commit --no-verify -m x" }).permissionDecision, "deny"));
  test("VS Code payloads and garbage input never crash the guard", () => {
    assert.equal(hook(d, "guard", { hook_event_name: "PreToolUse", tool_name: "Edit", tool_input: { file_path: "tests/test_a.py" }, cwd: d }).permissionDecision, "ask");
    assert.deepEqual(hook(d, "guard", { toolName: "bash", toolArgs: "not json", cwd: d }), {});
    const r = run([NODE, GATE, "guard"], d, { input: "{{{" });
    assert.equal(r.status, 0);
    assert.deepEqual(JSON.parse(r.stdout), {});
  });
});

// ---------- protected acceptance tests ----------
const ACC = { paths: ["acceptance/**"], owner: "Finance: Ingrid", command: null };
describe("Acceptance integrity", () => {
  describe("the guard protects acceptance tests", () => {
    let d;
    beforeEach(() => { d = scratch({ "acceptance/test_t01.py": "def test_x():\n    assert 1\n", "src/a.py": "x=1\n" }); cfg(d, { check: PASS, acceptance: ACC }); });
    afterEach(() => rm(d));
    const g = (toolName, toolArgs) => hook(d, "guard", { sessionId: "s", cwd: d, toolName, toolArgs });
    test("editing, creating or absolute-path editing an acceptance test is denied and names the owner", () => {
      for (const [tool, p] of [["edit", "acceptance/test_t01.py"], ["create", "acceptance/test_new.py"], ["edit", path.join(d, "acceptance/test_t01.py")]]) {
        const o = g(tool, { path: p });
        assert.equal(o.permissionDecision, "deny", p);
        assert.match(o.permissionDecisionReason, /Finance: Ingrid/);
        assert.match(o.permissionDecisionReason, /DELEGATION CHANGE/);
      }
    });
    test("shell mutation of acceptance tests is denied; running and restoring them is allowed", () => {
      for (const c of ["sed -i 's/1/0/' acceptance/test_t01.py", "rm acceptance/test_t01.py", "echo x > acceptance/test_t01.py",
        "git checkout HEAD~1 -- acceptance/test_t01.py", "git restore --source HEAD~1 acceptance/test_t01.py",
        "git restore --source=main acceptance/test_t01.py", "git restore -s main acceptance/test_t01.py", "git restore acceptance/x.py; rm acceptance/test_t01.py"])
        assert.equal(g("bash", { command: c }).permissionDecision, "deny", c);
      for (const c of ["python3 -m unittest acceptance/test_t01.py", "cat acceptance/test_t01.py", "echo hi > out.txt",
        "git restore acceptance/test_t01.py", "git checkout -- acceptance/test_t01.py"])
        assert.deepEqual(g("bash", { command: c }), {}, c);
    });
    test("source edits are still allowed when acceptance tests are protected", () => assert.deepEqual(g("edit", { path: "src/a.py" }), {}));
  });

  describe("the gate detects any acceptance change against the fixed base", () => {
    let d;
    beforeEach(() => {
      d = scratch({ "acceptance/test_t01.py": "def test_x():\n    assert 1\n" });
      cfg(d, { check: PASS, acceptance: ACC });
      hook(d, "start", { sessionId: "s", cwd: d, source: "new" });
    });
    afterEach(() => rm(d));
    const stop = (sid = "s") => hook(d, "stop", { sessionId: sid, cwd: d, stop_hook_active: false });

    test("a changed acceptance test blocks the stop and is recorded", () => {
      w(d, "acceptance/test_t01.py", "def test_x():\n    pass\n");
      const o = stop();
      assert.equal(o.decision, "block");
      assert.match(o.reason, /acceptance-integrity/);
      assert.match(o.reason, /DELEGATION CHANGE/);
      assert.ok(ledger(d).some((r) => r.event === "acceptance_change_attempt"));
    });
    test("a new or deleted acceptance file blocks the stop", () => {
      w(d, "acceptance/test_extra.py", "def test_y():\n    assert 1\n");
      assert.equal(stop().decision, "block");
      fs.rmSync(path.join(d, "acceptance/test_extra.py"));
      fs.rmSync(path.join(d, "acceptance/test_t01.py"));
      assert.equal(stop().decision, "block");
    });
    test("unchanged acceptance tests are green and the acceptance command runs", () => {
      assert.deepEqual(stop(), {});
      cfg(d, { check: PASS, acceptance: { ...ACC, command: nodeCmd("process.exit(1)") } });
      assert.match(stop().reason, /acceptance/);
    });
    test("fixed base: an agent COMMIT of a changed acceptance test still blocks (base is the session-start commit)", () => {
      w(d, "acceptance/test_t01.py", "def test_x():\n    pass\n");
      git(d, "commit", "-qam", "agent commits its edit");
      const o = stop();
      assert.equal(o.decision, "block");
      assert.match(o.reason, /protected acceptance file modified/);
    });
    test("an expert-committed change is the new base for the NEXT session", () => {
      w(d, "acceptance/test_t01.py", "def test_x():\n    assert 2\n");
      git(d, "commit", "-qam", "Ingrid approves revised example");
      hook(d, "start", { sessionId: "s2", cwd: d, source: "new" });
      assert.deepEqual(stop("s2"), {});
    });
    test("CRLF checkout of unchanged acceptance tests is not a change (Windows core.autocrlf)", () => {
      git(d, "config", "core.autocrlf", "true");
      fs.rmSync(path.join(d, "acceptance/test_t01.py"));
      git(d, "checkout", "--", "acceptance/test_t01.py");
      assert.match(rd(d, "acceptance/test_t01.py"), /\r\n/, "precondition: checked out with CRLF");
      assert.deepEqual(stop(), {});
      w(d, "acceptance/test_t01.py", "def test_x():\r\n    pass\r\n");
      assert.equal(stop().decision, "block", "a real change in a CRLF file is still detected");
    });
  });

  describe("check CLI uses an explicit fixed comparison commit", () => {
    test("--base <sha> catches changes the subject committed; HEAD-only comparison warns", () => {
      const d = scratch({ "acceptance/test_t01.py": "def test_x():\n    assert 1\n", "tests/test_a.py": "def test_a():\n    assert 1\n" });
      try {
        cfg(d, { check: PASS, acceptance: ACC });
        git(d, "add", "-A"); git(d, "commit", "-qm", "config");
        const base = gate.headSha(d);
        w(d, "acceptance/test_t01.py", "def test_x():\n    pass\n");
        w(d, "tests/test_a.py", "# emptied\n");
        git(d, "commit", "-qam", "subject rewrites tests and commits");
        const withBase = run([NODE, GATE, "check", "--base", base], d);
        assert.equal(withBase.status, 1);
        const res = JSON.parse(withBase.stdout);
        assert.equal(res.base, base);
        assert.deepEqual(res.failed.sort(), ["acceptance-integrity", "test-integrity"]);
        const env = run([NODE, GATE, "check"], d, { env: { ...process.env, GOLDEN_PATH_BASE: base } });
        assert.equal(env.status, 1);
        const headOnly = run([NODE, GATE, "check"], d, { env: { ...process.env, GOLDEN_PATH_BASE: "" } });
        assert.equal(headOnly.status, 0, "against its own HEAD the subject looks clean, which is why a fixed base is required");
        assert.match(JSON.parse(headOnly.stdout).warning, /Pass a fixed commit/);
      } finally { rm(d); }
    });
  });

  describe("baseline evidence must be valid: never PASS on missing evidence", () => {
    const files = { "acceptance/test_t01.py": "def test_x():\n    assert 1\n", "tests/test_a.py": "def test_a():\n    assert 1\n" };
    const setup = () => { const d = scratch(files); cfg(d, { check: PASS, protected: ["tests/**"], acceptance: ACC }); git(d, "add", "-A"); git(d, "commit", "-qm", "config"); return d; };
    test("nonexistent revision is UNVERIFIED (library and CLI)", () => {
      const d = setup();
      try {
        const res = gate.runChecks(d, gate.loadConfig(d), "0123456789abcdef0123456789abcdef01234567");
        assert.equal(res.ok, false);
        assert.equal(res.outcome, "UNVERIFIED");
        assert.ok(res.unverified.includes("baseline") && res.unverified.includes("acceptance-integrity") && res.unverified.includes("test-integrity"));
        const cli = run([NODE, GATE, "check", "--base", "no-such-branch"], d);
        assert.equal(cli.status, 1);
        assert.match(JSON.parse(cli.stdout).results[0].output, /does not resolve to a commit/);
      } finally { rm(d); }
    });
    test("shallow clone without the base commit is UNVERIFIED and says so", () => {
      const d = setup(), c = fs.mkdtempSync(path.join(os.tmpdir(), "gp-shallow-"));
      try {
        const base = gate.headSha(d);
        w(d, "src.txt", "x\n"); git(d, "add", "-A"); git(d, "commit", "-qm", "work");
        const clone = path.join(c, "r");
        git(c, "clone", "-q", "--depth", "1", pathToFileURL(d).href, clone);
        assert.equal(spawnSync("git", ["rev-parse", "--is-shallow-repository"], { cwd: clone, encoding: "utf8" }).stdout.trim(), "true");
        const r = run([NODE, GATE, "check", "--base", base], clone);
        assert.equal(r.status, 1);
        const res = JSON.parse(r.stdout);
        assert.equal(res.outcome, "UNVERIFIED");
        assert.match(res.results[0].output, /shallow clone/);
      } finally { rm(d); rm(c); }
    });
    test("git failure while reading base content is UNVERIFIED, not an empty (passing) diff", () => {
      const d = setup();
      try {
        const blob = spawnSync("git", ["rev-parse", "HEAD:acceptance/test_t01.py"], { cwd: d, encoding: "utf8" }).stdout.trim();
        fs.rmSync(path.join(d, ".git", "objects", blob.slice(0, 2), blob.slice(2)), { force: true }); // loose object gone
        const res = gate.runChecks(d, gate.loadConfig(d), gate.headSha(d));
        assert.equal(res.ok, false);
        assert.equal(res.outcome, "UNVERIFIED");
        const a = res.results.find((x) => x.name === "acceptance-integrity");
        assert.ok(a.unverified);
        assert.match(a.output, /UNVERIFIED: git show/);
      } finally { rm(d); }
    });
    test("authorised acceptance revision skips only acceptance-integrity, and says where authority comes from", () => {
      const d = setup();
      try {
        const base = gate.headSha(d);
        w(d, "acceptance/test_t01.py", "def test_x():\n    assert 2\n");
        assert.equal(run([NODE, GATE, "check", "--base", base], d).status, 1);
        const r = run([NODE, GATE, "check", "--base", base, "--authorized-acceptance-revision"], d);
        assert.equal(r.status, 0, r.stdout);
        const a = JSON.parse(r.stdout).results.find((x) => x.name === "acceptance-integrity");
        assert.ok(a.skipped);
        assert.match(a.output, /SKIPPED \(not checked, not a pass\)/);
        assert.equal(JSON.parse(r.stdout).outcome, "PASSED_WITH_SKIPPED");
        w(d, "tests/test_a.py", "# emptied\n");
        assert.equal(run([NODE, GATE, "check", "--base", base, "--authorized-acceptance-revision"], d).status, 1, "other checks still apply");
      } finally { rm(d); }
    });
  });
});

describe("Code Owner approval: an authorised acceptance revision needs current-head approval (mocked GitHub API reviews)", () => {
  let d, base, head;
  const review = (login, state, commit_id, at) => ({ user: { login }, state, commit_id, submitted_at: at });
  const auth = (reviews, h = head) => {
    const f = path.join(d, ".git", "reviews.jsonl");
    fs.writeFileSync(f, reviews.map((r) => JSON.stringify(r)).join("\n")); // the workflow's gh api --jq '.[]' shape
    const r = run([NODE, GATE, "authorize-acceptance-revision", "--base", base, "--head", h, "--reviews", f], d);
    return { status: r.status, ...JSON.parse(r.stdout) };
  };
  beforeEach(() => {
    d = scratch({ "acceptance/test_t01.py": "def test_x():\n    assert 1\n", ".github/CODEOWNERS": "/acceptance/ @ingrid\n" });
    cfg(d, { check: PASS, acceptance: ACC }); git(d, "add", "-A"); git(d, "commit", "-qm", "config");
    base = gate.headSha(d);
    w(d, "acceptance/test_t01.py", "def test_x():\n    assert 2\n"); git(d, "commit", "-qam", "owner revises acceptance");
    head = gate.headSha(d);
  });
  afterEach(() => rm(d));
  test("Code Owner approval on the current head authorises", () => {
    const r = auth([review("someone", "APPROVED", head, "2026-10-13T10:00:00Z"), review("Ingrid", "APPROVED", head, "2026-10-13T11:00:00Z")]);
    assert.equal(r.status, 0, JSON.stringify(r.problems));
    assert.deepEqual(r.files[0].approved_by, ["ingrid"]);
  });
  test("label without approval (triage adds label) fails", () => {
    for (const reviews of [[], [review("triager", "APPROVED", head, "2026-10-13T10:00:00Z")], [review("ingrid", "COMMENTED", head, "2026-10-13T10:00:00Z")]]) {
      const r = auth(reviews);
      assert.equal(r.status, 1);
      assert.match(r.problems.join("\n"), /no approval by a Code Owner/);
    }
  });
  test("acceptance changed after approval fails (approval is for an older commit)", () => {
    const approved = head;
    w(d, "acceptance/test_t01.py", "def test_x():\n    assert 3\n"); git(d, "commit", "-qam", "more acceptance edits after approval");
    head = gate.headSha(d);
    const r = auth([review("ingrid", "APPROVED", approved, "2026-10-13T10:00:00Z")]);
    assert.equal(r.status, 1);
    assert.match(r.problems.join("\n"), /older commit \(acceptance may have changed after approval\)/);
  });
  test("later changes-requested overrides approval; the PR cannot grant itself owners", () => {
    let r = auth([review("ingrid", "APPROVED", head, "2026-10-13T10:00:00Z"), review("ingrid", "CHANGES_REQUESTED", head, "2026-10-13T11:00:00Z")]);
    assert.equal(r.status, 1);
    w(d, ".github/CODEOWNERS", "/acceptance/ @mallory\n"); git(d, "commit", "-qam", "PR rewrites CODEOWNERS");
    head = gate.headSha(d);
    r = auth([review("mallory", "APPROVED", head, "2026-10-13T12:00:00Z")]);
    assert.equal(r.status, 1, "owners come from the BASE commit's CODEOWNERS");
  });
  test("no CODEOWNERS or team owners fail closed", () => {
    w(d, ".github/CODEOWNERS", "/acceptance/ @org/finance\n"); git(d, "commit", "-qam", "team owner"); base = gate.headSha(d);
    w(d, "acceptance/test_t01.py", "def test_x():\n    assert 4\n"); git(d, "commit", "-qam", "revise"); head = gate.headSha(d);
    const r = auth([review("ingrid", "APPROVED", head, "2026-10-13T10:00:00Z")]);
    assert.equal(r.status, 1);
    assert.match(r.problems.join("\n"), /team\/email owners are not resolved/);
  });
  test("CI template verifies approval before honouring the label and requires the settings", () => {
    const y = rd(KIT, "extras/workflows/golden-path-check.yml");
    assert.match(y, /authorize-acceptance-revision --base "\$BASE_SHA" --head "\$HEAD_SHA"[\s\S]*check --base "\$BASE_SHA" --authorized-acceptance-revision/);
    assert.match(y, /pulls\/\$PR\/reviews/);
    assert.match(y, /pull-requests: read/);
    assert.match(y, /pull_request_review:/);
    for (const k of [/Require review from Code Owners/, /Dismiss stale pull request approvals/, /required/]) assert.match(y, k);
  });
});

// ---------- integrity heuristics ----------
const PY = "import unittest\nclass T(unittest.TestCase):\n    def test_a(self):\n        self.assertEqual(1, 1)\n    def test_b(self):\n        self.assertTrue(True)\n";
const JS = "test('a', () => { expect(1).toBe(1); });\nit('b', () => { expect(2).toBe(2); });\n";
describe("Weakening detection: protected tests cannot be quietly weakened", () => {
  let d;
  beforeEach(() => { d = scratch({ "tests/test_a.py": PY, "tests/a.test.js": JS, "src/x.py": "" }); });
  afterEach(() => rm(d));
  const v = () => gate.testIntegrity(d, ["tests/**"]);
  test("an untouched protected test suite reports no weakening", () => assert.deepEqual(v(), []));
  test("adding tests to an EXISTING protected file is allowed (brownfield misclassification regression)", () => {
    w(d, "tests/test_a.py", PY + "    def test_c(self):\n        self.assertIn(1, [1])\n");
    w(d, "tests/a.test.js", JS + "test('c', () => { expect(3).toBe(3); });\n");
    assert.deepEqual(v(), []);
  });
  test("removing a test is flagged as a dropped test count", () => { w(d, "tests/test_a.py", PY.split("    def test_b")[0]); assert.ok(v().some((x) => x.includes("test count dropped"))); });
  test("removing an assertion is flagged as a dropped assertion count", () => { w(d, "tests/test_a.py", PY.replace("self.assertTrue(True)", "pass")); assert.ok(v().some((x) => x.includes("assertion count dropped"))); });
  test("adding a skip decorator is flagged", () => { w(d, "tests/test_a.py", PY.replace("    def test_b", "    @unittest.skip('x')\n    def test_b")); assert.ok(v().some((x) => x.includes("skip"))); });
  test("adding a JavaScript .only is flagged", () => { w(d, "tests/a.test.js", JS.replace("test('a'", "test.only('a'")); assert.ok(v().some((x) => x.includes("skip/only"))); });
  test("deleting a protected test file is flagged", () => { fs.rmSync(path.join(d, "tests/a.test.js")); assert.ok(v().some((x) => x.includes("deleted"))); });
  test("changes outside the protected paths are ignored", () => { fs.rmSync(path.join(d, "src/x.py")); assert.deepEqual(v(), []); });
  test("CRLF line endings do not change counts", () => { w(d, "tests/test_a.py", PY.replace(/\n/g, "\r\n")); assert.deepEqual(v(), []); });
  test("protected-path globs match the intended files and nothing else", () => {
    assert.ok(gate.matches("tests/a/b.py", ["tests/**"]));
    assert.ok(!gate.matches("testsuite/a.py", ["tests/**"]));
    assert.ok(gate.matches("src/a.test.ts", ["**/*.test.ts", "src/*.test.ts"]));
  });
});

// ---------- demo end to end (level 2, no Python kit code) ----------
describe("Demo baseline: the demo installs and behaves as documented", () => {
  let base, d, makeOut;
  before(() => {
    base = fs.mkdtempSync(path.join(os.tmpdir(), "gp-demo-"));
    d = path.join(base, "demo");
    const r = run([NODE, path.join(REPO, "examples/make-demo.mjs"), d], REPO);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    makeOut = r.stdout;
  });
  after(() => rm(base));
  test("baseline: one hook script, acceptance red until T01, T05 and T06 are implemented, research off", () => {
    assert.match(makeOut, /frozen tasks and acceptance examples verified/);
    const code = Object.keys(tree(d)).filter((p) => /\.(py|mjs)$/.test(p)).sort();
    assert.deepEqual(code, [".github/hooks/golden-path/gate.mjs", "acceptance/marketing/t05.test.mjs", "acceptance/marketing/t06.test.mjs", "acceptance/t01.test.mjs", "acceptance/t02.test.mjs", "acceptance/t03.test.mjs", "acceptance/t04.test.mjs", "invoice.mjs", "simulator/refusal_scenario.mjs", "tests/invoice.test.mjs"]);
    // The demo's checks are node:test runs; drop the runner's NODE_TEST_CONTEXT so they report like a user's shell.
    const { NODE_TEST_CONTEXT, ...env } = process.env;
    const r = run([NODE, path.join(d, ".github/hooks/golden-path/gate.mjs"), "check", "--base", gate.headSha(d)], d, { env });
    assert.equal(r.status, 1, r.stdout);
    const res = Object.fromEntries(JSON.parse(r.stdout).results.map((x) => [x.name, x.ok]));
    assert.deepEqual(res, { check: true, acceptance: false, "test-integrity": true, "acceptance-integrity": true });
    const failed = JSON.parse(r.stdout).failed_tests;
    assert.ok(failed.some((t) => t.startsWith("T05 ")), "T05 is enabled and red: " + failed.join(", "));
    assert.ok(failed.some((t) => t.startsWith("T06 ")), "T06 is enabled and red: " + failed.join(", "));
    assert.ok(failed.some((t) => t.startsWith("T01 ")), "T01 is enabled and red: " + failed.join(", "));
    assert.ok(!Object.keys(tree(d)).some((p) => p.endsWith(".py")), "the demo has no Python files");
    const c = JSON.parse(rd(d, ".golden-path/config.json"));
    assert.deepEqual(c.acceptance.paths, ["acceptance/**"]);
    assert.match(c.acceptance.command, /acceptance\/t01\.test\.mjs/);
    assert.match(c.acceptance.command, /acceptance\/marketing\/t05\.test\.mjs/);
    assert.match(c.acceptance.command, /acceptance\/marketing\/t06\.test\.mjs/);
    assert.ok(!("research" in c));
  });
  test("the scripted refusal scenario refuses both acceptance edits and leaves acceptance untouched", () => {
    const { NODE_TEST_CONTEXT, ...env } = process.env; // the scenario's gate runs node:test; report like a user's shell
    const r = run([NODE, "simulator/refusal_scenario.mjs"], d, { env: { ...env, GOLDEN_PATH_SESSION: "refusal-1" } });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /RESULT: as expected/);
    const ev = ledger(d).filter((x) => x.session === "refusal-1").map((x) => x.event);
    assert.equal(ev.filter((e) => e === "guard_deny").length, 2);
    assert.ok(ev.includes("acceptance_change_attempt"));
    assert.equal(run(["git", "status", "--porcelain", "acceptance"], d).stdout.trim(), "");
  });
});
