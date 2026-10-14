#!/usr/bin/env node
// Create a runnable demo adopter repo from examples/invoice-demo and install the kit into it.
// Cross-platform (Windows, macOS, Linux): needs only Node.js 22+ and git. No Python, no bash.
// Usage: node examples/make-demo.mjs <target-dir> [extra installer flags, e.g. --with-reviewer]
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const kit = path.join(here, "..", "plugin");
const [targetArg, ...extra] = process.argv.slice(2);
if (!targetArg) { console.error("usage: node examples/make-demo.mjs <target-dir> [installer flags]"); process.exit(64); }
const target = path.resolve(targetArg);
if (fs.existsSync(target) && fs.readdirSync(target).length) { console.error(`refusing: ${target} exists and is not empty`); process.exit(2); }

const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { cwd: target, stdio: "inherit" });
  if (r.status !== 0) { console.error(`failed: ${cmd} ${args.join(" ")}`); process.exit(r.status || 1); }
};
const git = (...a) => run("git", ["-c", "user.name=demo", "-c", "user.email=demo@local", "-c", "core.autocrlf=false", ...a]);

fs.mkdirSync(target, { recursive: true });
fs.cpSync(path.join(here, "invoice-demo"), target, { recursive: true });

// Per-increment acceptance ownership. The kit config takes ONE acceptance.owner string (used in agent-facing
// messages); per-path owners are expressed in CODEOWNERS, which the authorised-revision check reads (last
// matching line wins; individual @user owners only). The handles below are fictional demo placeholders.
fs.mkdirSync(path.join(target, ".github"), { recursive: true });
fs.writeFileSync(path.join(target, ".github", "CODEOWNERS"), [
  "# Finance (Ingrid Berg) owns T01..T04 acceptance (acceptance/t01..t04.test.mjs, acceptance/EXAMPLES.md)",
  "/acceptance/ @demo-finance-ingrid-berg",
  "# Marketing owns T05 acceptance on its own path (acceptance/marketing/)",
  "/acceptance/marketing/ @demo-marketing", ""].join("\n"));

git("init", "-q");
git("config", "core.autocrlf", "false");
git("add", "-A");
git("commit", "-qm", "Invoice demo baseline (acceptance examples by Finance T01..T04 and Marketing T05)");

// Enabled increments: the acceptance command names one test file per enabled increment (T01 by Finance,
// T05 by Marketing). Add a file here to switch an increment on; the L2 stop gate holds the agent to all of them.
// TAP output lets the gate list each failing acceptance test by name.
run(process.execPath, [path.join(kit, "install.mjs"), "--target", ".",
  "--check", 'node --test --test-reporter=tap "tests/**/*.test.mjs"',
  "--acceptance-path", "acceptance/**",
  "--acceptance-owner", "Finance: Ingrid Berg (T01..T04, acceptance/); Marketing (T05, acceptance/marketing/)",
  "--acceptance-command", "node --test --test-reporter=tap acceptance/t01.test.mjs acceptance/marketing/t05.test.mjs",
  ...extra]);
git("add", "-A");
git("commit", "-qm", "Install Golden Path kit");

// Verify the frozen tasks and acceptance files (same format as `sha256sum -c FREEZE.sha256`).
const bad = fs.readFileSync(path.join(target, "FREEZE.sha256"), "utf8").split(/\r?\n/).filter(Boolean).filter((l) => {
  const [sum, file] = l.split(/\s+\*?/);
  return createHash("sha256").update(fs.readFileSync(path.join(target, file))).digest("hex") !== sum;
});
if (bad.length) { console.error("FREEZE.sha256 mismatch:\n" + bad.join("\n")); process.exit(1); }
console.log("frozen tasks and acceptance examples verified");
console.log(`Demo ready at ${target}`);
