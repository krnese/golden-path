#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { isDeepStrictEqual, parseArgs } from "node:util";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const SERVER_NAME = "golden-path-experience";

export function configureApp(target, { dryRun = false } = {}) {
  const root = fs.realpathSync(target);
  if (!fs.statSync(root).isDirectory()) throw new Error("Select the application repository directory.");
  for (const name of ["app", "engineering"]) {
    if (!fs.existsSync(path.join(HERE, "dist", `${name}.html`))) {
      throw new Error("Build the MCP App first: npm --prefix <kit>/examples/mcp-app run build");
    }
  }
  const relative = path.relative(root, path.join(HERE, "server.mjs"));
  const serverPath = path.isAbsolute(relative) ? relative : `\${workspaceFolder}/${relative.split(path.sep).join("/")}`;
  const entry = { type: "stdio", command: "node", args: [serverPath, "--target", "${workspaceFolder}"] };
  const config = { servers: { [SERVER_NAME]: entry } };
  const directory = path.join(root, ".vscode");
  const file = path.join(directory, "mcp.json");
  if (dryRun) return { file, config, changed: false };
  const directoryStat = fs.lstatSync(directory, { throwIfNoEntry: false });
  if (directoryStat && (directoryStat.isSymbolicLink() || !directoryStat.isDirectory())) {
    throw new Error("Refusing to write through a linked or non-directory .vscode path.");
  }
  const fileStat = fs.lstatSync(file, { throwIfNoEntry: false });
  if (fileStat) {
    if (!fileStat.isSymbolicLink()) {
      let existing;
      try { existing = JSON.parse(fs.readFileSync(file, "utf8")); }
      catch (error) {
        throw new Error(`Existing MCP configuration cannot be read as JSON: ${error.message}. Use --dry-run and merge the entry manually; nothing was overwritten.`);
      }
      if (isDeepStrictEqual(existing?.servers?.[SERVER_NAME], entry)) return { file, config, changed: false };
    }
    throw new Error(`MCP configuration already exists at ${file}. Use --dry-run and merge the server entry manually; nothing was overwritten.`);
  }
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`, { flag: "wx" });
  return { file, config, changed: true };
}

export function main(args) {
  try {
    const { values } = parseArgs({ args, options: { target: { type: "string" }, "dry-run": { type: "boolean" } } });
    if (!values.target) throw new Error("Usage: node configure.mjs --target <application-repository> [--dry-run]");
    const result = configureApp(values.target, { dryRun: values["dry-run"] });
    if (values["dry-run"]) console.log(JSON.stringify(result.config, null, 2));
    else {
      console.log(`${result.changed ? "Created" : "Already configured:"} ${result.file}`);
      console.log(`In VS Code, start/restart ${SERVER_NAME} with MCP: List Servers, then reopen the App.`);
      console.log("No checks, acceptance, session records or approvals were created. Review the configuration before committing it.");
    }
    return 0;
  } catch (error) {
    console.error(`MCP App setup failed: ${error.message}`);
    return 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  process.exitCode = main(process.argv.slice(2));
}
