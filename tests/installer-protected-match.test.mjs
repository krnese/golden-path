// Protected-path warnings use the gate's matching rules on real files, not a literal path prefix
// (review of #34: filename-prefix and leading-wildcard patterns).
import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { install, matchesProtected } from "../plugin/install.mjs";
import { matches } from "../plugin/scripts/gate.mjs";

function warnFor(d, protectedPaths) {
  const warn = [], log = console.log, w = console.warn;
  console.log = () => {}; console.warn = (...a) => warn.push(a.join(" "));
  try { assert.equal(install(d, { check: "node -e 0", protectedPaths, dryRun: true }), 0); } finally { console.log = log; console.warn = w; }
  return warn.join("\n");
}

describe("Installer: protected-path warnings follow the gate's matching on real files", () => {
  let d;
  const put = (...rels) => { for (const r of rels) { fs.mkdirSync(path.dirname(path.join(d, r)), { recursive: true }); fs.writeFileSync(path.join(d, r), "x\n"); } };
  beforeEach(() => { d = fs.mkdtempSync(path.join(os.tmpdir(), "gp-match-")); });
  afterEach(() => fs.rmSync(d, { recursive: true, force: true }));

  test("the installer's matcher agrees with the gate's on representative paths", () => {
    const pats = ["tests/**", "test/*.spec.mjs", "**/*.test.mjs", "test/server*.test.mjs", "src/?.py", "spec"];
    const rels = ["tests", "tests/a.py", "testsuite/a.py", "test/a.spec.mjs", "test/a.test.mjs", "test/server.test.mjs",
      "test/server-e2e.test.mjs", "src/a.py", "src/ab.py", "spec", "deep/x/y.test.mjs"];
    for (const p of pats) for (const r of rels) assert.equal(matchesProtected(r, p), matches(r, [p]), `${p} vs ${r}`);
  });
  test("a filename pattern that matches nothing warns even though its folder exists", () => {
    put("test/a.test.mjs");
    assert.match(warnFor(d, ["test/*.spec.mjs"]), /test\/\*\.spec\.mjs not found in the target \(no matching files\)/);
  });
  test("a filename-prefix pattern that matches an existing file does not warn", () => {
    put("test/server.test.mjs");
    assert.equal(warnFor(d, ["test/server*.test.mjs"]), "");
  });
  test("leading-wildcard patterns are checked too: silent when matched, warned when not", () => {
    put("deep/x/y.test.mjs");
    assert.equal(warnFor(d, ["**/*.test.mjs"]), "");
    assert.match(warnFor(d, ["**/*.spec.ts"]), /\*\*\/\*\.spec\.ts not found/);
  });
  test("in a git repository, untracked test files count and gitignored ones do not", () => {
    assert.equal(spawnSync("git", ["init", "-q"], { cwd: d }).status, 0);
    put("test/a.test.mjs", "vendor/tests/v.test.mjs");
    fs.writeFileSync(path.join(d, ".gitignore"), "vendor/\n");
    assert.match(warnFor(d, ["vendor/tests/**"]), /vendor\/tests\/\*\* not found/);
    assert.equal(warnFor(d, ["test/**"]), "");
  });
});
