import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { createHash } from "node:crypto";
import { sourceIdentity } from "./runtime-info.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
await fs.mkdir(path.join(root, "dist"), { recursive: true });
const source = sourceIdentity(root);
const theme = await fs.readFile(path.join(root, "theme.css"), "utf8");
const resources = {};
const panels = {};
for (const name of ["app", "architecture", "engineering", "host"]) {
  const result = await build({
    entryPoints: [path.join(root, `${name}.mjs`)],
    bundle: true, write: false, format: "esm", platform: "browser", target: "es2022",
    legalComments: "inline",
  });
  const template = await fs.readFile(path.join(root, `${name}.html`), "utf8");
  const html = template.replace("<html", `<html data-runtime-source="${source}"`).replace("<!-- THEME -->", () => `<style>${theme}</style>`).replace("<!-- SCRIPT -->",
    () => `<script type="module">${result.outputFiles[0].text.replaceAll("</script", "<\\/script")}</script>`);
  panels[name] = html;
  resources[name] = createHash("sha256").update(html).digest("hex");
}
// Hash before adding the output stamp so the identity does not depend on itself.
const output = createHash("sha256").update(JSON.stringify({ source, resources })).digest("hex");
for (const [name, panel] of Object.entries(panels)) {
  const html = panel.replace("<html", `<html data-runtime-build="${output}"`);
  await fs.writeFile(path.join(root, "dist", `${name}.html`), html);
  resources[name] = createHash("sha256").update(html).digest("hex");
}
if (sourceIdentity(root) !== source) throw new Error("App source changed during the build. Rebuild before restarting the server.");
await fs.writeFile(path.join(root, "dist", "build-info.json"), `${JSON.stringify({ format: 1, source, build: output, resources }, null, 2)}\n`);
console.log("Built self-contained MCP App and local validation host.");
