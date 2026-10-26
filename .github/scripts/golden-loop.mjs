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

// Code is not instruction: GitHub ignores closing keywords in code, and so do we.
export function stripCode(text) {
  return lines(text).replace(/^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, "").replace(/`[^`\n]*`/g, "");
}

const CLOSING = /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s*:?\s+(?:[\w.-]+\/[\w.-]+)?#(\d+)\b/gi;
export function closingReferences(text) {
  return [...new Set([...stripCode(text).matchAll(CLOSING)].map((m) => Number(m[1])))];
}

// Issues this PR works on: closing keywords plus explicit work references such as "Refs #38" or
// "Part of #38". A passing mention ("see #38") does not put the PR in scope.
const WORK = /\b(?:refs?|references|part of|implements|addresses)\s*:?\s+#(\d+)\b/gi;
export function workReferences(text) {
  const t = stripCode(text);
  return [...new Set([...t.matchAll(CLOSING), ...t.matchAll(WORK)].map((m) => Number(m[1])))];
}

// Evidence is a table with Expected and Actual columns that names every example ID.
export function evidenceCheck(prBody, ids) {
  const text = lines(prBody);
  const hasTable = text.split("\n").some((l) => /^\s*\|/.test(l) && /expected/i.test(l) && /actual/i.test(l));
  const missing = ids.filter((id) => !new RegExp(`\\b${id}\\b`).test(text));
  return { ok: hasTable && missing.length === 0, hasTable, missing };
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
  const who = owners.length ? owners.map((o) => `@${o}`).join(", ") : "The owner";
  return [
    `Reopened by the Golden Loop workflow: this issue was closed by ${by}, but ${reason}.`,
    "",
    `The owner decides when it is done. ${who}: please record \`Owner judgment: meets the need\`, ` +
      "`needs revision` or `cannot yet judge`, with reasons, then close the issue yourself.",
  ].join("\n");
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
  const judgment = latestJudgment(await comments(repo, issue), owners, asOf ?? last.createdAt);
  const decision = decideOnClose({ closer, judgment });
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
    closingIssuesReferences(first: 20) { nodes { number } } } } }`;

export async function prEvidence({ repo, pr, log = console.log }) {
  const [owner, name] = repo.split("/");
  const pull = await api(`/repos/${repo}/pulls/${pr}`);
  const body = pull.body ?? "";
  const linked = (await graphql(PR_LINKS_QUERY, { owner, name, number: pr })).repository.pullRequest
    .closingIssuesReferences.nodes.map((n) => n.number);
  const golden = [];
  for (const n of new Set([...workReferences(body), ...linked])) {
    const issue = await api(`/repos/${repo}/issues/${n}`).catch(() => null);
    if (issue && !issue.pull_request && issue.labels.some((l) => l.name === LABEL)) golden.push(issue);
  }
  const out = [`### Golden Loop evidence on PR #${pr}`, ""];
  let ok = true;
  if (!golden.length) out.push(`Not working on a \`${LABEL}\` issue; nothing to check.`);
  const closing = new Set([...closingReferences(body), ...linked]);
  for (const issue of golden) {
    const ids = exampleIds(issue.body);
    const r = evidenceCheck(body, ids);
    ok &&= r.ok;
    out.push(`**#${issue.number}** examples: ${ids.join(", ") || "(none listed)"}`);
    out.push(r.hasTable ? "- Expected/actual table: found" : "- Expected/actual table: **missing** (a table with Expected and Actual columns)");
    if (r.missing.length) out.push(`- Examples not covered in the description: **${r.missing.join(", ")}**`);
    if (closing.has(issue.number)) {
      out.push(`- Closing keyword for #${issue.number}: merging will close it before the owner's judgment ` +
        "unless they record one first. Prefer `Refs`.");
      log(`::warning::PR closes golden-loop issue #${issue.number} on merge; the owner should record a judgment first.`);
    }
  }
  out.push("", !golden.length ? "Result: **not applicable**."
    : ok ? "Result: **evidence present**."
      : "Result: **evidence missing**. Put expected versus actual for each example in the PR description.");
  const summary = out.join("\n") + "\n";
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  log(summary);
  if (!ok) log("::error::Golden Loop evidence missing from the PR description.");
  return { ok, issues: golden.map((i) => i.number) };
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
