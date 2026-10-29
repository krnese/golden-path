import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";
import { adoptionReport } from "../../plugin/scripts/gate.mjs";
import { readArchitecture, updateDraft } from "./architecture-state.mjs";
import { modelSchema, updateSchema } from "./architecture-model.mjs";
import { inspectEngineering } from "./engineering-report.mjs";
import { inspectRepository } from "./repository-context.mjs";
import { inspectionInput, inspectionSchema, sessionIdSchema } from "./engineering-schema.mjs";

export const TOOL = "inspect_golden_path_adoption";
export const RESOURCE = "ui://golden-path/adoption.html";
export const DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
export const ARCHITECTURE_RESOURCE = "ui://golden-path/architecture.html";
export const READ_MODEL = "inspect_architecture";
export const UPDATE_MODEL = "update_architecture_draft";
export const ENGINEERING_RESOURCE = "ui://golden-path/engineering.html";
export const INSPECT_SESSION = "inspect_engineering_session";

export function optionsFromArgs(args) {
  const { values } = parseArgs({ args, options: { target: { type: "string" }, state: { type: "string" }, session: { type: "string" } }, allowPositionals: false });
  if (!values.target) throw new Error("Usage: node server.mjs --target <application-repository>");
  const target = fs.realpathSync(values.target);
  if (!fs.statSync(target).isDirectory()) throw new Error(`Not a directory: ${target}`);
  const state = values.state ? readArchitecture(values.state).statePath : undefined;
  const session = values.session ? sessionIdSchema.parse(values.session) : undefined;
  if (state && session) throw new Error("Choose either an isolated architecture example or an engineering session.");
  return { target, state, session };
}

export function createServer(target, { state, session } = {}) {
  const server = new McpServer({ name: "golden-path-adoption-prototype", version: "0.1.0" });
  registerAppTool(server, TOOL, {
    title: "Inspect Golden Path adoption",
    description: "Read local adoption configuration for the repository selected when this server started. Returns individual verified, missing and unverified findings, not an overall protection verdict. Does not run project checks, query GitHub, write files or approve acceptance.",
    inputSchema: z.object({}).strict(),
    outputSchema: z.object({
      report: z.object({
        root: z.string(),
        head: z.string().nullable(),
        checks: z.array(z.object({
          id: z.string(), status: z.enum(["verified", "missing", "unverified"]),
          evidence: z.string(), next: z.string(),
        })),
      }),
      inspectedAt: z.string(),
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _meta: { ui: { resourceUri: RESOURCE, visibility: ["model", "app"] } },
  }, async () => {
    try {
      const report = adoptionReport(target);
      return {
        content: [{ type: "text", text: [
          `Golden Path adoption: ${report.root}`,
          `Revision: ${report.head || "unverified"}`,
          "Configuration evidence only. No project checks run; business approval is not established.",
          ...report.checks.map((c) => `[${c.status.toUpperCase()}] ${c.id}: ${c.evidence}\nNext: ${c.next}`),
        ].join("\n\n") }],
        structuredContent: { report, inspectedAt: new Date().toISOString() },
      };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: `Inspection failed: ${error.message}` }] };
    }
  });
  registerAppResource(server, RESOURCE, RESOURCE, { mimeType: RESOURCE_MIME_TYPE }, async () => ({
    contents: [{
      uri: RESOURCE, mimeType: RESOURCE_MIME_TYPE,
      text: fs.readFileSync(path.join(DIRECTORY, "dist", "app.html"), "utf8"),
      _meta: { ui: { csp: { connectDomains: [], resourceDomains: [] }, prefersBorder: true } },
    }],
  }));
  registerAppTool(server, INSPECT_SESSION, {
    title: "Inspect Golden Path engineering work",
    description: "Read local work, acceptance, baseline changes, retained checks and repository setup. Without sessionId, list sessions for selection. Optional brief carries a proposed draft from the existing conversation, never approval; do not invent missing fields. Optional github:true explicitly reads live GitHub state through the existing gh credentials; default inspection is offline. Optional file/view reads listed artifacts only. Does not execute project checks, modify records or infer approval. Missing evidence remains unavailable.",
    inputSchema: inspectionInput,
    outputSchema: z.object({ inspection: inspectionSchema }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    _meta: { ui: { resourceUri: ENGINEERING_RESOURCE, visibility: ["model", "app"] } },
  }, async (input) => {
    try {
      const inspection = inspectEngineering(target, { ...input, sessionId: input.sessionId || session });
      inspection.repository = await inspectRepository(inspection.root, { github: input.github === true });
      if (input.brief) inspection.brief = input.brief;
      return { content: [{ type: "text", text: [
        inspection.handoff,
        `Repository pulse observed ${inspection.repository.inspectedAt}; local definitions are not execution or enforcement.`,
        ...inspection.repository.local.map(item => `${item.name}: ${item.status.toUpperCase()}. ${item.detail}`),
        `GitHub snapshot: ${inspection.repository.github.inspectedAt || "not requested"}.`,
        ...inspection.repository.github.facts.map(item => `${item.name}: ${item.status.toUpperCase()}. ${item.detail}${item.url ? ` Source: ${item.url}` : ""}`),
        ...(inspection.brief ? ["A proposed brief from the conversation is available for explicit review in Guided. It is not approval."] : []),
      ].join("\n") }], structuredContent: { inspection } };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: `Engineering inspection failed: ${error.message}` }] };
    }
  });
  registerAppResource(server, ENGINEERING_RESOURCE, ENGINEERING_RESOURCE, { mimeType: RESOURCE_MIME_TYPE }, async () => ({
    contents: [{
      uri: ENGINEERING_RESOURCE, mimeType: RESOURCE_MIME_TYPE,
      text: fs.readFileSync(path.join(DIRECTORY, "dist", "engineering.html"), "utf8"),
      _meta: { ui: { csp: { connectDomains: [], resourceDomains: [] }, prefersBorder: true } },
    }],
  }));
  if (state) {
    readArchitecture(state);
    const result = (data) => ({
      content: [{ type: "text", text: [
        `Isolated example architecture model: ${data.statePath}`,
        `Revision: ${data.model.revision}. Draft edits are not business approval.`,
        "Before further architecture reasoning, reload inspect_architecture. The UI and conversation use this same persisted model.",
        JSON.stringify(data.model, null, 2),
      ].join("\n\n") }],
      structuredContent: data,
    });
    const outputSchema = z.object({ model: modelSchema, statePath: z.string() });
    registerAppTool(server, READ_MODEL, {
      title: "Inspect requirements and assumptions",
      description: "Read the current isolated example architecture model shared by the App and conversation, including its revision and requirement-to-component links. Reload before reasoning and after UI edits. Does not approve or change anything.",
      inputSchema: z.object({}).strict(), outputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      _meta: { ui: { resourceUri: ARCHITECTURE_RESOURCE, visibility: ["model", "app"] } },
    }, async () => {
      try { return result(readArchitecture(state)); }
      catch (error) { return { isError: true, content: [{ type: "text", text: `Model inspection failed: ${error.message}` }] }; }
    });
    registerAppTool(server, UPDATE_MODEL, {
      title: "Save a draft requirement or assumption",
      description: "Persist a draft item's statement and rationale in the same isolated example model read by inspect_architecture. Requires the revision you inspected; rejects stale writes and locked baseline items. Cannot change status, links, approvals or real acceptance.",
      inputSchema: updateSchema, outputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      _meta: { ui: { resourceUri: ARCHITECTURE_RESOURCE, visibility: ["model", "app"] } },
    }, async (change) => {
      try { return result(updateDraft(state, change)); }
      catch (error) { return { isError: true, content: [{ type: "text", text: `Draft not saved: ${error.message}` }] }; }
    });
    registerAppResource(server, ARCHITECTURE_RESOURCE, ARCHITECTURE_RESOURCE, { mimeType: RESOURCE_MIME_TYPE }, async () => ({
      contents: [{
        uri: ARCHITECTURE_RESOURCE, mimeType: RESOURCE_MIME_TYPE,
        text: fs.readFileSync(path.join(DIRECTORY, "dist", "architecture.html"), "utf8"),
        _meta: { ui: { csp: { connectDomains: [], resourceDomains: [] }, prefersBorder: true } },
      }],
    }));
  }
  return server;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { target, state, session } = optionsFromArgs(process.argv.slice(2));
    fs.accessSync(path.join(DIRECTORY, "dist", "app.html"));
    await createServer(target, { state, session }).connect(new StdioServerTransport());
  } catch (error) {
    console.error(`Golden Path MCP App: ${error.message}. Run npm run build before starting.`);
    process.exitCode = 1;
  }
}
