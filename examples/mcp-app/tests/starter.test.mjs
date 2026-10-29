import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, test } from "node:test";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { makeStarter } from "../../make-starter.mjs";
import { plannedFiles } from "../../../plugin/install.mjs";
import { configureApp, main, SERVER_NAME } from "../configure.mjs";
import { inspectEngineering } from "../engineering-report.mjs";
import { inspectionSchema } from "../engineering-schema.mjs";
import { DIRECTORY, ENGINEERING_RESOURCE, INSPECT_SESSION } from "../server.mjs";

const roots = [];
afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});
function scratch() {
  const root = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), "gp-starter-app-")));
  roots.push(root);
  return root;
}
function git(root, ...args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}
function starter() {
  const root = makeStarter(path.join(scratch(), "application with spaces"));
  git(root, "init", "-q");
  git(root, "config", "core.autocrlf", "false");
  git(root, "add", "-A");
  git(root, "-c", "user.name=Test", "-c", "user.email=test@example.invalid", "commit", "-qm", "Generated starter fixture");
  return root;
}
function writeConfig(root, content) {
  fs.writeFileSync(path.join(root, ".mcp.json"), content);
}

test("generated starter links optional setup without bundling or activating the App", () => {
  const root = starter();
  const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
  assert.match(readme, /\[optional visual App\]\(https:\/\/github\.com\/krnese\/golden-path\/blob\/main\/docs\/MCP-APP-SETUP\.md\)/);
  const setup = fs.readFileSync(path.resolve(DIRECTORY, "..", "..", "docs", "MCP-APP-SETUP.md"), "utf8");
  for (const expected of [/Optional: open the Golden Path MCP App/, /configure\.mjs --target \. --dry-run/,
    /configure\.mjs --target \.\r?\n/, /restart the MCP/, /lost when the panel reloads/,
    /does not upgrade the copied Golden Path method/, /remove only its server entry/,
    /creates `\.mcp\.json`/, /Chat: Open Customizations/, /## Migrating an older App registration/,
    /application repository root/, /do not keep both registrations/]) {
    assert.match(setup, expected);
  }
  assert.match(setup, /Not required for a new starter or a first-time setup/);
  for (const rel of [".mcp.json", ".vscode", "node_modules", ".golden-path/config.json", ".golden-path/state"]) {
    assert.equal(fs.existsSync(path.join(root, rel)), false, rel);
  }
});

test("starter landing page leads with the outcome and first task, not setup or migration", () => {
  const readme = fs.readFileSync(path.join(starter(), "README.md"), "utf8");
  assert.ok(readme.split(/\s+/).filter(Boolean).length <= 500, "Keep the landing page within 500 words.");
  assert.match(readme, /^# Start with an outcome, not just an empty repository\./);
  assert.match(readme, /Build with AI without handing over the definition of success/);
  assert.match(readme, /## What you get/);
  assert.match(readme, /Use this template > Create a new repository/);
  assert.match(readme, /Help me use Golden Path to build \[outcome\]/);
  assert.match(readme, /Don't change repository\s+> protections without my approval/);
  assert.match(readme, /You do not need it to start/);
  assert.doesNotMatch(readme, /migration|migrating|configure\.mjs|npm ci|```/i);
  const firstTask = readme.indexOf("## Start building");
  assert.ok(firstTask > 0 && firstTask < readme.indexOf("[optional visual App]"));
});

test("generated skill and task prompt carry shared bootstrap, team and brownfield guidance", () => {
  const root = starter();
  const files = plannedFiles({ level: 1 });
  for (const [rel, expected] of Object.entries(files)) {
    assert.equal(fs.readFileSync(path.join(root, ...rel.split("/")), "utf8"), expected, rel);
  }
  const adoption = files[".github/skills/golden-path/references/ADOPTION.md"];
  for (const expected of [/self-configuring, not self-authorizing/, /one engineering agreement per\s+change/,
    /## New application: guided bootstrap/, /build not configured/,
    /Drafting executable owner acceptance remains a separate reviewed change/,
    /## Multiple engineers: a shared agreement per change/, /same\s+latest owner-approved acceptance baseline/,
    /Normal implementation remains autonomous/, /do not automatically synchronize\s+GitHub CI or reviews/,
    /## Brownfield: strengthen one change without replacing the process/,
    /Record baseline failures separately/, /Repository-wide settings affect more than\s+the pilot/,
    /## Repository protection: preview, authorize, apply, verify/,
    /read the effective settings back/, /solo maintainer\s+cannot approve their own PR/]) {
    assert.match(adoption, expected);
  }
  const prompt = files[".github/prompts/golden-path-task.prompt.md"];
  assert.match(prompt, /existing issue\/PR and reviewed artifacts, not private chat/);
  assert.match(prompt, /brownfield work, inspect read-only first/);
  assert.match(prompt, /apply only with explicit permission/);
  const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
  assert.match(readme, /## Working with a team/);
  assert.match(readme, /## Already have an application\?/);
  assert.match(readme, /not an\s+automatic scaffolding or repository-hardening service/);
  assert.equal(fs.existsSync(path.join(root, ".github", "workflows")), false);
});

test("method-only inspection is schema-valid, read-only and honest about absent controls", () => {
  const root = starter();
  const before = git(root, "status", "--porcelain");
  const report = inspectionSchema.parse(inspectEngineering(root));
  assert.equal(report.session, null);
  assert.deepEqual(report.sessions, []);
  assert.equal(report.config.owner, "Not recorded");
  assert.equal(report.evidence.freshness, "unavailable");
  assert.ok(report.evidence.checks.every(check => check.status === "unavailable"));
  assert.ok(report.findings.some(check => check.name === "Golden Path configuration" && check.status === "unavailable"));
  assert.equal(report.findings.some(check => check.status === "passed"), false);
  assert.equal(report.files.includes(".golden-path/config.json"), false);
  assert.ok(report.relationships.every(link => link.to !== ".golden-path/config.json"));
  assert.equal(git(root, "status", "--porcelain"), before);
  assert.equal(fs.existsSync(path.join(root, ".golden-path", "state")), false);
  assert.equal(fs.existsSync(path.join(root, ".golden-path", "config.json")), false);
});

test("malformed existing gate configuration remains an explicit inspection error", () => {
  const root = starter();
  fs.writeFileSync(path.join(root, ".golden-path", "config.json"), "{not JSON");
  assert.throws(() => inspectEngineering(root), SyntaxError);
});

test("configuration preview writes nothing; explicit setup binds only the application and is idempotent", () => {
  const root = starter();
  const before = git(root, "status", "--porcelain");
  const preview = configureApp(root, { dryRun: true });
  assert.equal(preview.changed, false);
  assert.equal(git(root, "status", "--porcelain"), before);
  const configured = configureApp(root);
  const entry = configured.config.mcpServers[SERVER_NAME];
  assert.equal(configured.file, path.join(root, ".mcp.json"));
  assert.equal(fs.existsSync(path.join(root, ".vscode")), false);
  assert.deepEqual(entry.args.slice(1), ["--target", "."]);
  assert.deepEqual(entry.tools, ["inspect_golden_path_adoption", INSPECT_SESSION]);
  assert.equal(JSON.stringify(entry).includes("${"), false);
  assert.equal(entry.args.includes("--state"), false);
  assert.equal(path.resolve(root, entry.args[0]), path.join(DIRECTORY, "server.mjs"));
  const bytes = fs.readFileSync(configured.file, "utf8");
  assert.equal(configureApp(root).changed, false);
  assert.equal(fs.readFileSync(configured.file, "utf8"), bytes);
  assert.equal(fs.existsSync(path.join(root, ".golden-path", "config.json")), false);
});

for (const content of ['{"mcpServers":{"other":{"command":"keep"}}}', '{\n// keep my JSONC\n"mcpServers":{}\n}', "{broken", "null"]) {
  test(`existing MCP configuration is preserved on conflict: ${content.slice(0, 25)}`, () => {
    const root = scratch();
    writeConfig(root, content);
    assert.ok(configureApp(root, { dryRun: true }).config.mcpServers[SERVER_NAME]);
    assert.throws(() => configureApp(root), /nothing was overwritten/);
    assert.equal(fs.readFileSync(path.join(root, ".mcp.json"), "utf8"), content);
  });
}

test("an already matching entry preserves other servers and formatting byte-for-byte", () => {
  const root = scratch();
  const config = configureApp(root, { dryRun: true }).config;
  config.mcpServers.other = { command: "keep" };
  const content = JSON.stringify(config, null, 4);
  writeConfig(root, content);
  assert.equal(configureApp(root).changed, false);
  assert.equal(fs.readFileSync(path.join(root, ".mcp.json"), "utf8"), content);
});

test("setup refuses linked portable configurations instead of writing outside the application", () => {
  const root = scratch(), outside = scratch();
  fs.symlinkSync(outside, path.join(root, ".mcp.json"), process.platform === "win32" ? "junction" : "dir");
  assert.throws(() => configureApp(root), /nothing was overwritten/);
  assert.deepEqual(fs.readdirSync(outside), []);
});

for (const content of ['{"servers":{"golden-path-experience":{"command":"node"}}}', '{\n// legacy JSONC\n"servers":{}\n}']) {
  test("legacy configuration requires explicit migration and is never silently duplicated", () => {
    const root = scratch();
    fs.mkdirSync(path.join(root, ".vscode"));
    const legacy = path.join(root, ".vscode", "mcp.json");
    fs.writeFileSync(legacy, content);
    assert.ok(configureApp(root, { dryRun: true }).config.mcpServers[SERVER_NAME]);
    assert.throws(() => configureApp(root), /Review\/migrate.*avoid duplicate registrations/);
    assert.equal(fs.readFileSync(legacy, "utf8"), content);
    assert.equal(fs.existsSync(path.join(root, ".mcp.json")), false);
  });
}

test("a relative registration survives moving the application and kit together", () => {
  const container = scratch();
  const kit = path.join(container, "kit");
  fs.mkdirSync(path.join(kit, "dist"), { recursive: true });
  fs.copyFileSync(path.join(DIRECTORY, "configure.mjs"), path.join(kit, "configure.mjs"));
  for (const name of ["app", "engineering"]) fs.writeFileSync(path.join(kit, "dist", `${name}.html`), "");
  const root = path.join(container, "application with spaces");
  fs.mkdirSync(root);
  const result = spawnSync(process.execPath, [path.join(kit, "configure.mjs"), "--target", root], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  const bytes = fs.readFileSync(path.join(root, ".mcp.json"), "utf8");
  const entry = JSON.parse(bytes).mcpServers[SERVER_NAME];
  assert.equal(path.isAbsolute(entry.args[0]), false);
  assert.ok(entry.args[0].startsWith("./"));
  const moved = path.join(scratch(), "relocated");
  fs.renameSync(container, moved);
  const movedRoot = path.join(moved, "application with spaces");
  assert.equal(fs.readFileSync(path.join(movedRoot, ".mcp.json"), "utf8"), bytes);
  assert.equal(path.resolve(movedRoot, entry.args[0]), path.join(moved, "kit", "server.mjs"));
  assert.equal(path.resolve(movedRoot, entry.args[2]), movedRoot);
});

test("setup fails explicitly for missing arguments and an unbuilt kit", () => {
  assert.equal(main([]), 2);
  assert.equal(main(["--unknown"]), 2);
  const root = scratch();
  const helper = path.join(root, "configure.mjs");
  fs.copyFileSync(path.join(DIRECTORY, "configure.mjs"), helper);
  const result = spawnSync(process.execPath, [helper, "--target", root], { encoding: "utf8" });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Build the MCP App first/);
  assert.equal(fs.existsSync(path.join(root, ".vscode")), false);
  assert.equal(fs.existsSync(path.join(root, ".mcp.json")), false);
});

test("the configured server exposes the current App for a real generated method-only starter", async () => {
  const root = starter();
  const { config } = configureApp(root);
  const entry = config.mcpServers[SERVER_NAME];
  const before = git(root, "status", "--porcelain");
  const client = new Client({ name: "starter-app-test", version: "0.1.0" });
  try {
    await client.connect(new StdioClientTransport({
      command: entry.command,
      args: entry.args,
      cwd: root,
    }));
    const tools = (await client.listTools()).tools;
    assert.deepEqual(tools.map(tool => tool.name).sort(), ["inspect_golden_path_adoption", INSPECT_SESSION].sort());
    assert.ok(tools.every(tool => tool.annotations.readOnlyHint));
    const response = await client.callTool({ name: INSPECT_SESSION, arguments: {} });
    assert.notEqual(response.isError, true);
    const report = inspectionSchema.parse(response.structuredContent.inspection);
    assert.equal(report.root, fs.realpathSync(root));
    assert.ok(report.evidence.checks.every(check => check.status === "unavailable"));
    const resource = await client.readResource({ uri: ENGINEERING_RESOURCE });
    assert.match(resource.contents[0].text, /Agreement delta/);
    assert.match(resource.contents[0].text, /Why does this exist/);
    assert.match(resource.contents[0].text, /No gate configuration installed/);
    assert.equal(git(root, "status", "--porcelain"), before);
  } finally {
    await client.close();
  }
});

test("the committed native registration starts the read-only server from the kit workspace", async (t) => {
  const root = path.resolve(DIRECTORY, "..", "..");
  const config = JSON.parse(fs.readFileSync(path.join(root, ".mcp.json"), "utf8"));
  assert.equal(fs.existsSync(path.join(root, ".vscode", "mcp.json")), false);
  const entry = config.mcpServers["golden-path-experience-preview"];
  assert.deepEqual(entry.tools, ["inspect_golden_path_adoption", INSPECT_SESSION]);
  assert.equal(JSON.stringify(entry).includes("${"), false);
  const client = new Client({ name: "native-workspace-test", version: "0.1.0" });
  t.after(() => client.close());
  await client.connect(new StdioClientTransport({ command: entry.command, args: entry.args, cwd: root }));
  const tools = (await client.listTools()).tools;
  assert.deepEqual(tools.map(tool => tool.name).sort(), [...entry.tools].sort());
  assert.ok(tools.every(tool => tool.annotations.readOnlyHint));
  const response = await client.callTool({ name: INSPECT_SESSION, arguments: {} });
  assert.notEqual(response.isError, true);
  assert.equal(inspectionSchema.parse(response.structuredContent.inspection).root, fs.realpathSync(root));
  const resource = await client.readResource({ uri: ENGINEERING_RESOURCE });
  assert.match(resource.contents[0].text, /Agreement delta/);
});
