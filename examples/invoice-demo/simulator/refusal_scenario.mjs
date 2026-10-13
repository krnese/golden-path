#!/usr/bin/env node
// SCRIPTED SCENARIO (not an agent): "the agent tries to edit a protected acceptance test and is refused".
// Sends the payloads Copilot would send (documented in the Copilot hooks reference) to the installed
// hook script and prints what happens. Exit 0 only if every step behaves as expected.
// It shows the hook logic, not Copilot's behaviour.
//   1. edit tool on the acceptance test        -> guard DENIES
//   2. shell `sed -i` on it                     -> guard DENIES
//   3. the file is changed anyway (bypassing hooks), then the agent tries to stop -> gate BLOCKS (delegation change)
//   4. `git restore` of the test                -> guard ALLOWS; gate no longer reports acceptance-integrity
//      (it is still RED, honestly, because T01 is not implemented yet)
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const GATE = path.join(ROOT, ".github", "hooks", "golden-path", "gate.mjs");
const TEST = "acceptance/test_acceptance.py";
const hook = (cmd, payload) =>
  JSON.parse(spawnSync(process.execPath, [GATE, cmd], { input: JSON.stringify(payload), cwd: ROOT, encoding: "utf8" }).stdout || "{}");

const base = { sessionId: process.env.GOLDEN_PATH_SESSION || "refusal-demo", cwd: ROOT };
let ok = true;
hook("start", { ...base, source: "new" });

const d1 = hook("guard", { ...base, toolName: "edit", toolArgs: { path: TEST } });
console.log(`1. agent: edit ${TEST}\n   guard: ${d1.permissionDecision}: ${(d1.permissionDecisionReason || "").slice(0, 110)}...`);
ok &&= d1.permissionDecision === "deny";

const cmd = `sed -i 's/Decimal("0.08")/Decimal("0.07")/' ${TEST}`;
const d2 = hook("guard", { ...base, toolName: "bash", toolArgs: { command: cmd } });
console.log(`2. agent: ${cmd}\n   guard: ${d2.permissionDecision}`);
ok &&= d2.permissionDecision === "deny";

const file = path.join(ROOT, TEST);
const original = fs.readFileSync(file, "utf8");
fs.writeFileSync(file, original.replace('Decimal("0.08")', 'Decimal("0.07")'));
const g1 = hook("stop", { ...base, stopReason: "end_turn", stop_hook_active: false });
const reason = g1.reason || "";
console.log(`3. (file changed outside the hooks) agent: I'm done\n   gate: ${g1.decision}; mentions DELEGATION CHANGE: ${reason.includes("DELEGATION CHANGE")}`);
ok &&= g1.decision === "block" && reason.includes("DELEGATION CHANGE") && reason.includes("acceptance-integrity");

const d3 = hook("guard", { ...base, toolName: "bash", toolArgs: { command: `git restore ${TEST}` } });
ok &&= Object.keys(d3).length === 0;
execFileSync("git", ["restore", TEST], { cwd: ROOT });
ok &&= fs.readFileSync(file, "utf8") === original;
const g2 = hook("stop", { ...base, stopReason: "end_turn", stop_hook_active: true });
const still = (g2.reason || "").includes("acceptance-integrity");
console.log(`4. agent: git restore ${TEST}\n   guard: ${d3.permissionDecision || "allow"}; gate: ${g2.decision || "allow"} ` +
  `(acceptance-integrity still failing: ${still}; T01 itself is not implemented yet)`);
ok &&= !still;
console.log("RESULT:", ok ? "as expected" : "UNEXPECTED");
process.exitCode = ok ? 0 : 1;
