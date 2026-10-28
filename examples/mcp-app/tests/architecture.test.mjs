import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { request } from "node:http";
import { spawnSync } from "node:child_process";
import { afterEach, test } from "node:test";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { DIRECTORY, ARCHITECTURE_RESOURCE, READ_MODEL, UPDATE_MODEL } from "../server.mjs";
import { readArchitecture, updateDraft } from "../architecture-state.mjs";
import { startPreview } from "../preview.mjs";

const scratch = [];
afterEach(() => {
  for (const root of scratch.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});
function fixture() {
  const root = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), "gp-architecture-")));
  scratch.push(root);
  const state = path.join(root, "model.json");
  fs.copyFileSync(path.join(DIRECTORY, "example-model.json"), state);
  return { root, state };
}
async function connect(t, { root, state }) {
  const client = new Client({ name: "architecture-test", version: "0.1.0" });
  t.after(() => client.close());
  await client.connect(new StdioClientTransport({
    command: process.execPath, args: [path.join(DIRECTORY, "server.mjs"), "--target", root, "--state", state],
  }));
  return client;
}
const change = (extra = {}) => ({
  collection: "requirements", id: "R1", expectedRevision: 0,
  text: "Inspect requirements and linked components before changing the draft.",
  rationale: "Keep one persisted model for the app and the conversation.",
  ...extra,
});

test("architecture tools are explicit and the write tool is not labelled read-only", async (t) => {
  const client = await connect(t, fixture());
  const { tools } = await client.listTools();
  assert.equal(tools.length, 3);
  assert.equal(tools.find((x) => x.name === READ_MODEL)._meta.ui.resourceUri, ARCHITECTURE_RESOURCE);
  assert.equal(tools.find((x) => x.name === UPDATE_MODEL).annotations.readOnlyHint, false);
  assert.equal(tools.find((x) => x.name === UPDATE_MODEL).annotations.idempotentHint, false);
  const resource = await client.readResource({ uri: ARCHITECTURE_RESOURCE });
  assert.match(resource.contents[0].text, /Shape the draft/);
});

test("two independent MCP clients and the file see the same persisted draft revision", async (t) => {
  const f = fixture();
  const baseline = readArchitecture(f.state).model;
  const ui = await connect(t, f);
  const conversation = await connect(t, f);
  const result = await ui.callTool({ name: UPDATE_MODEL, arguments: change() });
  assert.notEqual(result.isError, true);
  assert.equal(result.structuredContent.model.revision, 1);
  const reloaded = await conversation.callTool({ name: READ_MODEL, arguments: {} });
  assert.deepEqual(reloaded.structuredContent, result.structuredContent);
  assert.deepEqual(JSON.parse(fs.readFileSync(f.state, "utf8")), result.structuredContent.model);
  assert.equal(reloaded.structuredContent.model.requirements[0].text, change().text);
  assert.deepEqual(reloaded.structuredContent.model.requirements[1], baseline.requirements[1]);
  assert.deepEqual(reloaded.structuredContent.model.assumptions, baseline.assumptions);
  assert.equal(result.structuredContent.model.requirements[0].status, "draft");
  assert.equal(fs.existsSync(`${f.state}.lock`), false);
  assert.deepEqual(fs.readdirSync(f.root), ["model.json"]);
});

test("a stale conversation cannot overwrite a draft saved through another client", async (t) => {
  const f = fixture();
  const first = await connect(t, f);
  const second = await connect(t, f);
  await first.callTool({ name: UPDATE_MODEL, arguments: change() });
  const before = fs.readFileSync(f.state, "utf8");
  const stale = await second.callTool({ name: UPDATE_MODEL, arguments: change({ text: "Stale edit" }) });
  assert.equal(stale.isError, true);
  assert.match(stale.content[0].text, /revision changed from 0 to 1/);
  assert.equal(fs.readFileSync(f.state, "utf8"), before);
});

test("locked baseline records cannot be edited or promoted through the draft API", async (t) => {
  const f = fixture();
  const client = await connect(t, f);
  const before = fs.readFileSync(f.state, "utf8");
  const locked = await client.callTool({ name: UPDATE_MODEL, arguments: change({ id: "R2" }) });
  assert.equal(locked.isError, true);
  assert.match(locked.content[0].text, /Baseline items are locked/);
  const promote = await client.callTool({ name: UPDATE_MODEL, arguments: { ...change(), status: "approved" } });
  assert.equal(promote.isError, true);
  assert.equal(fs.readFileSync(f.state, "utf8"), before);
});

test("assumption edits persist without rewriting their requirement links", () => {
  const { state } = fixture();
  const before = readArchitecture(state).model;
  const after = updateDraft(state, change({
    collection: "assumptions", id: "A1", text: "The interactive review may reveal assumptions earlier.",
  })).model;
  assert.equal(after.revision, 1);
  assert.deepEqual(after.requirements, before.requirements);
  assert.deepEqual(after.assumptions[0].requirementIds, before.assumptions[0].requirementIds);
});

test("the cross-process lock rejects another writer instead of losing an update", () => {
  const { state } = fixture();
  const before = fs.readFileSync(state, "utf8");
  fs.writeFileSync(`${state}.lock`, "another writer");
  assert.throws(() => updateDraft(state, change()), /model is busy/);
  assert.equal(fs.readFileSync(state, "utf8"), before);
  assert.equal(fs.readFileSync(`${state}.lock`, "utf8"), "another writer");
});

test("invalid models, duplicate IDs and broken links are errors rather than replacement defaults", () => {
  const { state } = fixture();
  const original = JSON.parse(fs.readFileSync(state, "utf8"));
  fs.writeFileSync(state, "{");
  assert.throws(() => readArchitecture(state), SyntaxError);
  const duplicate = structuredClone(original);
  duplicate.requirements.push(duplicate.requirements[0]);
  fs.writeFileSync(state, JSON.stringify(duplicate));
  assert.throws(() => readArchitecture(state), /Duplicate IDs/);
  original.requirements[0].componentIds = ["missing"];
  fs.writeFileSync(state, JSON.stringify(original));
  assert.throws(() => readArchitecture(state), /missing requirement or component/);
});

test("initialization creates a separate example and refuses to overwrite an existing model", () => {
  const f = fixture();
  const destination = path.join(f.root, "fresh.json");
  const command = [path.join(DIRECTORY, "init-demo.mjs"), "--state", destination];
  const first = spawnSync(process.execPath, command, { encoding: "utf8" });
  assert.equal(first.status, 0, first.stderr);
  const before = fs.readFileSync(destination, "utf8");
  const second = spawnSync(process.execPath, command, { encoding: "utf8" });
  assert.equal(second.status, 2);
  assert.match(second.stderr, /never overwritten/);
  assert.equal(fs.readFileSync(destination, "utf8"), before);
});

test("the browser host and MCP reader share one model, and browser writes require the exact origin", async (t) => {
  const f = fixture();
  const preview = await startPreview(f.root, 0, f.state);
  t.after(() => preview.close());
  const reader = await connect(t, f);
  const host = await fetch(preview.url);
  assert.match(await host.text(), /data-view="architecture"/);
  const foreign = await fetch(`${preview.url}/model`, {
    method: "POST", headers: { "Content-Type": "application/json", Origin: "https://example.invalid" },
    body: JSON.stringify(change()),
  });
  assert.equal(foreign.status, 403);
  assert.equal(readArchitecture(f.state).model.revision, 0);
  const saved = await fetch(`${preview.url}/model`, {
    method: "POST", headers: { "Content-Type": "application/json", Origin: preview.url },
    body: JSON.stringify(change()),
  });
  const result = await saved.json();
  assert.notEqual(result.isError, true);
  const current = await reader.callTool({ name: READ_MODEL, arguments: {} });
  assert.deepEqual(current.structuredContent, result.structuredContent);
});

test("Unicode drafts survive split UTF-8 request chunks and the full permitted field lengths", async (t) => {
  const f = fixture();
  const preview = await startPreview(f.root, 0, f.state);
  t.after(() => preview.close());
  const input = change({ text: "\u20ac".repeat(4000), rationale: "\u8a9e".repeat(8000) });
  const payload = Buffer.from(JSON.stringify(input));
  const split = payload.indexOf(Buffer.from("\u20ac")) + 1;
  const response = await new Promise((resolve, reject) => {
    const req = request(`${preview.url}/model`, {
      method: "POST", headers: { "Content-Type": "application/json", Origin: preview.url },
    }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => resolve({ status: res.statusCode, body }));
      res.on("error", reject);
    });
    req.on("error", reject);
    req.write(payload.subarray(0, split));
    setImmediate(() => req.end(payload.subarray(split)));
  });
  assert.equal(response.status, 200, response.body);
  const saved = JSON.parse(response.body);
  assert.notEqual(saved.isError, true);
  assert.equal(saved.structuredContent.model.requirements[0].text, input.text);
  assert.equal(saved.structuredContent.model.requirements[0].rationale, input.rationale);
  assert.equal(readArchitecture(f.state).model.revision, 1);
});

test("oversized preview writes fail explicitly without changing the saved model", async (t) => {
  const f = fixture();
  const preview = await startPreview(f.root, 0, f.state);
  t.after(() => preview.close());
  const before = fs.readFileSync(f.state, "utf8");
  const response = await fetch(`${preview.url}/model`, {
    method: "POST", headers: { "Content-Type": "application/json", Origin: preview.url },
    body: " ".repeat(128 * 1024 + 1),
  });
  assert.equal(response.status, 500);
  assert.match(await response.text(), /Draft update exceeds/);
  assert.equal(fs.readFileSync(f.state, "utf8"), before);
});
