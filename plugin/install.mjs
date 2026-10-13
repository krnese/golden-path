#!/usr/bin/env node
// Install / uninstall the Golden Path kit into an adopter repository (copy-in mode).
// Plain JavaScript, Node.js built-ins only, Node >= 22. Level 1 needs no runtime at all once copied.
//
// Levels (no level requires a higher one; copying the files by hand is equally supported, see docs/LEVEL-2.md):
//   --level 1  Method: skill + references + an instructions block. Zero code, no config, nothing enforced.
//   --level 2  Checked completion (default): level 1 + ONE hook script (gate.mjs) + hook JSON + config.
//              Protected acceptance tests are optional config (--acceptance-path ...).
//   Level 3 (learning and measurement) is documentation only: docs/LEVEL-3-EXPERIMENTS.md. Nothing to install.
//
// Idempotent and conflict-refusing: only golden-path-namespaced files are written; copilot-instructions.md,
// AGENTS.md and .gitignore get a marked block; .golden-path/config.json is created once and never
// overwritten; on ANY conflict nothing is written and the exit code is 2.
//
//   node install.mjs --target REPO --level 1
//   node install.mjs --target REPO --check "npm test"        # level 2 (first install)
//   node install.mjs --target REPO --level 1 --with-local-models  # optional local-model skill (any level)
//   node install.mjs --target REPO --uninstall [--force] [--purge]
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const KIT = path.dirname(fileURLToPath(import.meta.url));
const MANIFEST = ".golden-path/install-manifest.json";
const CONFIG = ".golden-path/config.json";
const VERSION = JSON.parse(fs.readFileSync(path.join(KIT, "plugin.json"), "utf8")).version;
const BEGIN = "golden-path:begin", END = "golden-path:end";
const sha = (s) => createHash("sha256").update(s).digest("hex");
const read = (p) => fs.readFileSync(p, "utf8");
const exists = (p) => fs.existsSync(p);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
}

export function plannedFiles({ reviewer = false, ci = false, agent = false, localModels = false, level = 2 } = {}) {
  const files = {};
  const skill = path.join(KIT, "skills", "golden-path");
  for (const src of walk(skill)) files[".github/skills/golden-path/" + path.relative(skill, src).split(path.sep).join("/")] = read(src);
  if (level >= 2) {
    files[".github/hooks/golden-path/gate.mjs"] = read(path.join(KIT, "scripts", "gate.mjs"));
    files[".github/hooks/golden-path-loop.json"] = read(path.join(KIT, "com.github.copilot", "hooks", "hooks.json"))
      .replaceAll("${PLUGIN_ROOT}/scripts/", ".github/hooks/golden-path/");
  }
  if (localModels) { // optional, separately discoverable skill; never part of the core method
    const lm = path.join(KIT, "optional", "skills", "golden-path-local-models");
    for (const src of walk(lm)) files[".github/skills/golden-path-local-models/" + path.relative(lm, src).split(path.sep).join("/")] = read(src);
  }
  if (agent) files[".github/agents/golden-path.agent.md"] = read(path.join(KIT, "optional", "agents", "golden-path.agent.md"));
  if (reviewer && level >= 2) files[".github/agents/golden-path-reviewer.agent.md"] = read(path.join(KIT, "optional", "agents", "golden-path-reviewer.agent.md"));
  files[".github/prompts/golden-path-task.prompt.md"] = read(path.join(KIT, "extras", "prompts", "golden-path-task.prompt.md"));
  if (ci && level >= 2) files[".github/workflows/golden-path-check.yml"] = read(path.join(KIT, "extras", "workflows", "golden-path-check.yml"));
  return files;
}

const SKILL_LINE = "use the `golden-path` skill (`.github/skills/golden-path/SKILL.md`) for engineering tasks.";
const BLOCKS = {
  1: {
    ".github/copilot-instructions.md": ["<!-- {} -->", `This repository uses the Golden Path method: ${SKILL_LINE}\n` +
      "Acceptance tests owned by the business-context expert are not changed by the agent; a needed change goes back to the expert."],
    "AGENTS.md": ["<!-- {} -->", `Golden Path: ${SKILL_LINE}\nDo not delete, skip or weaken existing tests.`],
  },
  2: {
    ".github/copilot-instructions.md": ["<!-- {} -->", `This repository uses Golden Path: ${SKILL_LINE}\n` +
      "Protected acceptance tests (see `.golden-path/config.json`) are owned by the business-context expert; never change them. " +
      "A stop gate runs the configured checks when the agent finishes."],
    "AGENTS.md": ["<!-- {} -->", `Golden Path: ${SKILL_LINE}\nDo not delete, skip or weaken existing tests; a stop gate runs the configured checks.`],
    ".gitignore": ["# {}", ".golden-path/state/\n.golden-path/ledger.jsonl\n.golden-path/proposals/\n.golden-path/ab/"],
  },
};
const CREATE_IF_MISSING = new Set([".github/copilot-instructions.md", ".gitignore"]); // AGENTS.md only if present
const blocksFor = (level) => (level >= 2 ? BLOCKS[2] : BLOCKS[1]);
const ALL_FMT = { ".github/copilot-instructions.md": "<!-- {} -->", "AGENTS.md": "<!-- {} -->", ".gitignore": "# {}" };
const fmtOf = (fmt, w) => fmt.replace("{}", w);
const blockText = (fmt, body) => `${fmtOf(fmt, BEGIN)}\n${body}\n${fmtOf(fmt, END)}\n`;
const count = (s, sub) => s.split(sub).length - 1;

export function applyBlock(existing, fmt, body, remove = false) {
  const b = fmtOf(fmt, BEGIN), e = fmtOf(fmt, END);
  if (existing != null && (count(existing, b) > 1 || count(existing, b) !== count(existing, e)))
    throw new Error("malformed golden-path block markers");
  if (existing != null && existing.includes(b)) {
    const i = existing.indexOf(b);
    const pre = existing.slice(0, i), rest = existing.slice(i + b.length);
    const post = rest.slice(rest.indexOf(e) + e.length).replace(/^\n+/, "");
    if (remove) return pre.trim() || post.trim() ? pre.replace(/\n+$/, "") + "\n" + post : "";
    return pre + blockText(fmt, body) + post;
  }
  if (remove) return existing;
  let base = existing || "";
  if (base && !base.endsWith("\n")) base += "\n";
  return base + (base ? "\n" : "") + blockText(fmt, body);
}

const write = (p, s) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); };
const LEVEL_NOTE = {
  1: "Level 1 (method): the skill and instructions are in place. Nothing is enforced or checked automatically.",
  2: "Level 2 (checked completion): a stop gate runs your configured checks when the agent finishes. It is fast feedback; keep branch protection and review as the boundary.",
};

export function install(target, o = {}) {
  const manPath = path.join(target, MANIFEST);
  const manifest = exists(manPath) ? JSON.parse(read(manPath)) : { files: {} };
  // Installs made by older versions at level 3 are level 2 installs (level 3 is now docs only).
  const prev = Math.min(manifest.level || 0, 2);
  const level = Number(o.level || prev || 2);
  if (level < prev) {
    console.log(`REFUSING: installed at level ${prev}; uninstall first to go down to level ${level}`);
    return 2;
  }
  const has = (rel) => rel in manifest.files;
  const files = plannedFiles({ reviewer: o.reviewer || has(".github/agents/golden-path-reviewer.agent.md"),
    ci: o.ci || has(".github/workflows/golden-path-check.yml"), agent: o.agent || has(".github/agents/golden-path.agent.md"),
    localModels: o.localModels || has(".github/skills/golden-path-local-models/SKILL.md"), level });
  const conflicts = [], actions = [];
  for (const [rel, content] of Object.entries(files)) {
    const p = path.join(target, rel);
    if (!exists(p)) { actions.push(["create", rel]); continue; }
    const cur = read(p);
    if (cur === content) continue;
    if (manifest.files[rel] === sha(cur)) actions.push(["update", rel]);
    else conflicts.push(`${rel}: exists with content not written by golden-path (or modified since install)`);
  }
  const newBlocks = {};
  for (const [rel, [fmt, body]] of Object.entries(blocksFor(level))) {
    const p = path.join(target, rel);
    if (!exists(p) && !CREATE_IF_MISSING.has(rel)) continue;
    const cur = exists(p) ? read(p) : null;
    let next;
    try { next = applyBlock(cur, fmt, body); } catch (e) { conflicts.push(`${rel}: ${e.message}`); continue; }
    if (next !== cur) { newBlocks[rel] = next; actions.push(["block", rel]); }
  }
  const cfgPath = path.join(target, CONFIG);
  if (level >= 2 && !exists(cfgPath)) {
    if (!o.check) conflicts.push(`${CONFIG}: missing; pass --check "<your check command>" on first install`);
    else actions.push(["config", CONFIG]);
  }
  if (conflicts.length) { console.log("REFUSING: conflicts found, nothing written:\n  " + conflicts.join("\n  ")); return 2; }
  if (o.dryRun) { console.log(actions.map(([a, r]) => `${a}: ${r}`).join("\n") || "nothing to do"); return 0; }
  for (const [rel, content] of Object.entries(files)) {
    const p = path.join(target, rel);
    if (!exists(p) || read(p) !== content) write(p, content);
    manifest.files[rel] = sha(content);
  }
  for (const [rel, content] of Object.entries(newBlocks)) write(path.join(target, rel), content);
  if (level >= 2 && !exists(cfgPath)) {
    write(cfgPath, JSON.stringify({ check: o.check,
      acceptance: { paths: o.acceptancePaths || [], owner: o.acceptanceOwner || "the acceptance owner", command: o.acceptanceCommand || null },
      protected: ["tests/**"], max_blocks: 5, hook_budget_sec: 100 }, null, 2) + "\n");
  }
  manifest.version = VERSION;
  manifest.level = level;
  manifest.blocks = [...new Set([...(manifest.blocks || []), ...Object.keys(blocksFor(level)).filter((r) => exists(path.join(target, r)))])].sort();
  const sorted = (v) => (v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sorted(v[k])])) : v);
  const newMan = JSON.stringify(sorted(manifest), null, 1) + "\n";
  if (!exists(manPath) || read(manPath) !== newMan) write(manPath, newMan);
  console.log(actions.map(([a, r]) => `${a}: ${r}`).join("\n") || "already installed; nothing changed");
  if (actions.length) console.log(LEVEL_NOTE[level]);
  return 0;
}

export function uninstall(target, force = false, purge = false) {
  const manPath = path.join(target, MANIFEST);
  if (!exists(manPath)) { console.log("not installed (no manifest); nothing to do"); return 0; }
  const manifest = JSON.parse(read(manPath));
  const modified = Object.entries(manifest.files).filter(([rel, h]) => exists(path.join(target, rel)) && sha(read(path.join(target, rel))) !== h).map(([r]) => r);
  if (modified.length && !force) { console.log("REFUSING: files modified since install (use --force to remove anyway):\n  " + modified.join("\n  ")); return 2; }
  for (const rel of Object.keys(manifest.files)) fs.rmSync(path.join(target, rel), { force: true });
  for (const rel of manifest.blocks || []) {
    const p = path.join(target, rel);
    if (!exists(p)) continue;
    const next = applyBlock(read(p), ALL_FMT[rel], "", true);
    if (next === "" && CREATE_IF_MISSING.has(rel)) fs.rmSync(p); else fs.writeFileSync(p, next);
  }
  fs.rmSync(manPath);
  if (purge) fs.rmSync(path.join(target, CONFIG), { force: true });
  for (const d of [".github/skills/golden-path-local-models/references", ".github/skills/golden-path-local-models",
    ".github/skills/golden-path/references", ".github/skills/golden-path", ".github/hooks/golden-path", ".github/hooks",
    ".github/agents", ".github/prompts", ".github/skills", ".github/workflows", ".golden-path", ".github"]) {
    const p = path.join(target, d);
    if (exists(p) && fs.statSync(p).isDirectory() && !fs.readdirSync(p).length) fs.rmdirSync(p);
  }
  console.log("uninstalled");
  return 0;
}

const FLAGS = { "--target": "target", "--level": "level", "--check": "check",
  "--acceptance-owner": "acceptanceOwner", "--acceptance-command": "acceptanceCommand" };
const BOOLS = { "--with-agent-preset": "agent", "--with-reviewer": "reviewer", "--with-ci": "ci", "--with-local-models": "localModels", "--dry-run": "dryRun",
  "--uninstall": "uninstall", "--force": "force", "--purge": "purge" };

export function main(argv) {
  const o = { acceptancePaths: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a in FLAGS) o[FLAGS[a]] = argv[++i];
    else if (a === "--acceptance-path") o.acceptancePaths.push(argv[++i]);
    else if (a in BOOLS) o[BOOLS[a]] = true;
    else if (a === "-h" || a === "--help") { console.log("see the header of install.mjs"); return 0; }
    else { console.error(`unknown argument: ${a}`); return 64; }
  }
  if (!o.target) { console.error("--target is required"); return 64; }
  if (String(o.level) === "3") { console.error("Level 3 is documentation only (docs/LEVEL-3-EXPERIMENTS.md); install level 2 and follow that doc."); return 64; }
  if (o.level && !["1", "2"].includes(String(o.level))) { console.error("--level must be 1 or 2"); return 64; }
  const t = path.resolve(o.target);
  return o.uninstall ? uninstall(t, o.force, o.purge) : install(t, o);
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) process.exitCode = main(process.argv.slice(2));
