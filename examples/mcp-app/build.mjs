import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = path.dirname(fileURLToPath(import.meta.url));
await fs.mkdir(path.join(root, "dist"), { recursive: true });
const theme = await fs.readFile(path.join(root, "theme.css"), "utf8");
for (const name of ["app", "architecture", "engineering", "host"]) {
  const result = await build({
    entryPoints: [path.join(root, `${name}.mjs`)],
    bundle: true, write: false, format: "esm", platform: "browser", target: "es2022",
    legalComments: "inline",
  });
  const template = await fs.readFile(path.join(root, `${name}.html`), "utf8");
  const html = template.replace("<!-- THEME -->", () => `<style>${theme}</style>`).replace("<!-- SCRIPT -->",
    () => `<script type="module">${result.outputFiles[0].text.replaceAll("</script", "<\\/script")}</script>`);
  await fs.writeFile(path.join(root, "dist", `${name}.html`), html);
}
console.log("Built self-contained MCP App and local validation host.");
