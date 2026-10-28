import { App } from "@modelcontextprotocol/ext-apps";

const app = new App({ name: "Golden Path adoption", version: "0.1.0" });
const get = (id) => document.getElementById(id);
let current;

function failure(message) {
  get("error").textContent = message;
  get("error").hidden = false;
  get("connection").hidden = true;
  get("report").hidden = true;
  current = undefined;
}

function renderFindings() {
  if (!current) return;
  const query = get("search").value.trim().toLowerCase();
  const status = get("status").value;
  const checks = current.report.checks.filter((c) =>
    (status === "all" || c.status === status) &&
    `${c.id} ${c.evidence} ${c.next}`.toLowerCase().includes(query));
  get("findings").replaceChildren();
  for (const check of checks) {
    const article = document.createElement("article");
    const title = document.createElement("div");
    title.className = "finding-title";
    const badge = document.createElement("span");
    badge.className = `status ${check.status}`;
    badge.textContent = check.status;
    const heading = document.createElement("h2");
    heading.textContent = check.id.replaceAll("-", " ");
    title.append(badge, heading);
    const evidence = document.createElement("p");
    evidence.textContent = check.evidence;
    const next = document.createElement("p");
    next.className = "next";
    const label = document.createElement("strong");
    label.textContent = "Next: ";
    next.append(label, document.createTextNode(check.next));
    article.append(title, evidence, next);
    get("findings").append(article);
  }
  const totals = current.report.checks.reduce((all, c) => ({ ...all, [c.status]: all[c.status] + 1 }),
    { verified: 0, missing: 0, unverified: 0 });
  get("summary").textContent = `${checks.length} of ${current.report.checks.length} findings shown. ` +
    `${totals.verified} verified configuration; ${totals.missing} missing; ${totals.unverified} unverified.`;
}

function receive(result) {
  if (result.isError) {
    failure(result.content?.filter((c) => c.type === "text").map((c) => c.text).join("\n") || "Inspection failed.");
    return;
  }
  const data = result.structuredContent;
  const report = data?.report;
  if (!report || typeof report.root !== "string" || !(report.head === null || typeof report.head === "string") ||
    typeof data.inspectedAt !== "string" || !Array.isArray(report.checks) ||
    !report.checks.every((c) => c && ["verified", "missing", "unverified"].includes(c.status) &&
      ["id", "evidence", "next"].every((key) => typeof c[key] === "string" && c[key]))) {
    failure("The host returned invalid inspection evidence. No adoption verdict is available.");
    return;
  }
  current = data;
  get("root").textContent = report.root;
  get("head").textContent = report.head || "Unverified: no committed revision";
  get("observed").textContent = `Inspected ${data.inspectedAt}. This is a snapshot; refresh after changes.`;
  get("raw").textContent = JSON.stringify(data, null, 2);
  get("error").hidden = true;
  get("connection").hidden = true;
  get("report").hidden = false;
  renderFindings();
}

app.ontoolresult = receive;
app.ontoolcancelled = ({ reason }) => failure(`Inspection cancelled: ${reason || "no result available"}`);
app.onhostcontextchanged = ({ theme }) => {
  if (theme === "light" || theme === "dark") document.documentElement.style.colorScheme = theme;
};
get("search").addEventListener("input", renderFindings);
get("status").addEventListener("change", renderFindings);
get("refresh").addEventListener("click", async () => {
  get("refresh").disabled = true;
  get("refresh").textContent = "Inspecting...";
  try {
    receive(await app.callServerTool({ name: "inspect_golden_path_adoption", arguments: {} }));
  } catch (error) {
    failure(`Inspection failed: ${error.message}`);
  } finally {
    get("refresh").disabled = false;
    get("refresh").textContent = "Refresh inspection";
  }
});
try {
  await app.connect();
  const context = app.getHostContext();
  if (context) app.onhostcontextchanged(context);
} catch (error) {
  failure(`Could not connect to the MCP Apps host: ${error.message}`);
}
