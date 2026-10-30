#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { isDeepStrictEqual, parseArgs } from "node:util";
import { pathToFileURL } from "node:url";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { configureApp, SERVER_NAME } from "./configure.mjs";
import { inspectionSchema } from "./engineering-schema.mjs";
import { ENGINEERING_RESOURCE, INSPECT_SESSION } from "./server.mjs";

export async function verifyApp(target) {
  const root = fs.realpathSync(target);
  const planned = configureApp(root, { dryRun: true });
  const stat = fs.lstatSync(planned.file);
  if (stat.isSymbolicLink() || !stat.isFile()) throw new Error("Review the linked or non-file MCP configuration before verification.");
  const config = JSON.parse(fs.readFileSync(planned.file, "utf8"));
  const entry = config?.mcpServers?.[SERVER_NAME];
  if (!isDeepStrictEqual(entry, planned.config.mcpServers[SERVER_NAME])) {
    throw new Error("The server entry differs from this kit's setup preview. Review it before execution; no configured command was run.");
  }
  const client = new Client({ name: "golden-path-setup-verification", version: "0.1.0" });
  try {
    await client.connect(new StdioClientTransport({ command: entry.command, args: entry.args, cwd: root }));
    const tools = (await client.listTools()).tools;
    if (!isDeepStrictEqual(tools.map(tool => tool.name).sort(), [...entry.tools].sort()) ||
      tools.some(tool => !tool.annotations?.readOnlyHint)) {
      throw new Error("The configured server did not expose exactly the expected read-only inspection tools.");
    }
    const response = await client.callTool({ name: INSPECT_SESSION, arguments: {} });
    if (response.isError) throw new Error(response.content?.filter(item => item.type === "text").map(item => item.text).join("\n") || "Engineering inspection failed.");
    const inspection = inspectionSchema.parse(response.structuredContent?.inspection);
    if (path.relative(root, inspection.root) !== "") throw new Error("The server inspected a different repository.");
    const runtime = inspection.runtime;
    if (!runtime) throw new Error("This server has no version diagnostics. Review/update the kit, rebuild and restart the MCP server.");
    if (runtime.status !== "current") throw new Error(`${runtime.detail} ${runtime.next}`);
    if (runtime.installation.status === "unknown") throw new Error(runtime.installation.detail);
    if (client.getServerVersion()?.version !== runtime.appVersion) throw new Error("Server handshake and inspection versions differ. Restart the MCP server.");
    const resource = await client.readResource({ uri: ENGINEERING_RESOURCE });
    if (!resource.contents.some(item => item.uri === ENGINEERING_RESOURCE && typeof item.text === "string" &&
      item.text.includes("Your project is connected") && item.text.includes(`data-runtime-source="${runtime.runningSource}"`))) {
      throw new Error("The server did not return the current first-run App resource. Rebuild the kit before retrying.");
    }
    return { root: inspection.root, sessions: inspection.sessions.length, evidence: inspection.evidence.freshness,
      runtime, hostVerification: "not-performed" };
  } finally {
    await client.close();
  }
}

export async function main(args) {
  try {
    const { values } = parseArgs({ args, options: { target: { type: "string" }, json: { type: "boolean" } } });
    if (!values.target) throw new Error("Usage: node verify.mjs --target <application-repository> [--json]");
    const result = await verifyApp(values.target);
    if (values.json) { console.log(JSON.stringify(result, null, 2)); return 0; }
    console.log(`Verified configured server, repository binding and App resource: ${result.root}`);
    console.log(`Kit ${result.runtime.kitVersion}; App ${result.runtime.appVersion}; Node ${result.runtime.nodeVersion}. Source/build ${result.runtime.runningSource}.`);
    console.log(`Copy-in method: ${result.runtime.installation.status}${result.runtime.installation.version ? ` (${result.runtime.installation.version}, level ${result.runtime.installation.level})` : ""}. ${result.runtime.installation.detail}`);
    console.log(`${result.sessions} recorded sessions; evidence ${result.evidence}. No checks or acceptance were created.`);
    console.log("Host discovery, trust and native rendering still require opening the App in VS Code. Configuration alone is not setup complete.");
    return 0;
  } catch (error) {
    console.error(`MCP App verification failed: ${error.message}`);
    return 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  process.exitCode = await main(process.argv.slice(2));
}
