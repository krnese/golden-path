// This repository dogfoods its own kit: the installed copies under .github/ must match plugin/ (the source of truth).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { plannedFiles, install, uninstall } from "../plugin/install.mjs";

const REPO = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const FIX = "installed kit is out of sync with plugin/ - rerun node plugin/install.mjs --target . (from the repo root) and commit the result";
const lf = (s) => s.replace(/\r\n/g, "\n"); // Windows checkouts may use CRLF
const rd = (rel) => lf(fs.readFileSync(path.join(REPO, rel), "utf8"));

test("self-install: every installed kit file matches plugin/ source", () => {
  const manifest = JSON.parse(rd(".golden-path/install-manifest.json"));
  const want = plannedFiles({ level: manifest.level });
  const stale = Object.entries(want).filter(([rel, c]) => !fs.existsSync(path.join(REPO, rel)) || rd(rel) !== lf(c)).map(([r]) => r);
  assert.deepEqual(stale, [], `${FIX}\n  stale or missing: ${stale.join(", ")}`);
  const extra = Object.keys(manifest.files).filter((r) => !(r in want));
  assert.deepEqual(extra, [], `${FIX}\n  installed but no longer in plugin/: ${extra.join(", ")}`);
});

test("self-install: installer dry-run over the committed state has nothing to do (blocks, config, manifest)", () => {
  // Copy the committed install state (LF-normalised) to a temp dir and dry-run the real installer against it.
  const manifest = JSON.parse(rd(".golden-path/install-manifest.json"));
  const rels = [...Object.keys(manifest.files), ...manifest.blocks, ".golden-path/config.json", ".golden-path/install-manifest.json"];
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "gp-self-"));
  try {
    for (const rel of rels) { fs.mkdirSync(path.dirname(path.join(tmp, rel)), { recursive: true }); fs.writeFileSync(path.join(tmp, rel), rd(rel)); }
    const out = [], log = console.log;
    console.log = (...a) => out.push(a.join(" "));
    let code;
    try { code = install(tmp, { dryRun: true }); } finally { console.log = log; }
    assert.equal(code, 0, `${FIX}\n  ${out.join("\n  ")}`);
    assert.equal(out.join("\n"), "nothing to do", `${FIX}\n  ${out.join("\n  ")}`);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  // The hook check is deliberately a fast subset (packaging, installer, self-install) that fits hook_budget_sec on a
  // developer machine; the full suite (gate, demo, Windows) runs in CI as the required "Kit guarantees" jobs.
  const check = JSON.parse(rd(".golden-path/config.json")).check;
  assert.match(check, /--test-name-pattern="\^\(Packaging\|Installer\|self-install\)"/);
  assert.match(check, /tests\/kit\.test\.mjs tests\/self-install\.test\.mjs$/);
});

test("self-install: CRLF-only differences in kit sources or installed copies are not drift", () => {
  // Windows clones with core.autocrlf made before .gitattributes pinned eol=lf can hold CRLF copies.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "gp-crlf-"));
  try {
    const log = console.log; console.log = () => {};
    try { assert.equal(install(tmp, { check: "node -e 0" }), 0); } finally { console.log = log; }
    const manifest = JSON.parse(fs.readFileSync(path.join(tmp, ".golden-path/install-manifest.json"), "utf8"));
    for (const rel of Object.keys(manifest.files)) {
      const p = path.join(tmp, rel);
      fs.writeFileSync(p, fs.readFileSync(p, "utf8").replace(/\n/g, "\r\n"));
    }
    const out = []; console.log = (...a) => out.push(a.join(" "));
    try { assert.equal(install(tmp, { dryRun: true }), 0); } finally { console.log = log; }
    assert.equal(out.join("\n"), "nothing to do");
    for (const c of Object.values(plannedFiles({ level: 2 }))) assert.ok(!c.includes("\r"), "planned kit content is LF");
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test("self-install: uninstall accepts a legacy CRLF hash still on disk", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "gp-crlf-un-"));
  try {
    const log = console.log; console.log = () => {};
    try { assert.equal(install(tmp, { check: "node -e 0" }), 0); } finally { console.log = log; }
    const manPath = path.join(tmp, ".golden-path/install-manifest.json");
    const manifest = JSON.parse(fs.readFileSync(manPath, "utf8"));
    const rel = Object.keys(manifest.files)[0];
    const p = path.join(tmp, rel);
    const crlf = fs.readFileSync(p, "utf8").replace(/\n/g, "\r\n");
    fs.writeFileSync(p, crlf);
    manifest.files[rel] = createHash("sha256").update(crlf).digest("hex"); // legacy: hashed CRLF bytes
    fs.writeFileSync(manPath, JSON.stringify(manifest, null, 1) + "\n");
    console.log = () => {};
    try { assert.equal(uninstall(tmp), 0); } finally { console.log = log; }
    assert.ok(!fs.existsSync(p), "legacy CRLF-hashed install should uninstall without --force");
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});
