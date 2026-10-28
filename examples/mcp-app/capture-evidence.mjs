import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { diffHash, headSha, resolveBase } from "../../plugin/scripts/gate.mjs";
import { sessionRecord, boundFile, evidencePath } from "./engineering-report.mjs";
import { captureSchema } from "./engineering-schema.mjs";

export function captureEvidence(target, id) {
  const root = fs.realpathSync(target);
  const st = sessionRecord(root, id);
  const ignored = spawnSync("git", ["check-ignore", "--quiet", "--", evidencePath(id)], { cwd: root, encoding: "utf8" });
  if (ignored.status !== 0) throw new Error("Ignore .local/ in the target repository before retaining local evidence.");
  const baseline = resolveBase(root, st.base_sha);
  if (baseline.error) throw new Error(baseline.error);
  const script = boundFile(root, ".github/hooks/golden-path/gate.mjs");
  const head = headSha(root), hash = diffHash(root);
  if (!head || !hash) throw new Error("Cannot establish verification provenance.");
  console.error(`Explicit verification: node ${script} check --base ${baseline.sha}`);
  const child = spawnSync(process.execPath, [script, "check", "--base", baseline.sha], {
    cwd: root, encoding: "utf8", timeout: 120000, maxBuffer: 4 * 1024 * 1024,
  });
  if (child.error) throw child.error;
  if (child.stderr) console.error(child.stderr.trim());
  if (child.status !== 0 && child.status !== 1) throw new Error(`Gate exited ${child.status}; no complete result retained.`);
  const result = JSON.parse(child.stdout);
  const saved = captureSchema.parse({
    version: 1, sessionId: id, root, recordedAt: new Date().toISOString(), head, diffHash: hash,
    stable: head === headSha(root) && hash === diffHash(root), result,
  });
  const destination = path.join(root, ...evidencePath(id).split("/"));
  let ancestor = path.dirname(destination);
  while (!fs.existsSync(ancestor)) ancestor = path.dirname(ancestor);
  const existing = fs.realpathSync(ancestor);
  const relative = path.relative(root, existing);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error("Evidence directory escapes the repository.");
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  const directory = fs.realpathSync(path.dirname(destination));
  if (path.relative(root, directory).startsWith("..")) throw new Error("Evidence directory escapes the repository.");
  if (fs.existsSync(destination)) boundFile(root, evidencePath(id));
  const temporary = `${destination}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(temporary, JSON.stringify(saved, null, 2), { flag: "wx" });
    fs.renameSync(temporary, destination);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
  console.log(`Retained actual gate output: ${destination}\n${saved.result.outcome}; stable snapshot: ${saved.stable}. Not owner approval.`);
  return child.status;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { values } = parseArgs({ options: { target: { type: "string" }, session: { type: "string" } }, allowPositionals: false });
    if (!values.target || !values.session) throw new Error("Usage: node capture-evidence.mjs --target REPO --session SESSION_ID");
    process.exitCode = captureEvidence(values.target, values.session);
  } catch (error) {
    console.error(`Verification evidence unavailable: ${error.message}`);
    process.exitCode = 1;
  }
}
