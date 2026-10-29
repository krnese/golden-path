import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { boundFile } from "./engineering-report.mjs";
import { repositorySchema } from "./engineering-schema.mjs";

const execute = promisify(execFile);
const options = root => ({ cwd: root, encoding: "utf8", timeout: 8000, maxBuffer: 1024 * 1024, windowsHide: true });
const fact = (name, status, detail, source, url) => ({ name, status, detail, source, ...(url ? { url } : {}) });
const workflowList = z.object({ workflows: z.array(z.object({ name: z.string(), path: z.string(), state: z.string() })) });
const runList = z.object({ workflow_runs: z.array(z.object({
  id: z.number().int().positive(), name: z.string().nullable(), head_sha: z.string(),
  status: z.string(), conclusion: z.string().nullable(), updated_at: z.string(),
})) });
const issueList = z.object({
  total_count: z.number().int().nonnegative(), incomplete_results: z.boolean(),
  items: z.array(z.object({ number: z.number().int().positive(), title: z.string() })),
});
const pullList = z.array(z.object({ number: z.number().int().positive(), title: z.string(), draft: z.boolean() }));
const adoptionSchema = z.object({
  root: z.string(),
  checks: z.array(z.object({ id: z.string(), status: z.enum(["verified", "missing", "unverified"]), evidence: z.string(), next: z.string() })),
});

export async function inspectRepository(root, { github = false, run = execute } = {}) {
  const command = async (name, args) => (await run(name, args, options(root))).stdout;
  const paths = (await command("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z", "--",
    ".github/workflows", "package.json", "AGENTS.md", ".github/copilot-instructions.md",
    ".github/skills/golden-path/SKILL.md", ".github/CODEOWNERS", "CODEOWNERS", "docs/CODEOWNERS", ".golden-path/config.json",
  ])).split("\0").filter(Boolean);
  const local = [];
  function read(file) {
    const resolved = boundFile(root, file);
    if (fs.statSync(resolved).size > 256 * 1024) throw new Error(`${file} exceeds the 256 KiB repository overview limit.`);
    const text = fs.readFileSync(resolved, "utf8");
    if (text.includes("\0")) throw new Error(`${file} is binary.`);
    return text;
  }
  const workflows = [...new Set(paths.filter(file => /^\.github\/workflows\/[^/]+\.ya?ml$/.test(file)))].sort();
  local.push(fact("Workflow definitions", workflows.length ? "configured" : "missing",
    workflows.length ? `${workflows.length} workflow file(s). Presence is not execution or merge enforcement.` : "No non-ignored workflow definitions found. CI may exist elsewhere.", ".github/workflows"));
  for (const file of workflows.slice(0, 20)) {
    try {
      const actions = [...new Set([...read(file).matchAll(/^\s*(?:-\s*)?uses:\s*["']?([^"'\s#]+)/gm)].map(match => match[1]))];
      local.push(fact(file, "configured", `Action references found in text (up to 40): ${actions.slice(0, 40).join(", ") || "none"}. This is not YAML validation, execution or a security audit.`, file));
    } catch (error) {
      local.push(fact(file, "unknown", error.message, file));
    }
  }
  if (workflows.length > 20) local.push(fact("Additional workflows", "unknown", "Overview limited to the first 20 workflow files.", ".github/workflows"));
  if (paths.includes("package.json")) {
    try {
      const manifest = z.object({ scripts: z.record(z.string(), z.string()).optional() }).parse(JSON.parse(read("package.json")));
      const scripts = Object.entries(manifest.scripts || {});
      local.push(fact("Project commands", scripts.length ? "configured" : "missing",
        scripts.length ? scripts.map(([name, value]) => `${name}: ${value}`).join("\n").slice(0, 8000) : "No package scripts declared. Other build systems may be used.", "package.json"));
    } catch (error) {
      local.push(fact("Project commands", "unknown", error.message, "package.json"));
    }
  } else local.push(fact("Project commands", "unknown", "No root package.json. Inspect the project's own build documentation; no commands are inferred or executed.", "Repository files"));
  for (const [name, candidates] of [
    ["Engineering guidance", ["AGENTS.md", ".github/copilot-instructions.md", ".github/skills/golden-path/SKILL.md"]],
    ["Ownership declarations", [".github/CODEOWNERS", "CODEOWNERS", "docs/CODEOWNERS"]],
    ["Local acceptance configuration", [".golden-path/config.json"]],
  ]) {
    const found = candidates.filter(file => paths.includes(file));
    local.push(fact(name, found.length ? "configured" : "missing",
      found.length ? `${found.join(", ")}. A declaration is not verified approval or enforcement.` : "No matching declaration found in non-ignored repository files.", found.join(", ") || "Repository files"));
  }
  const remote = { repository: null, inspectedAt: null, facts: [] };
  if (!github) {
    remote.facts.push(fact("GitHub", "unknown", "Not fetched. Refresh GitHub explicitly to read live state using the server's existing GitHub CLI credentials. No sign-in or credential changes are performed.", "GitHub API"));
    return repositorySchema.parse({ inspectedAt: new Date().toISOString(), local, github: remote });
  }
  let slug;
  try {
    const origin = (await command("git", ["remote", "get-url", "origin"])).trim();
    const match = /^(?:https:\/\/github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?\/?$/.exec(origin);
    if (!match || [match[1], match[2]].some(value => value === "." || value === "..")) throw new Error("Origin is not a supported github.com repository URL. No GitHub request was made.");
    slug = `${match[1]}/${match[2]}`;
    remote.repository = slug;
  } catch (error) {
    remote.inspectedAt = new Date().toISOString();
    remote.facts.push(fact("GitHub repository", "unknown", error.message, "Git origin"));
    return repositorySchema.parse({ inspectedAt: new Date().toISOString(), local, github: remote });
  }
  const base = `repos/${slug}`;
  const website = `https://github.com/${slug}`;
  async function query(name, endpoint, schema, summarize) {
    try {
      const data = schema.parse(JSON.parse(await command("gh", ["api", "--hostname", "github.com", "--method", "GET", endpoint])));
      return summarize(data);
    } catch (error) {
      const detail = error.code === "ENOENT" ? "GitHub CLI is not installed." :
        error.killed ? "GitHub request timed out." :
          `GitHub data unavailable: ${(error.stderr || error.message).trim().slice(0, 400)}`;
      return [fact(name, "unknown", `${detail} Check authentication, permissions and connectivity. This is not a missing or empty result.`, `GitHub API: ${endpoint}`)];
    }
  }
  const head = (await command("git", ["rev-parse", "HEAD"])).trim();
  const branch = (await command("git", ["rev-parse", "--abbrev-ref", "HEAD"])).trim();
  async function controls() {
    try {
      for (const file of [".golden-path/config.json", ".github/CODEOWNERS", "CODEOWNERS", "docs/CODEOWNERS"]) {
        if (fs.existsSync(path.join(root, ...file.split("/")))) read(file);
      }
      let output;
      try {
        output = await run(process.execPath, [
          fileURLToPath(new URL("../../plugin/scripts/gate.mjs", import.meta.url)), "adoption", "--target", root, "--github", "--json",
        ], { ...options(root), timeout: 35000, env: { ...process.env, GH_REPO: slug, GH_HOST: "github.com" } });
      } catch (error) {
        if (error.code !== 2 || typeof error.stdout !== "string") throw error;
        // The existing diagnostic exits 2 for missing/unverified findings, with a complete JSON report.
        output = { stdout: error.stdout };
      }
      const report = adoptionSchema.parse(JSON.parse(output.stdout));
      if (path.relative(root, report.root) !== "") throw new Error("The control report belongs to another repository.");
      const labels = {
        "github-required-checks": "Required kit check", "github-owner-review": "Code Owner review",
        "github-stale-approvals": "Stale review dismissal", "github-bypass-policy": "Bypass policy",
      };
      const selected = report.checks.filter(item => Object.hasOwn(labels, item.id));
      if (selected.length !== 4 || new Set(selected.map(item => item.id)).size !== 4) throw new Error("The control report is incomplete.");
      return selected.map(item => fact(labels[item.id], item.status === "verified" ? "configured" : item.status === "missing" ? "missing" : "unknown",
        `${item.evidence}\n${item.next}`, "Existing Golden Path adoption diagnostic; default-branch snapshot", `${website}/settings/rules`));
    } catch (error) {
      return [fact("Default-branch controls", "unknown", `Existing adoption diagnostic unavailable: ${error.message}. No enforcement verdict is available.`, "Golden Path adoption diagnostic")];
    }
  }
  const groups = await Promise.all([
    query("Hosted workflows", `${base}/actions/workflows?per_page=6`, workflowList, data =>
      data.workflows.length ? data.workflows.slice(0, 5).map(item => fact(item.name, "configured", `${item.state}; ${item.path}. Showing up to five hosted workflows; not a passing-check verdict.`, "GitHub Actions", `${website}/actions`)) :
        [fact("Hosted workflows", "missing", "GitHub returned no hosted workflows.", "GitHub Actions", `${website}/actions`)]),
    query("Recent CI", `${base}/actions/runs?branch=${encodeURIComponent(branch)}&per_page=5`, runList, data =>
      data.workflow_runs.length ? data.workflow_runs.map(item => fact(item.name || "Workflow run",
        item.head_sha !== head ? "stale" : item.status !== "completed" ? "pending" : item.conclusion === "success" ? "verified" : ["failure", "timed_out", "action_required"].includes(item.conclusion) ? "failed" : "unknown",
        `${item.status} / ${item.conclusion || "no conclusion"}; HEAD ${item.head_sha.slice(0, 8)} (${item.head_sha === head ? "matches local HEAD" : "different revision"}); updated ${item.updated_at}. This does not verify uncommitted changes or prove every required check passed.`,
        `GitHub Actions branch: ${branch}`, `${website}/actions/runs/${item.id}`)) :
        [fact("Recent CI", "unknown", `No runs returned for ${branch}. This is not evidence that checks passed.`, "GitHub Actions", `${website}/actions`)]),
    query("Open issues", `search/issues?q=${encodeURIComponent(`repo:${slug} is:issue is:open`)}&per_page=5`, issueList, data => [
      fact("Open issues", data.incomplete_results ? "unknown" : "verified",
        `${data.total_count} open issue(s) reported by GitHub search; showing up to five. Search may lag recent updates.${data.incomplete_results ? " Results are incomplete." : ""}`, "GitHub issue search", `${website}/issues`),
      ...data.items.map(item => fact(`#${item.number}: ${item.title}`, "pending", "Open issue; priority and relevance need review.", "GitHub issue", `${website}/issues/${item.number}`)),
    ]),
    query("Open pull requests", `${base}/pulls?state=open&per_page=6`, pullList, data =>
      data.length ? data.slice(0, 5).map(item => fact(`#${item.number}: ${item.title}`, "pending", `${item.draft ? "Draft" : "Open"} PR; showing up to five. Reviews, required checks and mergeability are not verified by this list.`, "GitHub pull requests", `${website}/pull/${item.number}`)) :
        [fact("Open pull requests", "verified", "GitHub returned no open pull requests.", "GitHub pull requests", `${website}/pulls`)]),
    controls(),
  ]);
  remote.inspectedAt = new Date().toISOString();
  remote.facts = groups.flat();
  return repositorySchema.parse({ inspectedAt: new Date().toISOString(), local, github: remote });
}
