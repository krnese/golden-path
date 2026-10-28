import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, test } from "node:test";
import { fileURLToPath } from "node:url";
import { applyBlock, plannedFiles } from "../plugin/install.mjs";

const REPO = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const GENERATOR = path.join(REPO, "examples", "make-starter.mjs");
const INSTALLER = path.join(REPO, "plugin", "install.mjs");
const roots = [];
afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});
const scratch = () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "gp-starter-"));
  roots.push(root);
  return root;
};
const run = (script, ...args) => spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });
const generate = (root) => {
  const r = run(GENERATOR, root);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  return r;
};
function files(root) {
  const out = {};
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, e.name);
      if (e.isDirectory()) walk(file);
      else out[path.relative(root, file).split(path.sep).join("/")] = fs.readFileSync(file, "utf8");
    }
  };
  walk(root);
  return out;
}

describe("Starter: minimal reproducible GitHub template", () => {
  test("generation contains only the method installation, README and license notice", () => {
    const root = path.join(scratch(), "new application");
    const r = generate(root);
    const tree = files(root);
    assert.deepEqual(Object.keys(tree).sort(), [
      ...Object.keys(plannedFiles({ level: 1 })),
      ".github/copilot-instructions.md", ".github/GOLDEN-PATH-LICENSE",
      ".golden-path/install-manifest.json", "README.md",
    ].sort());
    for (const [rel, content] of Object.entries(plannedFiles({ level: 1 }))) assert.equal(tree[rel], content);
    assert.equal(JSON.parse(tree[".golden-path/install-manifest.json"]).level, 1);
    assert.match(r.stdout, /no automatic checks or protected acceptance/);
    assert.equal(tree[".github/GOLDEN-PATH-LICENSE"], fs.readFileSync(path.join(REPO, "LICENSE"), "utf8").replace(/\r\n/g, "\n"));
    assert.equal(Object.keys(tree).some((f) => /\.(mjs|js|py)$/.test(f)), false);
  });
  test("README explains GitHub generation, honest limits, ownership and upgrades", () => {
    const root = scratch();
    generate(root);
    const readme = files(root)["README.md"];
    for (const text of [/Use this template/, /Help me use Golden Path/, /method-only guidance/,
      /separate change first/, /No application stack/, /fresh\s+history/, /do not automatically update/,
      /does not select a license/, /No automatic owner notification/]) {
      assert.match(readme, text);
    }
    assert.ok(fs.existsSync(path.join(root, ".github/GOLDEN-PATH-LICENSE")));
  });
  test("generation is byte-for-byte reproducible", () => {
    const first = scratch(), second = scratch();
    generate(first);
    generate(second);
    assert.deepEqual(files(first), files(second));
  });
  test("nonempty existing repositories are refused without changing files", () => {
    const root = scratch();
    fs.writeFileSync(path.join(root, "application.txt"), "keep me");
    const before = files(root);
    const r = run(GENERATOR, root);
    assert.equal(r.status, 2);
    assert.match(r.stderr, /Refusing/);
    assert.deepEqual(files(root), before);
  });
  test("regeneration refuses to overwrite an existing starter", () => {
    const root = scratch();
    generate(root);
    const before = files(root);
    assert.equal(run(GENERATOR, root).status, 2);
    assert.deepEqual(files(root), before);
  });
  test("an existing file is refused rather than replaced by a directory", () => {
    const file = path.join(scratch(), "existing");
    fs.writeFileSync(file, "keep");
    const r = run(GENERATOR, file);
    assert.equal(r.status, 2);
    assert.equal(fs.readFileSync(file, "utf8"), "keep");
  });
  test("the installer recognizes the generated manifest without changes", () => {
    const root = scratch();
    generate(root);
    const before = files(root);
    const r = run(INSTALLER, "--target", root, "--dry-run");
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.stdout.trim(), "nothing to do");
    assert.deepEqual(files(root), before);
  });
  test("reviewed upgrades preserve CRLF adopter content without appending blank lines", () => {
    const before = "keep\r\n\r\n# golden-path:begin\r\nold\r\n# golden-path:end\r\n";
    const next = applyBlock(before, "# {}", "new");
    assert.equal(next, "keep\r\n\r\n# golden-path:begin\nnew\n# golden-path:end\n");
    assert.equal(applyBlock(next, "# {}", "new"), next);
    const lf = next.replace(/\r\n/g, "\n");
    assert.equal(applyBlock(lf, "# {}", "new"), lf);
  });
  test("an explicit checked upgrade preserves the README and notice without inventing acceptance", () => {
    const root = scratch();
    generate(root);
    const before = files(root);
    const r = run(INSTALLER, "--target", root, "--level", "2", "--check", "application-command");
    assert.equal(r.status, 0, r.stdout + r.stderr);
    const tree = files(root);
    assert.equal(tree["README.md"], before["README.md"]);
    assert.equal(tree[".github/GOLDEN-PATH-LICENSE"], before[".github/GOLDEN-PATH-LICENSE"]);
    const config = JSON.parse(tree[".golden-path/config.json"]);
    assert.equal(config.check, "application-command");
    assert.deepEqual(config.acceptance.paths, []);
    assert.equal(config.acceptance.command, null);
    assert.ok(tree[".github/hooks/golden-path/gate.mjs"]);
    assert.equal(Object.keys(tree).some((f) => f.startsWith(".github/workflows/")), false);
  });
  for (const args of [[], ["--unknown"], ["first", "second"]]) {
    test(`invalid CLI arguments are explicit: ${args}`, () => {
      const r = run(GENERATOR, ...args);
      assert.equal(r.status, 64);
      assert.match(r.stderr, /usage:/);
    });
  }
});
