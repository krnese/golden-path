// This repository dogfoods its own kit: the installed copies under .github/ must match plugin/ (the source of truth).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { plannedFiles, install } from "../plugin/install.mjs";

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
  assert.equal(JSON.parse(rd(".golden-path/config.json")).check, "node --test");
});
