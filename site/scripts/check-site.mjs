import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { siteRoot } from "./build.mjs";

export function verify(output = path.join(siteRoot, "dist")) {
  const html = fs.readFileSync(path.join(output, "index.html"), "utf8");
  assert.equal((html.match(/<h1\b/g) || []).length, 1, "There must be one promise");
  assert.equal((html.match(/<main\b/g) || []).length, 1, "There must be one main landmark");
  assert.equal((html.match(/<\/main>/g) || []).length, 1, "The main landmark must close once");
  assert.ok(html.indexOf("</main>") > html.indexOf('id="quickstart"'), "Main must include the whole user journey");
  assert.deepEqual([...html.matchAll(/data-step="(\d)"/g)].map(match => match[1]), ["1", "2", "3", "4"]);
  assert.ok(html.indexOf('class="workflow"') < html.indexOf('class="actions"'), "Show the loop before the CTAs");
  assert.ok(!/\bkit\b/i.test(html), "Landing-page copy must not say kit");
  assert.ok(!/\{\{/.test(html), "No unrendered template fields");
  assert.ok(!/astro|starlight|pagefind/i.test(html), "Plain static HTML, no framework output");
  for (const text of ["Install in 5 minutes", "Read the background", "FAILED", "PASSED", "UNVERIFIED", "14/14", "26/26", "What it doesn't do.", "Copilot review", "protected main"]) {
    assert.ok(html.includes(text), `Missing required content: ${text}`);
  }
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, "No duplicate HTML IDs");
  const canonical = /<link rel="canonical" href="([^"]+)"/.exec(html)?.[1];
  assert.ok(canonical, "A canonical URL is required");
  const current = new URL(canonical);
  const decode = value => value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  let checked = 0;
  for (const [, raw] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const url = new URL(decode(raw), current);
    assert.equal(url.protocol, "https:", `Unexpected URL protocol: ${raw}`);
    if (url.origin !== current.origin) continue;
    assert.ok(url.pathname.startsWith(current.pathname), `Link escapes the deployment base: ${raw}`);
    const relative = decodeURIComponent(url.pathname.slice(current.pathname.length)) || "index.html";
    const filename = path.resolve(output, relative);
    assert.ok(filename.startsWith(path.resolve(output) + path.sep), `Link escapes output: ${raw}`);
    assert.ok(fs.existsSync(filename), `Missing asset: ${raw}`);
    if (url.hash) assert.ok(ids.includes(decodeURIComponent(url.hash.slice(1))), `Missing anchor: ${raw}`);
    checked++;
  }
  assert.ok(fs.existsSync(path.join(output, ".nojekyll")), "Pages must serve plain static files");
  const cname = path.join(output, "CNAME");
  if (fs.existsSync(cname)) {
    assert.equal(fs.readFileSync(cname, "utf8").trim(), current.hostname);
    assert.equal(current.pathname, "/");
  }
  console.log(`Verified one static page, four ordered steps, real proof, and ${checked} local links/assets/anchors.`);
  return { checked, canonical };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) verify();
