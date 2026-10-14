// Writes a short markdown summary of the kit test areas to $GITHUB_STEP_SUMMARY.
// Input: a TAP file from `node --test --test-reporter=tap`. Built-ins only; works on Ubuntu and Windows.
import fs from "node:fs";

const [tapFile, title = "Kit guarantees"] = process.argv.slice(2);
const tap = fs.existsSync(tapFile) ? fs.readFileSync(tapFile, "utf8").replace(/\r\n/g, "\n") : "";
// Top-level suites (the areas) are the unindented "ok N - name" / "not ok N - name" lines.
const areas = [...tap.matchAll(/^(not ok|ok) \d+ - (.+?)(?: # (SKIP.*))?$/gm)].map((m) => ({ ok: m[1] === "ok", name: m[2], skip: m[3] }));
const count = (k) => (tap.match(new RegExp(`^# ${k} (\\d+)$`, "m")) || [])[1] ?? "?";
const lines = [`### ${title}`, "", `${count("pass")} passed, ${count("fail")} failed, ${count("skipped")} skipped (of ${count("tests")} tests)`, "",
  "| Area | Result |", "| --- | --- |",
  ...areas.map((a) => `| ${a.name.replace(/\|/g, "\\|")} | ${a.skip ? "⏭️ skipped" : a.ok ? "✅ passed" : "❌ failed"} |`)];
if (!areas.length) lines.push("| (no test results found) | ❌ |");
const out = lines.join("\n") + "\n";
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, out);
process.stdout.write(out);
