import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { APP_RESOURCES, createRuntimeInspector, sourceIdentity } from "../runtime-info.mjs";
import { runtimeSchema } from "../engineering-schema.mjs";

const digest = text => createHash("sha256").update(text).digest("hex");
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "gp-runtime-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const directory = path.join(root, "examples", "mcp-app");
  fs.mkdirSync(path.join(directory, "dist"), { recursive: true });
  fs.mkdirSync(path.join(root, "plugin", "scripts"), { recursive: true });
  fs.writeFileSync(path.join(root, "plugin", "plugin.json"), '{"version":"3.1.0-preview.1"}');
  fs.writeFileSync(path.join(root, "plugin", "scripts", "gate.mjs"), "// gate\n");
  fs.writeFileSync(path.join(directory, "package.json"), '{"version":"0.1.0"}');
  fs.writeFileSync(path.join(directory, "server.mjs"), "// server\n");
  const target = path.join(root, "application");
  fs.mkdirSync(path.join(target, ".golden-path"), { recursive: true });
  const manifest = path.join(target, ".golden-path", "install-manifest.json");
  fs.writeFileSync(manifest, '{"version":"3.0.0","level":1}');
  function build(variant = "") {
    const source = sourceIdentity(directory);
    const build = digest(source + variant);
    const resources = {};
    for (const name of APP_RESOURCES) {
      const text = `<html data-runtime-source="${source}" data-runtime-build="${build}">${name}${variant}</html>`;
      fs.writeFileSync(path.join(directory, "dist", `${name}.html`), text);
      resources[name] = digest(text);
    }
    fs.writeFileSync(path.join(directory, "dist", "build-info.json"), JSON.stringify({ format: 1, source, build, resources }));
  }
  build();
  return { root, directory, target, manifest, build };
}

test("runtime diagnostics distinguish declared method, kit and App versions without writing or inferring protection", t => {
  const f = fixture(t);
  const before = fs.readFileSync(f.manifest, "utf8");
  const inspector = createRuntimeInspector(f.directory);
  const result = runtimeSchema.parse(inspector.inspect(f.target));
  assert.equal(result.status, "current");
  assert.equal(result.kitVersion, "3.1.0-preview.1");
  assert.equal(result.appVersion, "0.1.0");
  assert.equal(result.nodeVersion, process.version);
  assert.equal(result.installation.version, "3.0.0");
  assert.equal(result.installation.level, 1);
  assert.match(result.installation.detail, /not proof/);
  assert.match(result.detail, /not a latest-release/);
  assert.equal(result.runningSource, result.checkoutSource);
  assert.equal(result.runningSource, result.builtSource);
  assert.equal(result.runningBuild, result.builtBuild);
  assert.equal(fs.readFileSync(f.manifest, "utf8"), before);
  assert.deepEqual(fs.readdirSync(f.target).sort(), [".golden-path"]);
  assert.deepEqual(fs.readdirSync(path.join(f.target, ".golden-path")), ["install-manifest.json"]);
  assert.match(inspector.resource("engineering"), new RegExp(result.runningSource));
});

test("changed output with unchanged source requires restart and a different panel identity", t => {
  const f = fixture(t);
  const old = createRuntimeInspector(f.directory);
  const before = old.inspect(f.target);
  const html = old.resource("engineering");
  f.build("changed dependency output");
  const changed = old.inspect(f.target);
  assert.equal(changed.runningSource, changed.checkoutSource);
  assert.equal(changed.runningSource, before.runningSource);
  assert.notEqual(changed.runningBuild, changed.builtBuild);
  assert.equal(changed.status, "restart-required");
  assert.equal(old.resource("engineering"), html);
  const restarted = createRuntimeInspector(f.directory);
  assert.equal(restarted.inspect(f.target).status, "current");
  assert.match(restarted.resource("engineering"), new RegExp(`data-runtime-build="${changed.builtBuild}"`));
  assert.notEqual(restarted.resource("engineering"), html);
});

for (const damage of ["oversized source", "missing source", "malformed version"]) {
  test(`unavailable startup identity preserves diagnostics and withholds resources: ${damage}`, t => {
    const f = fixture(t);
    const file = path.join(f.directory, damage === "malformed version" ? "package.json" : "extra.json");
    if (damage === "oversized source") fs.writeFileSync(file, "x".repeat(2 * 1024 * 1024 + 1));
    if (damage === "missing source") fs.unlinkSync(path.join(f.root, "plugin", "scripts", "gate.mjs"));
    if (damage === "malformed version") fs.writeFileSync(file, "{broken");
    const inspector = createRuntimeInspector(f.directory);
    const result = runtimeSchema.parse(inspector.inspect(f.target));
    assert.equal(result.runningSource, null);
    assert.notEqual(result.status, "current");
    assert.match(result.detail, /could not be verified|unavailable/);
    assert.throws(() => inspector.resource("engineering"), /Build.*restart/);
    if (damage === "missing source") fs.writeFileSync(path.join(f.root, "plugin", "scripts", "gate.mjs"), "// gate\n");
    else if (damage === "malformed version") fs.writeFileSync(file, '{"version":"0.1.0"}');
    else fs.unlinkSync(file);
    f.build();
    assert.equal(inspector.inspect(f.target).status, "restart-required");
    assert.throws(() => inspector.resource("engineering"), /Build.*restart/);
    assert.equal(createRuntimeInspector(f.directory).inspect(f.target).status, "current");
  });
}

test("legacy copy-in level 3 is reported without upgrading the installation", t => {
  const f = fixture(t);
  const manifest = '{"version":"2.0.0","level":3}';
  fs.writeFileSync(f.manifest, manifest);
  const result = runtimeSchema.parse(createRuntimeInspector(f.directory).inspect(f.target));
  assert.equal(result.installation.status, "present");
  assert.equal(result.installation.level, 3);
  assert.equal(fs.readFileSync(f.manifest, "utf8"), manifest);
});

test("a running inspector keeps its startup UI while changed source requires rebuild then restart", t => {
  const f = fixture(t);
  const old = createRuntimeInspector(f.directory);
  const html = old.resource("engineering");
  fs.appendFileSync(path.join(f.directory, "server.mjs"), "// a reviewed change\n");
  assert.equal(old.inspect(f.target).status, "rebuild-required");
  f.build();
  const changed = old.inspect(f.target);
  assert.equal(changed.status, "restart-required");
  assert.notEqual(changed.runningSource, changed.checkoutSource);
  assert.equal(old.resource("engineering"), html);
  assert.notEqual(fs.readFileSync(path.join(f.directory, "dist", "engineering.html"), "utf8"), html);
  const restarted = createRuntimeInspector(f.directory);
  assert.equal(restarted.inspect(f.target).status, "current");
  assert.notEqual(restarted.resource("engineering"), html);
});

for (const damage of ["missing metadata", "malformed metadata", "future format", "tampered resource", "missing resource", "foreign panel identity", "foreign output identity"]) {
  test(`invalid builds remain explicit and require repair: ${damage}`, t => {
    const f = fixture(t);
    const file = path.join(f.directory, "dist", "build-info.json");
    if (damage === "missing metadata") fs.unlinkSync(file);
    if (damage === "malformed metadata") fs.writeFileSync(file, "{broken");
    if (damage === "future format") {
      const data = JSON.parse(fs.readFileSync(file, "utf8"));
      fs.writeFileSync(file, JSON.stringify({ ...data, format: 2 }));
    }
    if (damage === "tampered resource") fs.appendFileSync(path.join(f.directory, "dist", "engineering.html"), "changed");
    if (damage === "missing resource") fs.unlinkSync(path.join(f.directory, "dist", "engineering.html"));
    if (damage === "foreign panel identity" || damage === "foreign output identity") {
      const data = JSON.parse(fs.readFileSync(file, "utf8"));
      const text = `<html data-runtime-source="${damage === "foreign panel identity" ? "0".repeat(64) : data.source}" data-runtime-build="${damage === "foreign output identity" ? "0".repeat(64) : data.build}"></html>`;
      fs.writeFileSync(path.join(f.directory, "dist", "engineering.html"), text);
      data.resources.engineering = digest(text);
      fs.writeFileSync(file, JSON.stringify(data));
    }
    const inspector = createRuntimeInspector(f.directory);
    const result = runtimeSchema.parse(inspector.inspect(f.target));
    assert.equal(result.status, "rebuild-required");
    assert.match(result.detail, /could not be verified/);
    assert.match(result.next, /restart.*reopen/);
    assert.throws(() => inspector.resource("engineering"), /Build.*restart/);
    f.build();
    assert.equal(inspector.inspect(f.target).status, "restart-required");
    assert.throws(() => inspector.resource("engineering"), /Build.*restart/);
    assert.equal(createRuntimeInspector(f.directory).inspect(f.target).status, "current");
  });
}

test("a server started against stale output cannot begin serving a later rebuild without restarting", t => {
  const f = fixture(t);
  fs.appendFileSync(path.join(f.directory, "server.mjs"), "// changed before startup\n");
  const inspector = createRuntimeInspector(f.directory);
  assert.equal(inspector.inspect(f.target).status, "rebuild-required");
  assert.throws(() => inspector.resource("engineering"), /different source/);
  f.build();
  assert.equal(inspector.inspect(f.target).status, "restart-required");
  assert.throws(() => inspector.resource("engineering"), /different source/);
});

test("missing and malformed copy-in manifests are distinct, never silently replaced or upgraded", t => {
  const f = fixture(t);
  const inspector = createRuntimeInspector(f.directory);
  fs.writeFileSync(f.manifest, "{broken");
  assert.equal(inspector.inspect(f.target).installation.status, "unknown");
  assert.match(inspector.inspect(f.target).installation.detail, /unavailable/);
  assert.equal(fs.readFileSync(f.manifest, "utf8"), "{broken");
  fs.unlinkSync(f.manifest);
  assert.equal(inspector.inspect(f.target).installation.status, "missing");
  assert.equal(fs.existsSync(f.manifest), false);
  assert.equal(inspector.inspect(f.target).status, "current");
});

test("source identities normalize checkout line endings and report unreadable source rather than current compatibility", t => {
  const f = fixture(t);
  const inspector = createRuntimeInspector(f.directory);
  const before = sourceIdentity(f.directory);
  fs.writeFileSync(path.join(f.directory, "server.mjs"), "// server\r\n");
  assert.equal(sourceIdentity(f.directory), before);
  fs.unlinkSync(path.join(f.root, "plugin", "scripts", "gate.mjs"));
  const result = inspector.inspect(f.target);
  assert.equal(result.status, "unknown");
  assert.equal(result.checkoutSource, null);
  assert.match(result.detail, /ENOENT/);
  assert.throws(() => inspector.resource("arbitrary"), /Unknown App resource/);
});
