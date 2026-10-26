// Developer tests are often not under tests/ (pilot on an existing repo: test/). The installer lets the adopter say
// where they are and warns when the protected paths do not exist, instead of silently guarding nothing.
import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { install, main, DEFAULT_PROTECTED } from "../plugin/install.mjs";

const CFG = ".golden-path/config.json";
function quiet(fn) {
  const out = [], warn = [], log = console.log, w = console.warn;
  console.log = (...a) => out.push(a.join(" ")); console.warn = (...a) => warn.push(a.join(" "));
  try { return { code: fn(), out: out.join("\n"), warn: warn.join("\n") }; } finally { console.log = log; console.warn = w; }
}

describe("Installer: protected developer-test paths (--protected)", () => {
  let d;
  const mk = (...dirs) => { for (const x of dirs) fs.mkdirSync(path.join(d, x), { recursive: true }); };
  const cfg = () => JSON.parse(fs.readFileSync(path.join(d, CFG), "utf8"));
  beforeEach(() => { d = fs.mkdtempSync(path.join(os.tmpdir(), "gp-prot-")); });
  afterEach(() => fs.rmSync(d, { recursive: true, force: true }));

  test("the default stays tests/** and an adopter with tests/ sees no warning", () => {
    mk("tests");
    const r = quiet(() => install(d, { check: "node -e 0" }));
    assert.equal(r.code, 0);
    assert.deepEqual(cfg().protected, DEFAULT_PROTECTED);
    assert.deepEqual(DEFAULT_PROTECTED, ["tests/**"]);
    assert.equal(r.warn, "");
  });
  test("--protected sets the guarded paths, repeatable, from the command line", () => {
    mk("test", "spec");
    const r = quiet(() => main(["--target", d, "--check", "node -e 0", "--protected", "test/**", "--protected", "spec/**"]));
    assert.equal(r.code, 0);
    assert.deepEqual(cfg().protected, ["test/**", "spec/**"]);
    assert.equal(r.warn, "");
  });
  test("a repo whose tests live in test/ is warned and told the exact flag", () => {
    mk("test");
    const r = quiet(() => install(d, { check: "node -e 0" }));
    assert.equal(r.code, 0);
    assert.match(r.warn, /WARNING: protected test path\(s\) tests\/\*\* not found[\s\S]*would not be detected/);
    assert.match(r.warn, /Found test\/; rerun with --protected "test\/\*\*"/);
  });
  test("the warning also shows on a dry run, before anything is written", () => {
    mk("test");
    const r = quiet(() => install(d, { check: "node -e 0", dryRun: true }));
    assert.equal(r.code, 0);
    assert.match(r.out, /config: \.golden-path\/config\.json/);
    assert.match(r.warn, /tests\/\*\* not found/);
    assert.ok(!fs.existsSync(path.join(d, CFG)));
  });
  test("with no recognisable test folder the warning asks for one", () => {
    const r = quiet(() => install(d, { check: "node -e 0", protectedPaths: ["checks/**"] }));
    assert.match(r.warn, /checks\/\*\* not found[\s\S]*Pass --protected "<your test folder>\/\*\*"/);
  });
  test("an existing config is never overwritten; --protected on a rerun says it was not applied", () => {
    mk("test");
    quiet(() => install(d, { check: "node -e 0" }));
    const before = fs.readFileSync(path.join(d, CFG), "utf8");
    const r = quiet(() => install(d, { protectedPaths: ["test/**"] }));
    assert.equal(r.code, 0);
    assert.equal(fs.readFileSync(path.join(d, CFG), "utf8"), before);
    assert.match(r.warn, /never overwritten; --protected was not applied/);
  });
  test("a rerun without --protected stays quiet (self-install dry run prints only 'nothing to do')", () => {
    mk("test");
    quiet(() => install(d, { check: "node -e 0" }));
    const r = quiet(() => install(d, { dryRun: true }));
    assert.equal(r.out, "nothing to do");
    assert.equal(r.warn, "");
  });
  test("level 1 has no config and no protected-path warning", () => {
    const r = quiet(() => install(d, { level: 1 }));
    assert.equal(r.code, 0);
    assert.equal(r.warn, "");
    assert.ok(!fs.existsSync(path.join(d, CFG)));
  });
});
