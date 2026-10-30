import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { boundFile } from "./engineering-report.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const APP_RESOURCES = ["app", "architecture", "engineering", "host"];
const digest = value => createHash("sha256").update(value).digest("hex");
const hashSchema = z.string().regex(/^[a-f0-9]{64}$/);
const buildSchema = z.object({
  format: z.literal(1), source: hashSchema, build: hashSchema,
  resources: z.object(Object.fromEntries(APP_RESOURCES.map(name => [name, hashSchema]))).strict(),
}).strict();
const versionSchema = z.object({ version: z.string().min(1).max(100) });

function read(file, limit) {
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Not a regular file: ${file}`);
  if (stat.size > limit) throw new Error(`File exceeds the ${limit} byte diagnostic limit: ${file}`);
  return fs.readFileSync(file, "utf8");
}

export function sourceIdentity(directory = HERE) {
  const files = fs.readdirSync(directory, { withFileTypes: true })
    .filter(entry => /\.(mjs|html|css|json)$/.test(entry.name))
    .map(entry => entry.name);
  files.push("../../plugin/plugin.json", "../../plugin/scripts/gate.mjs");
  return digest(files.sort().map(file =>
    `${file}\0${digest(read(path.resolve(directory, file), 2 * 1024 * 1024).replaceAll("\r\n", "\n"))}\0`).join(""));
}

function buildSnapshot(directory) {
  const metadata = buildSchema.parse(JSON.parse(read(path.join(directory, "dist", "build-info.json"), 64 * 1024)));
  const resources = {};
  for (const name of APP_RESOURCES) {
    const text = read(path.join(directory, "dist", `${name}.html`), 5 * 1024 * 1024);
    if (digest(text) !== metadata.resources[name]) throw new Error(`Built ${name} resource does not match build-info.json.`);
    if (text.match(/<html\b[^>]*\bdata-runtime-source="([a-f0-9]{64})"/)?.[1] !== metadata.source) {
      throw new Error(`Built ${name} panel identity does not match build-info.json.`);
    }
    if (text.match(/<html\b[^>]*\bdata-runtime-build="([a-f0-9]{64})"/)?.[1] !== metadata.build) {
      throw new Error(`Built ${name} output identity does not match build-info.json.`);
    }
    resources[name] = text;
  }
  return { source: metadata.source, build: metadata.build, hashes: metadata.resources, resources };
}

function installation(root) {
  const file = ".golden-path/install-manifest.json";
  try {
    if (!fs.lstatSync(path.join(root, ...file.split("/")), { throwIfNoEntry: false })) {
      return { status: "missing", version: null, level: null,
        detail: "No copy-in installation manifest. Plugin discovery and manually copied guidance are not inspected." };
    }
    const data = versionSchema.extend({ level: z.union([z.literal(1), z.literal(2), z.literal(3)]) })
      .parse(JSON.parse(read(boundFile(root, file), 256 * 1024)));
    return { status: "present", version: data.version, level: data.level,
      detail: "Declared copy-in version and level only; not proof of file integrity, discovery, approval or enforcement." };
  } catch (error) {
    return { status: "unknown", version: null, level: null,
      detail: `Installation manifest unavailable: ${error.message}. Review it separately; nothing was changed.` };
  }
}

export function createRuntimeInspector(directory = HERE) {
  let runningSource = null, kitVersion = "unknown", appVersion = "unknown";
  let sourceError;
  try {
    kitVersion = versionSchema.parse(JSON.parse(read(path.resolve(directory, "../../plugin/plugin.json"), 64 * 1024))).version;
    appVersion = versionSchema.parse(JSON.parse(read(path.join(directory, "package.json"), 64 * 1024))).version;
    runningSource = sourceIdentity(directory);
  } catch (error) { sourceError = error.message; }
  let pinned;
  let startupError;
  try { pinned = buildSnapshot(directory); }
  catch (error) { startupError = error.message; }
  return {
    appVersion,
    resource(name) {
      if (!APP_RESOURCES.includes(name)) throw new Error("Unknown App resource.");
      if (!runningSource || !pinned || pinned.source !== runningSource) {
        throw new Error(`Build the MCP App, restart its server and reopen the panel before reading resources. ${sourceError || startupError || "The startup build belongs to different source."}`);
      }
      return pinned.resources[name];
    },
    inspect(root) {
      let checkoutSource = null;
      let builtSource = null;
      let builtBuild = null;
      let status = "unknown";
      let detail;
      const next = "Review the kit checkout, run npm --prefix <kit>/examples/mcp-app run build, restart the MCP server and close/reopen the App. No upgrade or configuration change is automatic.";
      try {
        checkoutSource = sourceIdentity(directory);
        const built = buildSnapshot(directory);
        builtSource = built.source;
        builtBuild = built.build;
        if (builtSource !== checkoutSource) {
          status = "rebuild-required";
          detail = "The built App does not match the current kit source.";
        } else if (runningSource !== checkoutSource || !pinned || pinned.source !== runningSource ||
          pinned.build !== built.build || APP_RESOURCES.some(name => pinned.hashes[name] !== built.hashes[name])) {
          status = "restart-required";
          detail = "The checkout/build changed after this process loaded, or its startup identity/build was unavailable. The server serves only valid pinned startup UI.";
        } else {
          status = "current";
          detail = "Running source and pinned UI match this checkout and build. This is not a latest-release, dependency-integrity, host-rendering or protection verdict.";
        }
      } catch (error) {
        if (checkoutSource) status = "rebuild-required";
        detail = `Version compatibility could not be verified: ${error.message}`;
      }
      if (sourceError) detail += ` Startup identity unavailable: ${sourceError}`;
      return { kitVersion, appVersion, nodeVersion: process.version, protocolVersion: 1,
        runningSource, checkoutSource, builtSource, runningBuild: pinned?.build || null, builtBuild, status, detail,
        next: status === "current" ? "No rebuild or restart indicated. Verify host discovery and rendering separately." : next,
        installation: installation(root) };
    },
  };
}
