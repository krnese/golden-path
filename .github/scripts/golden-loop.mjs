#!/usr/bin/env node
// Golden Loop checks for this repository. Built-ins only (Node 22+).
//   issue-closed: reopen a golden-loop issue that a merged change closed before its owner recorded
//                 "Owner judgment: meets the need". The owner, not a merge, decides when it is done.
//   pr-evidence:  a PR linked to a golden-loop issue must show expected versus actual for each of the
//                 issue's examples in its description, where the owner reviews it.
// Usage: node golden-loop.mjs issue-closed --repo OWNER/REPO --issue N [--dry-run] [--as-of ISO] [--force]
//        node golden-loop.mjs pr-evidence  --repo OWNER/REPO --pr N
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { pathToFileURL } from "node:url";

export const LABEL = "golden-loop";
export const VERDICTS = ["meets the need", "needs revision", "cannot yet judge"];
const TRUSTED_ASSOCIATIONS = new Set(["OWNER", "MEMBER", "COLLABORATOR"]);

const lines = (text) => String(text ?? "").replace(/\r\n/g, "\n");

// Text under the first markdown heading containing `title`, up to the next heading of any level.
export function section(body, title) {
  const text = lines(body);
  const heads = [...text.matchAll(/^#{1,6}[ \t]+(.+)$/gm)];
  const i = heads.findIndex((h) => h[1].toLowerCase().includes(title.toLowerCase()));
  if (i < 0) return null;
  const start = heads[i].index + heads[i][0].length;
  const end = i + 1 < heads.length ? heads[i + 1].index : text.length;
  return text.slice(start, end);
}

export function parseOwners(body) {
  const text = section(body, "Named owner") ?? lines(body).match(/^\s*\**\s*Owner\s*\**\s*:\s*(.+)$/im)?.[1] ?? "";
  return [...new Set([...text.matchAll(/@([A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)/g)].map((m) => m[1].toLowerCase()))];
}

// Example IDs are list items that start with an ID such as E1 or T05.
export function exampleIds(body) {
  const text = section(body, "examples") ?? lines(body);
  return [...new Set([...text.matchAll(/^\s*[-*+]\s*\**\s*([A-Z]{1,4}\d{1,3})\b/gm)].map((m) => m[1]))];
}

export function parseJudgment(text) {
  const m = lines(text).match(/owner judge?ment\**\s*:\s*\**\s*(meets the need|needs revision|cannot yet judge)/i);
  return m ? m[1].toLowerCase() : null;
}

// Latest judgment by a named owner (or, when none is named, by an owner/member/collaborator).
export function latestJudgment(comments, owners, asOf) {
  const cutoff = asOf ? Date.parse(asOf) : Infinity;
  const byOwner = (c) => owners.length
    ? owners.includes(String(c.user?.login ?? "").toLowerCase())
    : TRUSTED_ASSOCIATIONS.has(c.author_association);
  const found = comments
    .filter((c) => Date.parse(c.created_at) <= cutoff && byOwner(c))
    .map((c) => ({ verdict: parseJudgment(c.body), author: c.user?.login, at: c.created_at, url: c.html_url }))
    .filter((j) => j.verdict);
  return found.length ? found[found.length - 1] : null;
}

// Code is not instruction: GitHub ignores closing keywords in code, and so do we. Inline spans may use
// any run of backticks (``Fixes #38``), closed by the same run. A run must start at a run boundary, so an
// unmatched delimiter stays literal text and cannot swallow a real reference that follows it.
export function stripCode(text) {
  return lines(text)
    .replace(/^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, "")
    .replace(/(?<!`)(`+)(?!`)[^\n]*?(?<!`)\1(?!`)/g, "");
}

// A reference to another repository (other/repo#38) is not this repository's #38.
const CLOSING = /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s*:?\s+([\w.-]+\/[\w.-]+)?#(\d+)\b/gi;
function closingIn(stripped, repo) {
  const here = repo?.toLowerCase();
  return [...stripped.matchAll(CLOSING)]
    .filter((m) => !m[1] || (here && m[1].toLowerCase() === here))
    .map((m) => Number(m[2]));
}
export function closingReferences(text, repo) {
  return [...new Set(closingIn(stripCode(text), repo))];
}

// Issues this PR works on: closing keywords plus explicit work references such as "Refs #38" or
// "Part of #38". A passing mention ("see #38") does not put the PR in scope.
const WORK = /\b(?:refs?|references|part of|implements|addresses)\s*:?\s+#(\d+)\b/gi;
export function workReferences(text, repo) {
  const t = stripCode(text);
  return [...new Set([...closingIn(t, repo), ...[...t.matchAll(WORK)].map((m) => Number(m[1]))])];
}

function cells(row) {
  let r = row.trim();
  if (r.startsWith("|")) r = r.slice(1);
  if (r.endsWith("|") && !r.endsWith("\\|")) r = r.slice(0, -1);
  return r.split(/(?<!\\)\|/).map((c) => c.trim());
}
const PLACEHOLDER = /^(?:[-–—…?.\s]*|tbd|todo)$/i;
// Formatting is not content: **TBD**, `…` and _TBD_ are still placeholders. Only used for this test, so code
// content in a filled-in cell is kept.
const normalized = (v) => String(v ?? "").replace(/(`+)([\s\S]*?)\1/g, "$2").replace(/[*_~]/g, "").trim();
const placeholder = (v) => PLACEHOLDER.test(normalized(v));

// GFM tables: a header row with pipes, a delimiter row with the same number of cells, then rows (outer pipes
// optional) until a blank line or another block starts. A delimiter cell is one or more hyphens (`| - | :-: |`).
const DELIMITER = /^\s*\|?\s*:?-+:?\s*(?:\|\s*:?-+:?\s*)*\|?\s*$/;
const BLOCK_START = /^\s*(?:#{1,6}\s|>|`{3,}|~{3,}|[-*+]\s|\d+[.)]\s)/;

// Pick distinct columns: Expected, Actual (preferring headers that name only one of them), and the example ID.
function columns(head) {
  const pick = (want, avoid, taken) => {
    const open = head.map((h, i) => i).filter((i) => !taken.includes(i) && want.test(head[i]));
    return open.find((i) => !avoid.test(head[i])) ?? open[0] ?? -1;
  };
  const ei = pick(/expected/i, /actual/i, []);
  const ai = pick(/actual/i, /expected/i, [ei]);
  if (ei < 0 || ai < 0) return null;
  const rest = head.map((h, i) => i).filter((i) => i !== ei && i !== ai);
  const xi = rest.find((i) => /example/i.test(head[i])) ?? rest[0];
  return xi === undefined ? null : { ei, ai, xi };
}

// The lines GitHub renders as text, with what it does not show as a table blanked out:
// - fenced code blocks (``` or ~~~, three or more, any info string, up to the closing fence or the end) are code;
// - HTML comments are hidden, across lines, and an unterminated <!-- hides everything to the end;
// - a <!-- inside an inline code span is code, not a comment, so the span is kept as written.
// In a table row GitHub splits the row into cells first and finds code spans within each cell, so a backtick in one
// cell cannot pair with one in another; outside tables a code span may contain a pipe.
const FENCE_OPEN = /^ {0,3}(`{3,}(?=[^`]*$)|~{3,})/;
const PIPE = /(?<!\\)\|/;
function tableHeader(row, delimiter) {
  return PIPE.test(row) && DELIMITER.test(delimiter) && cells(row).length === cells(delimiter).length;
}
function visibleDocument(body) {
  const out = [];
  const headers = new Set();
  const raw = lines(body).split("\n");
  let fence = null;
  let comment = false;
  let table = false;
  let delimiterRow = -1;
  for (let n = 0; n < raw.length; n++) {
    const line = raw[n];
    if (fence) {
      if (new RegExp(`^ {0,3}${fence[0]}{${fence.length},}[ \\t]*$`).test(line)) fence = null;
      out.push("");
      continue;
    }
    const f = !comment && line.match(FENCE_OPEN);
    if (f) { fence = f[1]; table = false; out.push(""); continue; }
    if (!line.trim() || (n !== delimiterRow && BLOCK_START.test(line))) table = false;
    const next = raw[n + 1] ?? "";
    const header = !table && !comment && tableHeader(line, next);
    let text = "";
    let k = 0;
    while (k < line.length) {
      if (comment) {
        const end = line.indexOf("-->", k);
        if (end < 0) { k = line.length; break; }
        comment = false;
        k = end + 3;
        continue;
      }
      const run = line.slice(k).match(/^`+/)?.[0];
      if (run) {
        const from = k + run.length;
        const cellEnd = table || header ? line.slice(from).search(PIPE) : -1;
        const limit = cellEnd < 0 ? line.length : from + cellEnd;
        const close = new RegExp(`(?<!\`)${run}(?!\`)`, "g");
        close.lastIndex = from;
        const m = close.exec(line);
        const stop = m && m.index < limit ? m.index + run.length : from;
        text += line.slice(k, stop);
        k = stop;
        continue;
      }
      if (line.startsWith("<!--", k)) { comment = true; k += 4; continue; }
      text += line[k++];
    }
    if (header && !comment && tableHeader(text, next)) {
      table = true;
      delimiterRow = n + 1;
      headers.add(n);
    }
    if (!text.trim()) table = false;
    out.push(text);
  }
  return { rows: out, headers };
}
export function visibleLines(body) {
  return visibleDocument(body).rows;
}

// Evidence is a table with distinct Expected and Actual columns. An example counts as covered only when its ID is
// in the table's example column and both its Expected and Actual cells are filled in. IDs in prose, in HTML
// comments, in an empty template row or next to formatted placeholders do not count.
export function evidenceCheck(prBody, ids) {
  const { rows, headers } = visibleDocument(prBody);
  const filled = new Set();
  const empty = new Set();
  let hasTable = false;
  let anyFilled = false;
  for (let i = 0; i + 1 < rows.length; i++) {
    if (!headers.has(i)) continue;
    const head = cells(rows[i]);
    const col = columns(head);
    if (!col) continue;
    hasTable = true;
    let j = i + 2;
    for (; j < rows.length && rows[j].trim() && !BLOCK_START.test(rows[j]); j++) {
      const c = cells(rows[j]);
      const complete = [c[col.ei], c[col.ai]].every((v) => v && !placeholder(v));
      anyFilled ||= complete;
      for (const id of ids) {
        if (new RegExp(`\\b${id}\\b`).test(c[col.xi] ?? "")) (complete ? filled : empty).add(id);
      }
    }
    i = j - 1;
  }
  const missing = ids.filter((id) => !filled.has(id));
  const ok = hasTable && missing.length === 0 && (ids.length > 0 || anyFilled);
  return { ok, hasTable, missing, empty: missing.filter((id) => empty.has(id)) };
}

// closer: { type: "PullRequest" | "Commit", number? } or null when a person closed the issue directly.
export function decideOnClose({ closer, judgment }) {
  if (!closer || !["PullRequest", "Commit"].includes(closer.type)) {
    return { action: "none", reason: "closed by a person, not by a merged change" };
  }
  if (judgment?.verdict === "meets the need") {
    return { action: "none", reason: `the owner recorded "meets the need" (${judgment.author}, ${judgment.at})` };
  }
  const why = judgment ? `the owner's latest judgment is "${judgment.verdict}"` : "no owner judgment was recorded";
  return { action: "reopen", reason: why };
}

export function reopenComment({ closer, reason, owners }) {
  const by = closer.type === "PullRequest" ? `merged pull request #${closer.number}` : `commit ${closer.oid?.slice(0, 7)}`;
  const ask = owners.length
    ? `${owners.map((o) => `@${o}`).join(", ")}: please record`
    : "No owner with an @username is named in this issue, so no judgment can be recognised. Name the owner by " +
      "@username in the issue; they should then record";
  return [
    `Reopened by the Golden Loop workflow: this issue was closed by ${by}, but ${reason}.`,
    "",
    `The owner decides when it is done. ${ask} \`Owner judgment: meets the need\`, ` +
      "`needs revision` or `cannot yet judge`, with reasons, then close the issue themselves.",
  ].join("\n");
}

// Only a judgment by an owner named with an @username counts. Without one, nobody's judgment is recognised:
// failing closed keeps a collaborator's comment from standing in for the owner's decision.
export function ownerJudgment(comments, owners, asOf) {
  return owners.length ? latestJudgment(comments, owners, asOf) : null;
}

// ---- GitHub API (only used by the CLI) ----

function token() {
  const t = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (t) return t;
  return execFileSync("gh", ["auth", "token"], { encoding: "utf8" }).trim();
}

async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      authorization: `Bearer ${token()}`,
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path}: HTTP ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

async function graphql(query, variables) {
  const out = await api("/graphql", { method: "POST", body: { query, variables } });
  if (out.errors?.length) throw new Error(`GraphQL: ${JSON.stringify(out.errors)}`);
  return out.data;
}

async function comments(repo, number) {
  const all = [];
  for (let page = 1; ; page++) {
    const batch = await api(`/repos/${repo}/issues/${number}/comments?per_page=100&page=${page}`);
    all.push(...batch);
    if (batch.length < 100) return all;
  }
}

const CLOSED_QUERY = `query($owner: String!, $name: String!, $number: Int!) {
  repository(owner: $owner, name: $name) { issue(number: $number) {
    state body labels(first: 50) { nodes { name } }
    timelineItems(itemTypes: [CLOSED_EVENT], last: 20) { nodes { ... on ClosedEvent {
      createdAt closer { __typename ... on PullRequest { number } ... on Commit { oid } } } } }
  } } }`;

export async function issueClosed({ repo, issue, dryRun = false, asOf, force = false, log = console.log }) {
  const [owner, name] = repo.split("/");
  const data = (await graphql(CLOSED_QUERY, { owner, name, number: issue })).repository.issue;
  const labels = data.labels.nodes.map((l) => l.name);
  if (!force && !labels.includes(LABEL)) return log(`#${issue}: not labelled ${LABEL}; nothing to do.`), { action: "none" };
  if (!asOf && data.state !== "CLOSED") return log(`#${issue}: already open; nothing to do.`), { action: "none" };
  const cutoff = asOf ? Date.parse(asOf) : Infinity;
  const closes = data.timelineItems.nodes.filter((n) => Date.parse(n.createdAt) <= cutoff);
  const last = closes[closes.length - 1];
  if (!last) return log(`#${issue}: no closure at or before ${asOf}.`), { action: "none" };
  const c = last.closer;
  const closer = c ? { type: c.__typename, number: c.number, oid: c.oid } : null;
  const owners = parseOwners(data.body);
  const judgment = ownerJudgment(await comments(repo, issue), owners, asOf ?? last.createdAt);
  const decision = decideOnClose({ closer, judgment });
  if (decision.action === "reopen" && !owners.length) decision.reason = "no owner is named by @username";
  log(`#${issue}: closed ${last.createdAt} by ${closer ? `${closer.type} ${closer.number ?? closer.oid}` : "a person"}; ` +
    `owners: ${owners.join(", ") || "(none named)"}; decision: ${decision.action} (${decision.reason})`);
  if (decision.action === "reopen" && !dryRun) {
    await api(`/repos/${repo}/issues/${issue}`, { method: "PATCH", body: { state: "open" } });
    await api(`/repos/${repo}/issues/${issue}/comments`, { method: "POST", body: { body: reopenComment({ closer, reason: decision.reason, owners }) } });
    log(`#${issue}: reopened and commented.`);
  }
  return decision;
}

const PR_LINKS_QUERY = `query($owner: String!, $name: String!, $number: Int!) {
  repository(owner: $owner, name: $name) { pullRequest(number: $number) {
    closingIssuesReferences(first: 20) { nodes { number repository { nameWithOwner } } } } } }`;

// Anything this check could not verify is reported as UNVERIFIED and fails, never as "not applicable".
export async function prEvidence({ repo, pr, log = console.log }) {
  const [owner, name] = repo.split("/");
  const pull = await api(`/repos/${repo}/pulls/${pr}`);
  const body = pull.body ?? "";
  const linked = (await graphql(PR_LINKS_QUERY, { owner, name, number: pr })).repository.pullRequest
    .closingIssuesReferences.nodes
    .filter((n) => n.repository.nameWithOwner.toLowerCase() === repo.toLowerCase())
    .map((n) => n.number);
  const golden = [];
  const unverified = [];
  for (const n of new Set([...workReferences(body, repo), ...linked])) {
    let issue;
    try {
      issue = await api(`/repos/${repo}/issues/${n}`);
    } catch (e) {
      if (!/: HTTP 404 /.test(e.message)) unverified.push(`#${n} (${e.message.split(" ").slice(0, 4).join(" ")})`);
      continue;
    }
    if (!issue.pull_request && issue.labels.some((l) => l.name === LABEL)) golden.push(issue);
  }
  const out = [`### Golden Loop evidence on PR #${pr}`, ""];
  let ok = unverified.length === 0;
  if (unverified.length) out.push(`- Could not look up: **${unverified.join(", ")}**`);
  if (!golden.length && !unverified.length) out.push(`Not working on a \`${LABEL}\` issue; nothing to check.`);
  const closing = new Set([...closingReferences(body, repo), ...linked]);
  for (const issue of golden) {
    const ids = exampleIds(issue.body);
    const r = evidenceCheck(body, ids);
    ok &&= r.ok;
    out.push(`**#${issue.number}** examples: ${ids.join(", ") || "(none listed)"}`);
    out.push(r.hasTable ? "- Expected/actual table: found" : "- Expected/actual table: **missing** (a table with Expected and Actual columns)");
    if (r.empty.length) out.push(`- Rows with an empty Expected or Actual cell: **${r.empty.join(", ")}**`);
    if (r.missing.length) out.push(`- Examples without filled-in evidence: **${r.missing.join(", ")}**`);
    if (!ids.length && r.hasTable && !r.ok) out.push("- No row has both Expected and Actual filled in");
    if (closing.has(issue.number)) {
      out.push(`- Closing keyword for #${issue.number}: merging will close it before the owner's judgment ` +
        "unless they record one first. Prefer `Refs`.");
      log(`::warning::PR closes golden-loop issue #${issue.number} on merge; the owner should record a judgment first.`);
    }
  }
  out.push("", unverified.length ? "Result: **UNVERIFIED**. A referenced issue could not be looked up; rerun the check."
    : !golden.length ? "Result: **not applicable**."
      : ok ? "Result: **evidence present**."
        : "Result: **evidence missing**. Fill in expected versus actual for each example in the PR description.");
  const summary = out.join("\n") + "\n";
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  log(summary);
  if (!ok) log(unverified.length ? "::error::Golden Loop evidence UNVERIFIED: an issue lookup failed."
    : "::error::Golden Loop evidence missing from the PR description.");
  return { ok, unverified, issues: golden.map((i) => i.number) };
}

function args(argv) {
  const o = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run" || a === "--force") o[a.slice(2).replace("-r", "R")] = true;
    else if (a.startsWith("--")) o[a.slice(2).replace(/-(\w)/g, (_, c) => c.toUpperCase())] = argv[++i];
    else o._.push(a);
  }
  return o;
}

async function main() {
  const o = args(process.argv.slice(2));
  const repo = o.repo ?? process.env.GITHUB_REPOSITORY;
  if (o._[0] === "issue-closed") {
    await issueClosed({ repo, issue: Number(o.issue), dryRun: !!o.dryRun, asOf: o.asOf, force: !!o.force });
  } else if (o._[0] === "pr-evidence") {
    const r = await prEvidence({ repo, pr: Number(o.pr) });
    process.exitCode = r.ok ? 0 : 1;
  } else {
    console.error("usage: golden-loop.mjs issue-closed --repo O/R --issue N [--dry-run] [--as-of ISO] [--force]\n" +
      "       golden-loop.mjs pr-evidence --repo O/R --pr N");
    process.exitCode = 64;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(e.message); process.exitCode = 1; });
}
