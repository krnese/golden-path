import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { siteRoot, repositoryRoot } from "./build.mjs";
import { verify } from "./check-site.mjs";

const { canonical } = verify();
const output = path.join(siteRoot, "dist");
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "golden-path-pages-"));
const git = (args, cwd = temporary) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
try {
  const sourceSha = git(["rev-parse", "HEAD"], repositoryRoot);
  git(["init", "--initial-branch=gh-pages"]);
  git(["config", "core.autocrlf", "false"]);
  fs.writeFileSync(path.join(temporary, ".git", "info", "attributes"), "* -text\n");
  git(["remote", "add", "origin", "https://github.com/krnese/golden-path.git"]);
  if (git(["ls-remote", "--heads", "origin", "refs/heads/gh-pages"])) {
    git(["fetch", "--depth=1", "origin", "gh-pages"]);
    git(["checkout", "-B", "gh-pages", "FETCH_HEAD"]);
    for (const name of git(["ls-files", "-z"]).split("\0").filter(Boolean)) {
      const filename = path.resolve(temporary, name);
      if (!filename.startsWith(temporary + path.sep)) throw new Error(`Unsafe published path: ${name}`);
      fs.rmSync(filename, { force: true });
    }
  }
  for (const name of fs.readdirSync(output)) fs.cpSync(path.join(output, name), path.join(temporary, name), { recursive: true });
  git(["config", "user.name", git(["config", "user.name"], repositoryRoot)]);
  git(["config", "user.email", git(["config", "user.email"], repositoryRoot)]);
  git(["add", "--all"]);
  if (git(["status", "--porcelain"])) {
    git(["commit", "-m", `Site: publish one-page landing page from ${sourceSha}\n\nCo-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`]);
    git(["push", "origin", "gh-pages"]);
  }
  console.log(`Published commit ${git(["rev-parse", "HEAD"])}. Wait for Pages deployment and verify ${canonical}`);
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
