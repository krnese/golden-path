import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, test } from "node:test";
import { fileURLToPath } from "node:url";
import { adoptionReport } from "../plugin/scripts/gate.mjs";
import { install, plannedFiles } from "../plugin/install.mjs";

const REPO = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const GATE = path.join(REPO, "plugin", "scripts", "gate.mjs");
const scratch = [];
afterEach(() => {
  for (const dir of scratch.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});
const write = (root, rel, text) => {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
};
const git = (root, ...args) => {
  const r = spawnSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.invalid", ...args],
    { cwd: root, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout.trim();
};
function repository(files = {}) {
  const root = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), "gp-adoption-")));
  scratch.push(root);
  git(root, "init", "-q");
  git(root, "config", "core.autocrlf", "false");
  for (const [rel, text] of Object.entries(files)) write(root, rel, text);
  git(root, "add", "-A");
  git(root, "commit", "-qm", "baseline", "--allow-empty");
  return root;
}
const configuration = (extra = {}) => JSON.stringify({
  check: "node --test test/app.test.mjs",
  acceptance: { paths: ["acceptance/**"], owner: "@owner", command: "node --test acceptance/rule.test.mjs" },
  protected: ["test/**"],
  ...extra,
});
function configured(extraFiles = {}, extraConfig = {}) {
  return repository({
    ".golden-path/config.json": configuration(extraConfig),
    ".github/skills/golden-path/SKILL.md": "method",
    ".github/hooks/golden-path/gate.mjs": "gate",
    ".github/workflows/golden-path-check.yml": "workflow",
    ".github/CODEOWNERS": "* @maintainer\n/acceptance/ @owner\n",
    "test/app.test.mjs": "developer test",
    "acceptance/rule.test.mjs": "approved example",
    ...extraFiles,
  });
}
const check = (report, id) => {
  const found = report.checks.find((r) => r.id === id);
  assert.ok(found, `Missing diagnostic ${id}`);
  return found;
};
const status = (report, id) => check(report, id).status;
const cli = (...args) => spawnSync(process.execPath, [GATE, "adoption", ...args], { encoding: "utf8" });
function snapshot(root) {
  const found = {};
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === ".git") continue;
      const file = path.join(dir, e.name);
      if (e.isDirectory()) walk(file);
      else found[path.relative(root, file)] = fs.readFileSync(file).toString("base64");
    }
  };
  walk(root);
  return found;
}

describe("Adoption: one read-only journey for greenfield and brownfield", () => {
  test("an empty application repository has a baseline, not business acceptance", () => {
    const report = adoptionReport(repository());
    assert.equal(status(report, "baseline"), "verified");
    for (const id of ["method-files", "configuration", "check-command", "acceptance-command", "acceptance-paths", "acceptance-owner"]) {
      assert.equal(status(report, id), "missing", id);
    }
    assert.equal("ok" in report, false);
    assert.equal("ready" in report, false);
    assert.ok(report.checks.every((r) => ["verified", "missing", "unverified"].includes(r.status) && r.evidence && r.next));
  });
  test("a repository with no commit cannot claim a baseline", () => {
    const root = repository();
    const r = spawnSync("git", ["init", "-q"], { cwd: fs.mkdtempSync(path.join(root, "unborn-")), encoding: "utf8" });
    assert.equal(r.status, 0, r.stderr);
    const unborn = fs.readdirSync(root).find((f) => f.startsWith("unborn-"));
    assert.equal(status(adoptionReport(path.join(root, unborn)), "baseline"), "unverified");
  });
  test("a non-git folder is explicitly unverified", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "gp-adoption-nongit-"));
    scratch.push(root);
    const report = adoptionReport(root);
    assert.equal(status(report, "repository"), "unverified");
    assert.equal(status(report, "acceptance-paths"), "unverified");
  });
  test("brownfield settings are reused, but configuration is not execution or approval", () => {
    const root = configured();
    const before = snapshot(root);
    const report = adoptionReport(root);
    for (const id of ["repository", "baseline", "method-files", "configuration", "check-command", "acceptance-command",
      "acceptance-owner", "acceptance-paths", "developer-test-paths", "acceptance-ownership", "control-file-ownership"]) {
      assert.equal(status(report, id), "verified", id);
    }
    for (const id of ["hook-invocation", "acceptance-execution", "owner-judgment", "github-required-checks", "github-bypass-policy"]) {
      assert.equal(status(report, id), "unverified", id);
    }
    assert.deepEqual(snapshot(root), before);
    assert.equal(fs.existsSync(path.join(root, ".golden-path/state")), false);
    assert.equal(fs.existsSync(path.join(root, ".golden-path/ledger.jsonl")), false);
  });
  test("the diagnostic does not run configured commands or silently access GitHub", () => {
    const root = configured({}, { check: 'node -e "require(\'node:fs\').writeFileSync(\'unexpected\', \'ran\')"' });
    const commands = [];
    adoptionReport(root, { run: (cmd, args, opts) => {
      commands.push(cmd);
      return spawnSync(cmd, args, opts);
    } });
    assert.ok(commands.every((cmd) => cmd === "git"));
    assert.equal(fs.existsSync(path.join(root, "unexpected")), false);
  });
  test("existing nondefault test folders are checked instead of assumed", () => {
    const root = configured({}, { protected: ["tests/**"] });
    const report = adoptionReport(root);
    assert.equal(status(report, "developer-test-paths"), "missing");
    assert.match(check(report, "developer-test-paths").evidence, /tests\/\*\*/);
    assert.equal(status(report, "acceptance-paths"), "verified");
  });
  test("each acceptance pattern must match a file", () => {
    const root = configured({}, { acceptance: { paths: ["acceptance/**", "rules/**"], owner: "@owner", command: "test" } });
    assert.equal(status(adoptionReport(root), "acceptance-paths"), "missing");
  });
  for (const paths of ["/outside/**", "../outside/**", "C:/outside/**", "acceptance\\**", 42]) {
    test(`invalid acceptance patterns are unverified: ${paths}`, () => {
      const root = configured({}, { acceptance: { paths: [paths], owner: "@owner" } });
      assert.equal(status(adoptionReport(root), "acceptance-paths"), "unverified");
    });
  }
  test("deleted and ignored acceptance files cannot establish path coverage", () => {
    const root = configured({ ".gitignore": "acceptance/ignored.mjs\n" });
    fs.unlinkSync(path.join(root, "acceptance/rule.test.mjs"));
    write(root, "acceptance/ignored.mjs", "ignored");
    assert.equal(status(adoptionReport(root), "acceptance-paths"), "missing");
  });
  test("untracked acceptance is visible but is not claimed to be committed or approved", () => {
    const root = configured();
    write(root, "acceptance/new.test.mjs", "unreviewed");
    const report = adoptionReport(root);
    assert.match(check(report, "acceptance-paths").evidence, /2 files/);
    assert.equal(status(report, "owner-judgment"), "unverified");
  });
  for (const text of ["{", "null", "[]", '"not configuration"']) {
    test(`malformed configuration is not silently accepted: ${text}`, () => {
      const root = configured({ ".golden-path/config.json": text });
      const report = adoptionReport(root);
      assert.equal(status(report, "configuration"), "unverified");
      assert.notEqual(status(report, "acceptance-command"), "verified");
    });
  }
  test("non-string commands are unverified and placeholder ownership is missing", () => {
    const root = configured({}, { check: ["test"], acceptance: { owner: "the acceptance owner", command: 1 } });
    const report = adoptionReport(root);
    assert.equal(status(report, "check-command"), "unverified");
    assert.equal(status(report, "acceptance-command"), "unverified");
    assert.equal(status(report, "acceptance-owner"), "missing");
  });
  test("invalid acceptance objects and null path settings are not treated as defaults", () => {
    const root = configured({}, { acceptance: [], protected: null });
    const report = adoptionReport(root);
    assert.equal(status(report, "configuration"), "unverified");
    assert.equal(status(report, "developer-test-paths"), "unverified");
    write(root, ".golden-path/config.json", configuration({ acceptance: { paths: null } }));
    assert.equal(status(adoptionReport(root), "acceptance-paths"), "unverified");
  });
  test("CODEOWNERS precedence and last-match unowned files are preserved", () => {
    const root = configured({ ".github/CODEOWNERS": "* @maintainer\n/acceptance/ @owner\n/acceptance/rule.test.mjs\n" });
    assert.equal(status(adoptionReport(root), "acceptance-ownership"), "missing");
  });
  test("team-only ownership is not mistaken for supported revision authorization", () => {
    const root = configured({ ".github/CODEOWNERS": "* @maintainer\n/acceptance/ @org/team\n" });
    assert.equal(status(adoptionReport(root), "acceptance-ownership"), "unverified");
  });
  test("acceptance ownership alone does not establish control-file ownership", () => {
    const root = configured({ ".github/CODEOWNERS": "/acceptance/ @owner\n" });
    const report = adoptionReport(root);
    assert.equal(status(report, "acceptance-ownership"), "verified");
    assert.equal(status(report, "control-file-ownership"), "missing");
  });
  test("CODEOWNERS location precedence matches the existing revision check", () => {
    const root = configured({ "CODEOWNERS": "* @fallback\n", ".github/CODEOWNERS": "/test/ @developer\n" });
    assert.equal(status(adoptionReport(root), "acceptance-ownership"), "missing");
  });
  test("copy-in method-only installs remain code-free and include guided adoption", () => {
    const files = plannedFiles({ level: 1 });
    assert.ok(files[".github/skills/golden-path/references/ADOPTION.md"]);
    assert.ok(!Object.keys(files).some((f) => /\.(mjs|js|cjs)$/.test(f)));
    assert.match(files[".github/skills/golden-path/SKILL.md"], /guided adoption/);
  });
  test("the installed gate has the same command; reinstall preserves customer settings", () => {
    const root = repository({ "test/app.test.mjs": "existing" });
    const log = console.log;
    try {
      console.log = () => {};
      assert.equal(install(root, { check: "existing-check", protectedPaths: ["test/**"] }), 0);
      const before = fs.readFileSync(path.join(root, ".golden-path/config.json"), "utf8");
      assert.equal(install(root, { check: "replacement" }), 0);
      assert.equal(fs.readFileSync(path.join(root, ".golden-path/config.json"), "utf8"), before);
    } finally { console.log = log; }
    const r = spawnSync(process.execPath, [path.join(root, ".github/hooks/golden-path/gate.mjs"), "adoption", "--target", root, "--json"],
      { encoding: "utf8" });
    assert.equal(r.status, 0, r.stderr);
    assert.equal(status(JSON.parse(r.stdout), "acceptance-paths"), "missing");
  });
  test("CLI supports spaces, JSON and human-readable evidence without creating files", () => {
    const root = configured({ "folder with spaces/readme": "existing" });
    const before = snapshot(root);
    const r = cli("--target", path.join(root, "folder with spaces"), "--json");
    assert.equal(r.status, 0, r.stderr);
    assert.equal(JSON.parse(r.stdout).root.toLowerCase(), root.toLowerCase());
    const text = cli("--target", root);
    assert.equal(text.status, 0, text.stderr);
    assert.match(text.stdout, /\[UNVERIFIED\] hook-invocation/);
    assert.match(text.stdout, /not a protection badge/);
    assert.deepEqual(snapshot(root), before);
  });
  for (const args of [["--target"], ["--unknown"], ["--target", "--json"]]) {
    test(`invalid CLI arguments are explicit: ${args}`, () => {
      const r = cli(...args);
      assert.equal(r.status, 64);
      assert.match(r.stderr, /usage:/);
      assert.equal(r.stdout, "");
    });
  }
  test("help explains that a diagnostic exit code is not adoption success", () => {
    const r = cli("--help");
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /Exit 0 means a report was produced/);
  });
  test("missing target fails explicitly rather than returning a success-shaped report", () => {
    const r = cli("--target", path.join(repository(), "not-created"), "--json");
    assert.equal(r.status, 1);
    assert.match(r.stderr, /UNVERIFIED/);
    assert.equal(r.stdout, "");
  });
});

const activeRules = [
  { type: "required_status_checks", parameters: { required_status_checks: [{ context: "golden-path-check" }] } },
  { type: "pull_request", parameters: { require_code_owner_review: true, required_approving_review_count: 1, dismiss_stale_reviews_on_push: true } },
];
function githubRunner({ rules = [activeRules], protection = {}, metadata, failure } = {}) {
  const calls = [];
  const run = (cmd, args, opts) => {
    if (cmd === "git") return spawnSync(cmd, args, opts);
    assert.equal(cmd, "gh");
    calls.push(args);
    const part = args[0] === "repo" ? "metadata" : args[1].includes("rules/branches/") ? "rules" : "protection";
    if (failure?.[part]) return { status: 1, stderr: failure[part] };
    const data = part === "metadata" ? metadata ?? { nameWithOwner: "example/app", defaultBranchRef: { name: "release/main" } } :
      part === "rules" ? rules : protection;
    return { status: 0, stdout: JSON.stringify(data) };
  };
  return { run, calls };
}
describe("Adoption: optional GitHub inspection is read-only and evidence-scoped", () => {
  test("active paginated rules verify individual settings but never bypass safety", () => {
    const { run, calls } = githubRunner({ rules: [[activeRules[0]], [activeRules[1]]] });
    const report = adoptionReport(configured(), { github: true, run });
    for (const id of ["github-required-checks", "github-owner-review", "github-stale-approvals"]) {
      assert.equal(status(report, id), "verified", id);
      assert.match(check(report, id).evidence, /example\/app@release\/main/);
    }
    assert.equal(status(report, "github-bypass-policy"), "unverified");
    assert.ok(calls.some((a) => a[1]?.includes("release%2Fmain") && a.includes("--paginate") && a.includes("--slurp")));
    assert.ok(calls.every((a) => a[0] === "repo" && a[1] === "view" || a[0] === "api" && a[1].startsWith("repos/example/app/")));
    assert.ok(calls.every((a) => !a.includes("--method") && !a.includes("--field") && !a.includes("--input")));
  });
  test("legacy branch protection is recognized alongside empty rulesets", () => {
    const { run } = githubRunner({ rules: [[]], protection: {
      required_status_checks: { checks: [{ context: "golden-path-check" }] },
      required_pull_request_reviews: { require_code_owner_reviews: true, required_approving_review_count: 2, dismiss_stale_reviews: true },
    } });
    const report = adoptionReport(configured(), { github: true, run });
    assert.equal(status(report, "github-required-checks"), "verified");
    assert.equal(status(report, "github-owner-review"), "verified");
    assert.equal(status(report, "github-stale-approvals"), "verified");
  });
  test("a Code Owner flag without a required approval is insufficient", () => {
    const { run } = githubRunner({ rules: [[{ type: "pull_request", parameters: { require_code_owner_review: true, required_approving_review_count: 0 } }]] });
    assert.equal(status(adoptionReport(configured(), { github: true, run }), "github-owner-review"), "missing");
  });
  test("unrelated required checks do not prove the kit check is required", () => {
    const { run } = githubRunner({ rules: [[{ type: "required_status_checks", parameters: { required_status_checks: [{ context: "lint" }] } }]] });
    const report = adoptionReport(configured(), { github: true, run });
    assert.equal(status(report, "github-required-checks"), "missing");
    assert.match(check(report, "github-required-checks").evidence, /lint/);
  });
  test("permissions or plan restrictions are unverified, never missing or passed", () => {
    const { run } = githubRunner({ failure: { rules: "HTTP 403: unavailable on this plan", protection: "HTTP 404: not found or inaccessible" } });
    const report = adoptionReport(configured(), { github: true, run });
    for (const id of ["github-required-checks", "github-owner-review", "github-stale-approvals"]) {
      assert.equal(status(report, id), "unverified", id);
      assert.match(check(report, id).evidence, /HTTP 403/);
    }
  });
  test("partial positive evidence is qualified; absence in a partial read is unverified", () => {
    const { run } = githubRunner({ rules: [[activeRules[0]]], failure: { protection: "HTTP 403" } });
    const report = adoptionReport(configured(), { github: true, run });
    assert.equal(status(report, "github-required-checks"), "verified");
    assert.match(check(report, "github-required-checks").evidence, /Partial evidence/);
    assert.equal(status(report, "github-owner-review"), "unverified");
  });
  test("no authenticated repository context remains unverified without follow-up requests", () => {
    const { run, calls } = githubRunner({ failure: { metadata: "gh: authentication required" } });
    const report = adoptionReport(configured(), { github: true, run });
    assert.equal(status(report, "github-required-checks"), "unverified");
    assert.equal(calls.length, 1);
  });
  test("an empty repository without a GitHub default branch remains unverified", () => {
    const { run, calls } = githubRunner({ metadata: { nameWithOwner: "example/app", defaultBranchRef: null } });
    assert.equal(status(adoptionReport(configured(), { github: true, run }), "github-required-checks"), "unverified");
    assert.equal(calls.length, 1);
  });
  test("malformed rules payloads do not silently become missing controls", () => {
    const { run } = githubRunner({ rules: { message: "unexpected" } });
    assert.equal(status(adoptionReport(configured(), { github: true, run }), "github-required-checks"), "unverified");
  });
  test("invalid JSON from GitHub is explicitly unverified", () => {
    const root = configured();
    const report = adoptionReport(root, { github: true, run: (cmd, args, opts) =>
      cmd === "git" ? spawnSync(cmd, args, opts) : { status: 0, stdout: "not JSON" } });
    assert.equal(status(report, "github-required-checks"), "unverified");
    assert.match(check(report, "github-required-checks").evidence, /Invalid JSON/);
  });
});
