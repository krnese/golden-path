#!/usr/bin/env node
// Golden Path level 2: the ONE hook script. Plain JavaScript, Node.js built-ins only, Node >= 22.
// Hook formats: https://docs.github.com/en/copilot/reference/hooks-reference (version 1 files).
// Accepts camelCase payloads and the VS Code-compatible snake_case payloads.
//
//   node gate.mjs start                 sessionStart: record the FIXED base commit, method_files_present, context
//   node gate.mjs guard                 preToolUse: deny edits to protected acceptance tests / kit; ask on protected tests
//   node gate.mjs stop    (default)     agentStop: block while checks are red ({"decision":"block","reason":...})
//   node gate.mjs subagent start|stop   record use of the opt-in reviewer only, never blocks
//   node gate.mjs check --base <sha>    run the checks once (CI): compare against an explicit fixed commit
//
// What it is: fast feedback inside the agent session. It checks completion against the configured tests,
// not customer acceptance. Branch protection and human review stay the durable boundary.
// Honest limits:
// - ONE time budget (hook_budget_sec, default 100) covers every command AND git call this hook runs. Keep it below the
//   hook timeoutSec: if the hook itself times out, Copilot fails OPEN (the stop proceeds, nothing recorded).
// - After max_blocks (default 5, below the CLI's 8-consecutive-block override) the agent may stop, but the
//   run is recorded as outcome FAILED, requires_owner_review. No review request is sent by this script.
// - Protected-test checks are heuristics, not guarantees.
// - method_files_present means the skill files existed; it does not show the agent read or followed them.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const CONFIG_REL = ".golden-path/config.json";
export const STATE_REL = ".golden-path/state";
export const LEDGER_REL = ".golden-path/ledger.jsonl";
export const DEFAULT_CONFIG = {
  check: null, // REQUIRED: adopter's check command (exit 0 == green)
  protected: ["tests/**"], // developer tests guarded against weakening (heuristic)
  max_blocks: 5,
  hook_budget_sec: 100, // ONE budget for all commands and git calls in one hook run; keep below the hook timeoutSec
  acceptance: { paths: [], command: null, owner: "the acceptance owner" },
  research: { enabled: false },
};
const SKILL_CANDIDATES = [".github/skills/golden-path/SKILL.md", "skills/golden-path/SKILL.md"];
const HERE = path.dirname(fileURLToPath(import.meta.url));

// ---------- helpers ----------
export function readPayload() {
  if (process.stdin.isTTY) return {};
  try {
    const raw = fs.readFileSync(0, "utf8");
    const d = raw.trim() ? JSON.parse(raw) : {};
    return d && typeof d === "object" && !Array.isArray(d) ? d : {};
  } catch {
    return {};
  }
}
export const field = (p, camel, snake, dflt) => (camel in p ? p[camel] : snake && snake in p ? p[snake] : dflt);

// ONE deadline for the whole hook run: every git call takes its timeout from what is left of it.
let DEADLINE = Infinity;
export const setDeadline = (t) => { DEADLINE = t; };
export function git(root, ...args) {
  const left = DEADLINE - Date.now();
  if (left <= 0) return [124, "", "the hook time budget was used up"];
  const r = spawnSync("git", args, { cwd: root, encoding: "utf8", timeout: Math.min(30000, left), maxBuffer: 64 << 20 });
  return [r.status ?? 1, r.stdout || "", r.error ? String(r.error.code || r.error) : r.stderr || ""];
}
/** Evidence that could not be read. Integrity checks report it as UNVERIFIED, never as PASS. */
export class EvidenceError extends Error {}
function gitStrict(root, ...args) {
  const [code, out, err] = git(root, ...args);
  if (code !== 0) throw new EvidenceError(`git ${args.join(" ")} failed (${code}): ${String(err).trim().slice(0, 300)}`);
  return out;
}
/** The base must resolve to a commit object that is present locally (a shallow clone may not have it). */
export function resolveBase(root, base) {
  const [code, out] = git(root, "rev-parse", "--verify", "--quiet", `${base}^{commit}`);
  if (code === 0 && out.trim()) return { sha: out.trim() };
  const shallow = git(root, "rev-parse", "--is-shallow-repository")[1].trim() === "true";
  return { error: `baseline ${JSON.stringify(base)} does not resolve to a commit in this clone` +
    (shallow ? " (shallow clone: fetch full history, e.g. actions/checkout fetch-depth: 0)" : "") };
}
export function repoRoot(start) {
  start = start || process.cwd();
  const [code, out] = git(start, "rev-parse", "--show-toplevel");
  return code === 0 && out.trim() ? path.resolve(out.trim()) : path.resolve(start);
}
export function loadConfig(root) {
  const p = path.join(root, CONFIG_REL);
  const user = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : {};
  const cfg = { ...DEFAULT_CONFIG, ...user };
  cfg.acceptance = { ...DEFAULT_CONFIG.acceptance, ...(user.acceptance || {}) };
  return cfg;
}
export const headSha = (root) => {
  const [c, o] = git(root, "rev-parse", "HEAD");
  return c === 0 ? o.trim() : null;
};
export function diffHash(root) {
  const h = createHash("sha256").update(git(root, "diff", "HEAD", "--binary")[1]);
  for (const rel of git(root, "ls-files", "--others", "--exclude-standard")[1].split("\n").filter(Boolean).sort()) {
    h.update(rel);
    try { h.update(fs.readFileSync(path.join(root, rel))); } catch { /* vanished */ }
  }
  return h.digest("hex").slice(0, 16);
}
const fileHash = (p) => {
  try { return createHash("sha256").update(fs.readFileSync(p)).digest("hex").slice(0, 16); } catch { return null; }
};
export function sessionId(payload) {
  const sid = String(field(payload, "sessionId", "session_id") || process.env.GOLDEN_PATH_SESSION || "unknown");
  return sid.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 80) || "unknown";
}
export function state(root, sid, value) {
  const p = path.join(root, STATE_REL, sid + ".json");
  if (value === undefined) return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : {};
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(value, null, 1));
  return value;
}
export function ledger(root, event, data = {}) {
  const rec = { ts: Date.now() / 1000, event, arm: process.env.GOLDEN_PATH_ARM ?? null, ...data };
  const p = path.join(root, LEDGER_REL);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.appendFileSync(p, JSON.stringify(rec) + "\n");
  return rec;
}
const globRe = (p) =>
  new RegExp("^" + p.replace(/[.+^${}()|\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".") + "$");
export function matches(rel, patterns) {
  rel = rel.split(path.sep).join("/");
  return patterns.some((p) => (p.endsWith("/**") && (rel === p.slice(0, -3) || rel.startsWith(p.slice(0, -2)))) || globRe(p).test(rel));
}
const lf = (s) => s.replace(/\r\n/g, "\n"); // CRLF and LF checkouts of the same content are equal

// ---------- integrity checks (heuristics, not guarantees) ----------
const TEST_RE = /^\s*(def\s+test\w*|async\s+def\s+test\w*|(it|test)\s*\(|func\s+Test\w+|\[(Fact|Test|TestMethod|Theory)\])/gm;
const ASSERT_RE = /\b(assert\w*|expect\s*\(|Assert\.\w+|self\.fail|pytest\.raises|t\.(Error|Fatal)\w*)/g;
const SKIP_RE = /(@unittest\.skip|@pytest\.mark\.(skip|xfail)|\b(it|describe|test)\.(skip|only)\b|\bx(it|describe)\s*\(|expectedFailure|t\.Skip|\[Ignore\]|Skip\s*=)/g;
const counts = (t) => [TEST_RE, ASSERT_RE, SKIP_RE].map((re) => (t.match(re) || []).length);
const baseFiles = (root, patterns, base) => {
  return gitStrict(root, "ls-tree", "-r", "--name-only", base).split("\n").filter((r) => r && matches(r, patterns));
};
const readText = (p) => fs.readFileSync(p, "utf8");

/** Protected tests must not lose tests or assertions or gain skip markers. Adding tests is always allowed. */
export function testIntegrity(root, patterns, base = "HEAD") {
  const out = [];
  for (const rel of baseFiles(root, patterns, base)) {
    const p = path.join(root, rel);
    if (!fs.existsSync(p)) { out.push(`${rel}: protected test file deleted`); continue; }
    const [bt, ba, bs] = counts(gitStrict(root, "show", `${base}:${rel}`));
    const [at, aa, as] = counts(readText(p));
    if (at < bt) out.push(`${rel}: test count dropped ${bt} -> ${at}`);
    if (aa < ba) out.push(`${rel}: assertion count dropped ${ba} -> ${aa}`);
    if (as > bs) out.push(`${rel}: new skip/only/xfail marker(s) ${bs} -> ${as}`);
  }
  return out;
}

/** Any edit, deletion or new file under protected acceptance paths vs the fixed base commit. */
export function acceptanceChanges(root, patterns, base = "HEAD") {
  if (!patterns || !patterns.length) return [];
  const out = [];
  const inBase = baseFiles(root, patterns, base);
  for (const rel of inBase) {
    const p = path.join(root, rel);
    if (!fs.existsSync(p)) out.push(`${rel}: protected acceptance file deleted`);
    else if (lf(readText(p)) !== lf(gitStrict(root, "show", `${base}:${rel}`))) out.push(`${rel}: protected acceptance file modified`);
  }
  const added = new Set([
    ...gitStrict(root, "ls-files", "--others", "--exclude-standard").split("\n"),
    ...gitStrict(root, "diff", "--name-only", "--diff-filter=A", base).split("\n"),
  ]);
  for (const r of [...added].sort()) if (r && matches(r, patterns) && !inBase.includes(r)) out.push(`${r}: new file under protected acceptance paths`);
  return out;
}

const FAILED_TEST_RE = /^(?:FAIL|ERROR): (\S+)|^FAILED (?!\()(\S+)|^\s*✕ (.+)$|^--- FAIL: (\S+)|^not ok \d+ - (.+)$/gm;
const TIMEOUT_MARK = "\u0000golden-path-timeout\u0000";
const SUPERVISOR = `const { spawn, spawnSync } = require("node:child_process"); let s = "";
process.stdin.on("data", (d) => (s += d)).on("end", () => {
  const { cmd, ms } = JSON.parse(s), win = process.platform === "win32";
  const c = spawn(cmd, { shell: true, stdio: ["ignore", "inherit", "inherit"], detached: !win, windowsHide: true });
  const t = setTimeout(() => {
    if (win) spawnSync("taskkill", ["/pid", String(c.pid), "/T", "/F"], { stdio: "ignore" });
    else { try { process.kill(-c.pid, "SIGKILL"); } catch {} }
    process.stderr.write(${JSON.stringify(" golden-path-timeout ")}); process.exit(1);
  }, ms);
  c.on("error", (e) => { clearTimeout(t); process.stderr.write(String(e)); process.exit(1); });
  c.on("exit", (code) => { clearTimeout(t); process.exit(code ?? 1); });
});`;
function runCmd(name, cmd, root, deadline) {
  const left = deadline - Date.now();
  if (left <= 0) return { name, ok: false, output: `${name} not run: the hook time budget was used up (counted as RED)` };
  // Run via a small node supervisor so a timeout kills the WHOLE process tree (taskkill /T on Windows,
  // process group on POSIX). A plain spawnSync timeout kills only the shell and leaves grandchildren running.
  const r = spawnSync(process.execPath, ["-e", SUPERVISOR], { cwd: root, encoding: "utf8", input: JSON.stringify({ cmd, ms: left }),
    timeout: left + 10000, maxBuffer: 64 << 20, windowsHide: true,
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" } }); // no stale bytecode for restored files
  const out = `${r.stdout || ""}\n${(r.stderr || "").replace(TIMEOUT_MARK, "")}`;
  if ((r.error && r.error.code === "ETIMEDOUT") || (r.stderr || "").includes(TIMEOUT_MARK))
    return { name, ok: false, output: `${name} timed out: the hook time budget ran out (counted as RED)` };
  const failed = [...new Set([...out.matchAll(FAILED_TEST_RE)].map((m) => m.slice(1).find(Boolean)))].sort();
  return { name, ok: r.status === 0, failed_tests: failed, output: out.trim().split("\n").slice(-60).join("\n") };
}

/** Everything in one hook run (commands, git calls, integrity checks) shares ONE deadline.
 * base must be a fixed commit recorded before the work started. Unreadable evidence is UNVERIFIED, never PASS.
 * opts.allowAcceptanceChange: an owner-authorised acceptance revision (see README); acceptance-integrity is
 * then reported as skipped, and the authorisation must come from CODEOWNERS review, not from this flag. */
export function runChecks(root, cfg, base = "HEAD", started = Date.now(), opts = {}) {
  const deadline = started + 1000 * Number(cfg.hook_budget_sec ?? cfg.check_timeout_sec ?? 100);
  setDeadline(deadline);
  const acc = cfg.acceptance, res = [];
  const step = (name, fn, extra = {}) => {
    const at = Date.now() - started;
    if (Date.now() >= deadline) return res.push({ name, ok: false, unverified: true, started_ms: at, ...extra,
      output: `${name} not run: the hook time budget was used up (UNVERIFIED, counted as RED)` });
    try { res.push({ ...fn(), started_ms: at, ...extra }); }
    catch (e) {
      if (!(e instanceof EvidenceError)) throw e;
      res.push({ name, ok: false, unverified: true, started_ms: at, ...extra, output: `${name} UNVERIFIED: ${e.message}` });
    }
  };
  const b = resolveBase(root, base);
  if (b.error) res.push({ name: "baseline", ok: false, unverified: true, started_ms: 0, output: `baseline UNVERIFIED: ${b.error}` });
  step("check", () => cfg.check ? runCmd("check", cfg.check, root, deadline)
    : { name: "config", ok: false, output: "No check command configured in .golden-path/config.json ('check')." });
  if (acc.command) step("acceptance", () => runCmd("acceptance", acc.command, root, deadline));
  const integrity = (name, f, extra = {}) => step(name, () => {
    if (b.error) throw new EvidenceError("no valid baseline to compare with");
    const v = f(b.sha);
    return { name, ok: !v.length, output: v.join("\n") };
  }, extra);
  integrity("test-integrity", (sha) => testIntegrity(root, cfg.protected || [], sha));
  if (opts.allowAcceptanceChange) res.push({ name: "acceptance-integrity", ok: true, skipped: true, owner: acc.owner, started_ms: Date.now() - started,
    output: "skipped: authorised acceptance revision (owner approval must come from CODEOWNERS review)" });
  else integrity("acceptance-integrity", (sha) => acceptanceChanges(root, acc.paths || [], sha), { owner: acc.owner });
  const ok = res.every((r) => r.ok), unverified = res.some((r) => r.unverified);
  return { ok, outcome: ok ? "PASSED" : unverified ? "UNVERIFIED" : "FAILED", base, base_sha: b.sha || null, results: res,
    failed: res.filter((r) => !r.ok).map((r) => r.name), unverified: res.filter((r) => r.unverified).map((r) => r.name),
    failed_tests: [...new Set(res.flatMap((r) => r.failed_tests || []))].sort(), budget_sec: (deadline - started) / 1000,
    deadline_ms: deadline - started };
}

export function onStart(payload) {
  const root = repoRoot(field(payload, "cwd"));
  const cfg = loadConfig(root), sid = sessionId(payload);
  const skill = [...SKILL_CANDIDATES.map((s) => path.join(root, s)),
    path.join(process.env.PLUGIN_ROOT || path.dirname(HERE), "skills/golden-path/SKILL.md")].find((p) => fs.existsSync(p)) || null;
  const method = skill ? path.join(path.dirname(skill), "references", "METHOD.md") : null;
  const st = state(root, sid);
  st.base_sha = st.base_sha || headSha(root); // fixed comparison commit for the whole session
  st.base_source = st.base_source || "session-start";
  st.started = st.started || Date.now() / 1000;
  st.task = process.env.GOLDEN_PATH_TASK || st.task || null;
  state(root, sid, st);
  ledger(root, "method_files_present", { session: sid, source: field(payload, "source") ?? null, skill_found: !!skill,
    skill_hash: skill && fileHash(skill), method_hash: method && fileHash(method), base_sha: st.base_sha, task: st.task,
    note: "files existed and context was offered; does not show the agent read or followed them" });
  const ctx = ["Golden Path is active. Follow the golden-path skill (Intent -> Context -> Boundary -> Acceptance -> Report).",
    "A stop gate runs the configured checks when you finish; you cannot stop while they are red.",
    "Do not delete, skip or weaken existing tests; add new tests instead."];
  if ((cfg.acceptance.paths || []).length)
    ctx.push(`Protected acceptance tests owned by ${cfg.acceptance.owner}: ${cfg.acceptance.paths.join(", ")}. Read and run them; ` +
      "never change them. If one seems wrong, stop and report a DELEGATION CHANGE to the owner.");
  return { additionalContext: ctx.join("\n") };
}

export function onStop(payload) {
  const t0 = Date.now();
  const root = repoRoot(field(payload, "cwd"));
  const cfg = loadConfig(root), sid = sessionId(payload);
  const st = state(root, sid);
  st.started = st.started || t0 / 1000;
  if (!st.base_sha) { st.base_sha = headSha(root); st.base_source = "first-stop (sessionStart did not run; base may include agent commits)"; }
  st.blocks = st.blocks || 0;
  st.attempts = (st.attempts || 0) + 1;
  const res = runChecks(root, cfg, st.base_sha || "HEAD", t0);
  setDeadline(Infinity); // bookkeeping below (ledger, HEAD, diff hash) must still be recorded
  const owner = cfg.acceptance.owner, limit = Number(cfg.max_blocks ?? 5);
  const rec = { session: sid, task: st.task || process.env.GOLDEN_PATH_TASK || null, attempt: st.attempts, ok: res.ok,
    failed: res.failed, unverified: res.unverified, failed_tests: res.failed_tests, elapsed_sec: Math.round(1000 * (t0 / 1000 - st.started)) / 1000,
    base_sha: st.base_sha, base_source: st.base_source, head_sha: headSha(root), diff_hash: diffHash(root),
    stop_hook_active: !!field(payload, "stop_hook_active", "stop_hook_active") };
  let out = {};
  if (res.ok) {
    ledger(root, "gate_green", { outcome: "PASSED", ...rec });
    st.blocks = 0; st.outcome = "PASSED";
  } else if (st.blocks >= limit) {
    // Runaway guard: the agent may stop, but the run is FAILED. Never an implicit pass. No review request is sent.
    ledger(root, "gave_up", { outcome: "FAILED", requires_owner_review: owner, ...rec });
    st.blocks = 0; st.outcome = "FAILED";
  } else {
    st.blocks += 1;
    ledger(root, "gate_red", { outcome: res.unverified.length ? "UNVERIFIED" : "RED", ...rec });
    let extra = "";
    if (res.failed.includes("acceptance-integrity")) {
      ledger(root, "acceptance_change_attempt", { owner, ...rec });
      extra = `\n\nProtected acceptance tests were changed. Restore them (git restore <path>). If you believe an acceptance ` +
        `example is wrong, that is a DELEGATION CHANGE: stop and report to ${owner}: what changed, why, consequence, ` +
        "evidence, unknowns, decision required.";
    }
    const last = st.blocks < limit ? "" : `\nThis is the last block. If you stop while red, the run is recorded as FAILED ` +
      `and requires review by ${owner}.`;
    const detail = res.results.filter((r) => !r.ok).map((r) => `[${r.name}]\n${r.output}`).join("\n\n");
    out = { decision: "block", reason: `Golden Path stop gate: checks are RED (attempt ${st.attempts}, block ${st.blocks}/${limit}). ` +
      `Fix the cause; do not weaken, skip or delete tests.${extra}${last}\n\n${detail.slice(0, 6000)}` };
  }
  state(root, sid, st);
  return out;
}

export function onSubagent(payload, phase) {
  if ((field(payload, "agentName", "agent_name", "") || "") === "golden-path-reviewer") {
    const root = repoRoot(field(payload, "cwd"));
    const resp = field(payload, "response", "last_assistant_message", "") || "";
    ledger(root, "reviewer_" + phase, { session: sessionId(payload), response_chars: resp.length, head_sha: headSha(root) });
  }
  return {};
}

// ---------- guard (preToolUse) ----------
const KIT_PATTERNS = [".github/hooks/golden-path*", ".github/hooks/golden-path/**", ".golden-path/config.json"];
const PATH_KEYS = ["path", "file_path", "filePath", "filename", "file", "target_file"];
const EDIT_TOOLS = new Set(["edit", "str_replace_editor", "apply_patch", "create", "write", "Edit", "Write"]);
const SHELL_TOOLS = new Set(["bash", "powershell", "Bash", "shell"]);
const RESTORE_TO_HEAD = /^git\s+(?:checkout\s+(?:HEAD\s+)?--|restore(?:\s+--worktree)?(?:\s+--)?)(?:\s+[\w./*'"-]+)+$/;
const DESTRUCTIVE = /\b(rm|del|rmdir|mv|move|unlink|truncate|git\s+rm|git\s+mv|git\s+checkout|git\s+stash|cp|tee|git\s+restore|sed\s+-i|perl\s+-pi)\b|Remove-Item|Set-Content|Out-File/;
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Canonical path: resolve symlinks and Windows 8.3 short names (RUNNER~1) via the longest existing ancestor,
// so an absolute path spelled differently from the git root still maps to the same repo-relative path.
function canon(p) {
  let head = path.resolve(p); const tail = [];
  while (true) {
    try { return path.join(fs.realpathSync.native(head), ...tail); } catch {}
    const up = path.dirname(head); if (up === head) return path.resolve(p);
    tail.unshift(path.basename(head)); head = up;
  }
}
const relTo = (root, p) => path.relative(canon(root), canon(path.resolve(root, p))).split(path.sep).join("/");
const acceptanceDeny = (cfg, what) => ({ permissionDecision: "deny", permissionDecisionReason:
  `${what} is a protected acceptance test owned by ${cfg.acceptance.owner}. Agents may read and run it, never change it. ` +
  `If it looks wrong, that is a DELEGATION CHANGE: stop and report to ${cfg.acceptance.owner} ` +
  "(what changed, why, consequence, evidence, unknowns, decision required)." });

export function decide(root, cfg, tool, args) {
  const prot = cfg.protected || [], acc = cfg.acceptance.paths || [];
  if (EDIT_TOOLS.has(tool)) {
    const paths = args && typeof args === "object" ? PATH_KEYS.filter((k) => typeof args[k] === "string").map((k) => args[k]) : [];
    for (const p of paths) {
      const r = relTo(root, p);
      if (acc.length && matches(r, acc)) return acceptanceDeny(cfg, r);
      if (matches(r, KIT_PATTERNS)) return { permissionDecision: "deny", permissionDecisionReason:
        `${r} is part of the Golden Path kit/config; change it in a reviewed PR, not in an agent session.` };
      if (matches(r, prot) && fs.existsSync(path.join(root, r))) return { permissionDecision: "ask", permissionDecisionReason:
        `${r} is an existing protected test. Editing it can weaken the evidence; add a new test instead, or get human approval.` };
    }
    return {};
  }
  if (SHELL_TOOLS.has(tool) && args && typeof args === "object") {
    const cmd = String(args.command || args.cmd || "");
    const norm = cmd.replace(/\\/g, "/");
    if (RESTORE_TO_HEAD.test(norm.trim()) && !/\s(--source|-s)\b/.test(norm)) return {}; // back to the committed bytes
    for (const pat of acc) {
      const stem = pat.split("*")[0].replace(/\/+$/, "");
      if (stem && ((DESTRUCTIVE.test(norm) && norm.includes(stem)) || new RegExp(">>?\\s*['\"]?(?:\\./)?" + esc(stem)).test(norm)))
        return acceptanceDeny(cfg, stem);
    }
    for (const pat of [...prot, ...KIT_PATTERNS]) {
      const stem = pat.split("*")[0].replace(/\/+$/, "");
      if (!stem) continue;
      const ref = new RegExp("(?:^|[\\s'\"=(])(?:\\./)?" + esc(stem) + "(?:[/\\s'\")]|$)");
      if ((DESTRUCTIVE.test(norm) && ref.test(norm)) || new RegExp(">>?\\s*['\"]?(?:\\./)?" + esc(stem)).test(norm))
        return { permissionDecision: "deny", permissionDecisionReason: `Shell command modifies/deletes protected path '${stem}'. Not allowed in an agent session.` };
    }
    if (/--no-verify\b/.test(cmd)) return { permissionDecision: "deny", permissionDecisionReason: "--no-verify bypasses repository checks." };
  }
  return {};
}

// "ask" acts as deny in cloud agent and CLI autopilot. Command-hook errors fail CLOSED, so this never throws:
// on any error it allows and leaves the stop gate as the backstop.
export function onGuard(payload) {
  try {
    const root = repoRoot(field(payload, "cwd"));
    const cfg = loadConfig(root);
    const tool = field(payload, "toolName", "tool_name", "");
    let args = field(payload, "toolArgs", "tool_input", {});
    if (typeof args === "string") { try { args = JSON.parse(args); } catch { args = { command: args }; } }
    const out = decide(root, cfg, tool, args);
    if (["deny", "ask"].includes(out.permissionDecision))
      ledger(root, "guard_" + out.permissionDecision, { tool, session: sessionId(payload), reason: out.permissionDecisionReason });
    return out;
  } catch (e) {
    process.stderr.write(`golden-path guard error (allowing; the stop gate is the backstop): ${e}\n`);
    return {};
  }
}

export function main(argv) {
  const cmd = argv[0] || "stop";
  if (cmd === "check") {
    const i = argv.indexOf("--base");
    const base = i >= 0 ? argv[i + 1] : process.env.GOLDEN_PATH_BASE;
    const root = repoRoot();
    const res = runChecks(root, loadConfig(root), base || "HEAD", Date.now(),
      { allowAcceptanceChange: argv.includes("--authorized-acceptance-revision") });
    if (!base) res.warning = "no --base given: compared with HEAD, which includes any agent commits. Pass a fixed commit.";
    process.stdout.write(JSON.stringify(res, null, 1) + "\n");
    return res.ok ? 0 : 1;
  }
  const payload = readPayload();
  const out = cmd === "start" ? onStart(payload) : cmd === "guard" ? onGuard(payload)
    : cmd === "subagent" ? onSubagent(payload, argv[1] || "start") : onStop(payload);
  process.stdout.write(JSON.stringify(out));
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) process.exitCode = main(process.argv.slice(2));
