import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const siteRoot = fileURLToPath(new URL("../", import.meta.url));
export const repositoryRoot = path.dirname(siteRoot);
export const evidenceRoot = path.join(repositoryRoot, "docs", "examples", "golden-loop");

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

export function canonicalUrl(origin = "https://krnese.github.io", base = "/golden-path") {
  const url = new URL(origin);
  if (url.protocol !== "https:" || url.pathname !== "/" || url.search || url.hash || url.username || url.password) {
    throw new Error("SITE_URL must be an HTTPS origin without credentials, path, query or fragment");
  }
  if (!/^\/(?:[a-zA-Z0-9_-]+\/?)*$/.test(base)) throw new Error("SITE_BASE must be a root-relative path");
  return `${url.origin}${base.replace(/\/+$/, "")}/`;
}

export function installationCommand(readme) {
  const quickstart = readme.split("## Quickstart\n")[1]?.split("\n## ")[0];
  const commands = [...(quickstart || "").matchAll(/^node plugin\/install\.mjs .+$/gm)];
  const command = commands.find(([line]) => line.includes("--acceptance-command"));
  if (!command) throw new Error("Canonical README owner-controlled acceptance command is missing");
  return `git clone https://github.com/krnese/golden-path.git\ncd golden-path\n${command[0]}`;
}

export function gateSummary(record) {
  if (!["PASSED", "FAILED"].includes(record.outcome) || record.ok !== (record.outcome === "PASSED") ||
      !/^[a-f0-9]{40}$/.test(record.base_sha) || !Array.isArray(record.results)) {
    throw new Error("Invalid recorded gate evidence");
  }
  const rows = ["check", "acceptance", "test-integrity", "acceptance-integrity"].map(name => {
    const result = record.results.find(row => row.name === name);
    if (!result || typeof result.ok !== "boolean" || typeof result.output !== "string") throw new Error(`Missing evidence for ${name}`);
    let counts = "";
    if (["check", "acceptance"].includes(name)) {
      const total = /^# tests (\d+)$/m.exec(result.output);
      const passed = /^# pass (\d+)$/m.exec(result.output);
      if (!total || !passed) throw new Error(`Missing test counts for ${name}`);
      counts = ` (${passed[1]}/${total[1]})`;
    }
    return `${name.padEnd(21)} ${result.ok ? "PASS" : "FAIL"}${counts}`;
  });
  return `base: ${record.base_sha.slice(0, 7)}\n\n${rows.join("\n")}\n\noutcome: ${record.outcome}`;
}

export function build(output = path.join(siteRoot, "dist"), env = process.env) {
  const canonical = canonicalUrl(env.SITE_URL, env.SITE_BASE);
  const readme = fs.readFileSync(path.join(repositoryRoot, "README.md"), "utf8").replace(/\r\n/g, "\n");
  const records = ["65ef920", "921979e"].map(base => JSON.parse(fs.readFileSync(path.join(evidenceRoot, `gate-check-base-${base}.json`), "utf8")));
  const image = fs.readFileSync(path.join(evidenceRoot, "round1-vs-round2.png"));
  if (image.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") throw new Error("Trial image is not a PNG");
  const gateImage = fs.readFileSync(path.join(evidenceRoot, "gate-verdict.png"));
  if (gateImage.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") throw new Error("Gate image is not a PNG");
  const values = {
    CANONICAL: canonical,
    SOCIAL_IMAGE: `${canonical}evidence/round1-vs-round2.png`,
    INSTALL_COMMAND: installationCommand(readme),
    FAILED_OUTPUT: gateSummary(records[0]),
    PASSED_OUTPUT: gateSummary(records[1]),
    IMAGE_WIDTH: image.readUInt32BE(16),
    IMAGE_HEIGHT: image.readUInt32BE(20),
    GATE_IMAGE_WIDTH: gateImage.readUInt32BE(16),
    GATE_IMAGE_HEIGHT: gateImage.readUInt32BE(20),
    SOURCE_REF: env.SITE_SOURCE_REF || "main",
  };
  if (!/^[a-zA-Z0-9/_-]+$/.test(values.SOURCE_REF)) throw new Error("SITE_SOURCE_REF must be a Git ref without URL syntax");
  const template = fs.readFileSync(path.join(siteRoot, "index.html"), "utf8");
  const html = template.replace(/\{\{([A-Z_]+)\}\}/g, (_, name) => {
    if (!(name in values)) throw new Error(`Unknown template field: ${name}`);
    return escapeHtml(values[name]);
  });
  if (/\{\{/.test(html)) throw new Error("Unresolved template field");
  fs.mkdirSync(output, { recursive: true });
  if (fs.readdirSync(output).length) throw new Error("Output must be empty before building");
  fs.mkdirSync(path.join(output, "evidence"));
  fs.writeFileSync(path.join(output, "index.html"), html);
  fs.writeFileSync(path.join(output, ".nojekyll"), "");
  for (const name of ["styles.css", "main.js"]) fs.copyFileSync(path.join(siteRoot, name), path.join(output, name));
  fs.copyFileSync(path.join(siteRoot, "public", "favicon.svg"), path.join(output, "favicon.svg"));
  for (const name of ["round1-vs-round2.png", "gate-verdict.png", "gate-check-base-65ef920.json", "gate-check-base-921979e.json"]) {
    fs.copyFileSync(path.join(evidenceRoot, name), path.join(output, "evidence", name));
  }
  if (env.SITE_DOMAIN) {
    if (env.SITE_DOMAIN !== new URL(canonical).hostname || new URL(canonical).pathname !== "/") throw new Error("SITE_DOMAIN must match a root-path canonical URL");
    fs.writeFileSync(path.join(output, "CNAME"), `${env.SITE_DOMAIN}\n`);
  }
  console.log(`Built one static page for ${canonical}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const output = path.join(siteRoot, "dist");
  fs.rmSync(output, { recursive: true, force: true });
  build(output);
}
