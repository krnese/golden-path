import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { APP_RESOURCES } from "../runtime-info.mjs";
import { afterEach, test } from "node:test";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { DIRECTORY, RESOURCE, TOOL, INSPECT_SESSION } from "../server.mjs";
import { startPreview } from "../preview.mjs";

const scratch = [];
afterEach(() => {
  for (const root of scratch.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});
function fixture() {
  const root = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), "gp-mcp-app-")));
  scratch.push(root);
  fs.mkdirSync(path.join(root, ".golden-path"));
  fs.mkdirSync(path.join(root, "acceptance"));
  fs.writeFileSync(path.join(root, "acceptance", "rule.test.mjs"), "owner example\n");
  fs.writeFileSync(path.join(root, ".golden-path", "config.json"), JSON.stringify({
    check: 'node -e "require(\'node:fs\').writeFileSync(\'unexpected\', \'executed\')"',
    acceptance: { paths: ["acceptance/**"], owner: "@owner", command: "deliberately-not-a-command" },
  }));
  for (const args of [["init", "-q"], ["config", "core.autocrlf", "false"], ["add", "-A"],
    ["-c", "user.name=Test", "-c", "user.email=test@example.invalid", "commit", "-qm", "baseline"]]) {
    const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
  }
  return root;
}
function snapshot(root) {
  const files = {};
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === ".git") continue;
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else files[path.relative(root, file)] = fs.readFileSync(file).toString("base64");
    }
  }
  walk(root);
  return files;
}
async function connect(t, root, apps = true, directory = DIRECTORY) {
  const client = new Client({ name: "golden-path-test", version: "0.1.0" },
    { capabilities: apps ? { extensions: { "io.modelcontextprotocol/ui": { mimeTypes: [RESOURCE_MIME_TYPE] } } } : {} });
  t.after(() => client.close());
  await client.connect(new StdioClientTransport({
    command: process.execPath, args: [path.join(directory, "server.mjs"), "--target", root],
  }));
  return client;
}

test("the real stdio server advertises read-only, target-bound inspection tools", async (t) => {
  const client = await connect(t, fixture());
  const { tools } = await client.listTools();
  assert.equal(tools.length, 2);
  assert.equal(tools[0].name, TOOL);
  assert.equal(tools[0]._meta.ui.resourceUri, RESOURCE);
  assert.deepEqual(tools[0]._meta.ui.visibility, ["model", "app"]);
  assert.equal(tools[0].annotations.readOnlyHint, true);
  assert.equal(tools[0].inputSchema.additionalProperties, false);
  assert.equal(tools.find((x) => x.name === INSPECT_SESSION).annotations.readOnlyHint, true);
});

function kitFixture() {
  const kit = fs.mkdtempSync(path.join(os.tmpdir(), "gp-running-kit-"));
  scratch.push(kit);
  const directory = path.join(kit, "examples", "mcp-app");
  fs.mkdirSync(path.join(directory, "dist"), { recursive: true });
  fs.mkdirSync(path.join(kit, "plugin", "scripts"), { recursive: true });
  for (const entry of fs.readdirSync(DIRECTORY, { withFileTypes: true })) {
    if (entry.isFile() && /\.(mjs|html|css|json)$/.test(entry.name)) {
      fs.copyFileSync(path.join(DIRECTORY, entry.name), path.join(directory, entry.name));
    }
  }
  for (const name of [...APP_RESOURCES.map(name => `${name}.html`), "build-info.json"]) {
    fs.copyFileSync(path.join(DIRECTORY, "dist", name), path.join(directory, "dist", name));
  }
  for (const file of ["plugin.json", path.join("scripts", "gate.mjs")]) {
    fs.copyFileSync(path.resolve(DIRECTORY, "..", "..", "plugin", file), path.join(kit, "plugin", file));
  }
  fs.symlinkSync(path.join(DIRECTORY, "node_modules"), path.join(directory, "node_modules"),
    process.platform === "win32" ? "junction" : "dir");
  return { kit, directory };
}

test("a real running server retains its UI through checkout changes, rebuild and resource damage", async t => {
  const root = fixture();
  const before = snapshot(root);
  const { kit, directory } = kitFixture();
  const client = await connect(t, root, true, directory);
  const inspect = async client => (await client.callTool({ name: INSPECT_SESSION, arguments: {} })).structuredContent.inspection.runtime;
  const uri = "ui://golden-path/engineering.html";
  const resource = async client => (await client.readResource({ uri })).contents[0].text;
  const original = await resource(client);
  assert.equal((await inspect(client)).status, "current");
  fs.appendFileSync(path.join(directory, "server.mjs"), "\n// Reviewed fixture checkout change.\n");
  fs.appendFileSync(path.join(directory, "engineering.mjs"), '\nimport "../../dependency.mjs";\n');
  fs.writeFileSync(path.join(kit, "dependency.mjs"), 'console.log("fixture dependency one");\n');
  assert.equal((await inspect(client)).status, "rebuild-required");
  const build = spawnSync(process.execPath, [path.join(directory, "build.mjs")], { encoding: "utf8", timeout: 30000 });
  assert.equal(build.status, 0, build.stderr);
  assert.equal((await inspect(client)).status, "restart-required");
  assert.equal(await resource(client), original);
  const restarted = await connect(t, root, true, directory);
  const fresh = await inspect(restarted);
  assert.equal(fresh.status, "current");
  const freshResource = await resource(restarted);
  assert.notEqual(freshResource, original);
  assert.match(freshResource, new RegExp(`data-runtime-source="${fresh.runningSource}"`));
  assert.match(freshResource, new RegExp(`data-runtime-build="${fresh.runningBuild}"`));
  fs.writeFileSync(path.join(kit, "dependency.mjs"), 'console.log("fixture dependency two");\n');
  const rebuilt = spawnSync(process.execPath, [path.join(directory, "build.mjs")], { encoding: "utf8", timeout: 30000 });
  assert.equal(rebuilt.status, 0, rebuilt.stderr);
  const dependencyChange = await inspect(restarted);
  assert.equal(dependencyChange.runningSource, dependencyChange.checkoutSource);
  assert.notEqual(dependencyChange.runningBuild, dependencyChange.builtBuild);
  assert.equal(dependencyChange.status, "restart-required");
  assert.equal(await resource(restarted), freshResource);
  const latest = await connect(t, root, true, directory);
  const latestResource = await resource(latest);
  assert.equal((await inspect(latest)).status, "current");
  assert.notEqual(latestResource, freshResource);
  assert.match(latestResource, /fixture dependency two/);
  fs.writeFileSync(path.join(directory, "dist", "engineering.html"), "damaged output");
  assert.equal((await inspect(latest)).status, "rebuild-required");
  assert.equal(await resource(latest), latestResource);
  assert.deepEqual(snapshot(root), before);
});

test("a real server with unavailable startup identity still exposes diagnostics but not UI", async t => {
  const root = fixture();
  const before = snapshot(root);
  const { directory } = kitFixture();
  fs.writeFileSync(path.join(directory, "extra.json"), "x".repeat(2 * 1024 * 1024 + 1));
  const client = await connect(t, root, true, directory);
  const tools = (await client.listTools()).tools;
  assert.equal(tools.length, 2);
  for (const name of [TOOL, INSPECT_SESSION]) {
    const result = await client.callTool({ name, arguments: {} });
    assert.notEqual(result.isError, true);
    const runtime = result.structuredContent.runtime || result.structuredContent.inspection.runtime;
    assert.equal(runtime.status, "unknown");
    assert.equal(runtime.runningSource, null);
    assert.match(runtime.detail, /diagnostic limit/);
  }
  await assert.rejects(client.readResource({ uri: "ui://golden-path/engineering.html" }), /diagnostic limit/);
  assert.deepEqual(snapshot(root), before);
});

test("the resource is the built, self-contained MCP App with no external resource permissions", async (t) => {
  const client = await connect(t, fixture());
  assert.ok((await client.listResources()).resources.some((r) => r.uri === RESOURCE));
  const { contents } = await client.readResource({ uri: RESOURCE });
  assert.equal(contents.length, 1);
  assert.equal(contents[0].mimeType, RESOURCE_MIME_TYPE);
  assert.match(contents[0].text, /Keep judgment with the owner/);
  assert.match(contents[0].text, /<script type="module">/);
  assert.doesNotMatch(contents[0].text, /<script[^>]+src=["']https?:/);
  assert.deepEqual(contents[0]._meta.ui.csp, { connectDomains: [], resourceDomains: [] });
});

for (const name of ["app", "architecture", "engineering", "host"]) {
  test(`the bundled ${name} script retains valid JavaScript when embedded in HTML`, () => {
    const html = fs.readFileSync(path.join(DIRECTORY, "dist", `${name}.html`), "utf8");
    const script = html.match(/<script type="module">([\s\S]*)<\/script>/)?.[1];
    assert.ok(script, "Missing bundled module");
    const result = spawnSync(process.execPath, ["--input-type=module", "--check"], { input: script, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    assert.doesNotMatch(html, /<!-- SCRIPT -->/);
  });
}

test("inspection returns honest evidence, never executes commands and leaves the repository unchanged", async (t) => {
  const root = fixture();
  const before = snapshot(root);
  const client = await connect(t, root);
  const result = await client.callTool({ name: TOOL, arguments: {} });
  assert.notEqual(result.isError, true);
  const { report, inspectedAt } = result.structuredContent;
  assert.equal(result.structuredContent.runtime.status, "current");
  assert.equal(result.structuredContent.runtime.installation.status, "missing");
  assert.equal(client.getServerVersion().version, result.structuredContent.runtime.appVersion);
  assert.equal(fs.realpathSync.native(report.root), root);
  assert.match(report.head, /^[a-f0-9]{40}$/);
  assert.ok(Number.isFinite(Date.parse(inspectedAt)));
  const status = (id) => report.checks.find((c) => c.id === id).status;
  assert.equal(status("acceptance-paths"), "verified");
  assert.equal(status("hook-invocation"), "unverified");
  assert.equal(status("owner-judgment"), "unverified");
  assert.equal(status("github-required-checks"), "unverified");
  for (const field of ["ok", "ready", "approved", "protected"]) assert.equal(field in report, false);
  assert.deepEqual(snapshot(root), before);
});

test("a host without MCP Apps still receives useful, explicit text evidence", async (t) => {
  const client = await connect(t, fixture(), false);
  const result = await client.callTool({ name: TOOL, arguments: {} });
  assert.notEqual(result.isError, true);
  assert.match(result.content[0].text, /Configuration evidence only/);
  assert.match(result.content[0].text, /\[UNVERIFIED\] owner-judgment/);
});

test("tool arguments cannot redirect inspection to another repository", async (t) => {
  const root = fixture();
  const other = fixture();
  const before = snapshot(other);
  const client = await connect(t, root);
  const result = await client.callTool({ name: TOOL, arguments: { target: other } });
  assert.equal(result.isError, true);
  assert.equal(result.structuredContent, undefined);
  assert.deepEqual(snapshot(other), before);
});

test("an unavailable repository returns an explicit tool error, not empty successful evidence", async (t) => {
  const root = fixture();
  const client = await connect(t, root);
  fs.rmSync(root, { recursive: true });
  const result = await client.callTool({ name: TOOL, arguments: {} });
  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /Inspection failed:/);
  assert.equal(result.structuredContent, undefined);
});

test("startup without an explicit target fails without emitting protocol-shaped success", () => {
  const result = spawnSync(process.execPath, [path.join(DIRECTORY, "server.mjs")], { encoding: "utf8" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Usage:/);
  assert.equal(result.stdout, "");
});

test("the loopback validation host uses real MCP resources and refuses foreign origins", async (t) => {
  const root = fixture();
  const before = snapshot(root);
  const preview = await startPreview(root, 0);
  t.after(() => preview.close());
  const host = await fetch(preview.url);
  assert.equal(host.status, 200);
  assert.match(await host.text(), /sandbox="allow-scripts"/);
  const app = await fetch(`${preview.url}/app`);
  assert.equal(app.status, 200);
  assert.match(app.headers.get("content-security-policy"), /default-src 'none'/);
  assert.match(await app.text(), /Keep judgment with the owner/);
  const report = await fetch(`${preview.url}/report`, { method: "POST" });
  assert.equal(report.status, 200);
  assert.ok((await report.json()).structuredContent.report.checks.length > 0);
  const foreign = await fetch(`${preview.url}/report`, { method: "POST", headers: { Origin: "https://example.invalid" } });
  assert.equal(foreign.status, 403);
  assert.deepEqual(snapshot(root), before);
});
