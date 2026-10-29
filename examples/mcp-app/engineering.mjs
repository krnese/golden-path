import { App } from "@modelcontextprotocol/ext-apps";
import { inspectionSchema } from "./engineering-schema.mjs";
import { proposalText, plainEvidence } from "./guided-content.mjs";

const app = new App({ name: "Golden Path engineering inspection", version: "0.1.0" });
const get = (id) => document.getElementById(id);
let current;
let busy = false;
let connected = false;
let requestNumber = 0;
let changeLimit = 4;
let activePanel = "contract";
let exploredFirstRun = false;
let questionIndex = 0;
let sending = false;
let draftEdited = false;
let pendingBrief;
let briefKey;
let briefScope;
const sentMessages = new Set();
const briefFields = { outcome: "goal", behavior: "expected", exception: "exception", failure: "failure", boundary: "boundary" };
const questions = ["exception", "expected", "failure", "boundary"];
const exampleResponses = {
  review: "Flag it for a person to review. Show a clear explanation and let a human decide.",
  block: "Stop the action until an authorized person decides whether it may continue.",
  warn: "Show a warning explaining the risk and let the person decide whether to continue.",
};
const consequences = {
  exception: "A person reviewing a problem needs to know what was flagged and why. These are suggested responses, not decisions made for you.",
  expected: "A clear, observable result gives you and the developer the same understanding of success. Avoid deciding how to build it yet.",
  failure: "Explain what happens when the software cannot complete the work. A visible failure is safer than a misleading success.",
  boundary: "Limits protect what matters. A change to permissions, accepted behavior or human responsibility needs the accountable owner's decision.",
};
const tabs = [...document.querySelectorAll("[role=tab]")];
const guidedLabels = ["Outcome", "Examples", "Results", "What changed", "Why this exists", "Decision needed", "Continue"];
const engineeringLabels = tabs.map((tab) => tab.textContent);
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function controls() {
  get("refresh").disabled = !connected || busy;
  get("session").disabled = busy;
  for (const button of document.querySelectorAll("[data-artifact]")) button.disabled = busy || !connected;
  get("send-examples").hidden = !connected || !app.getHostCapabilities()?.message?.text;
  get("send-welcome").hidden = !connected || !app.getHostCapabilities()?.message?.text;
  get("refresh-welcome").disabled = !connected || busy;
  for (const id of ["refresh-returning", "refresh-github"]) get(id).disabled = !connected || busy;
  for (const [id, text] of [["send-examples", "proposal-text"], ["send-welcome", "welcome-prompt"]]) {
    get(id).disabled = !connected || busy || sending || sentMessages.has(get(text).value);
  }
}
function firstRunPresentation() {
  const firstRun = !!current && !current.session && current.sessions.length === 0 && !Object.keys(current.brief || {}).length;
  get("first-run").hidden = !firstRun || exploredFirstRun;
  get("workspace").hidden = !current || (firstRun && !exploredFirstRun);
  get("back-welcome").hidden = !firstRun || !exploredFirstRun;
  if (firstRun) {
    get("welcome-project").textContent = `Repository: ${current.root.split(/[\\/]/).filter(Boolean).at(-1)}`;
  }
}
function presentation() {
  const guided = get("presentation").value === "guided";
  document.body.dataset.presentation = guided ? "guided" : "engineering";
  tabs.forEach((tab, i) => { tab.textContent = (guided ? guidedLabels : engineeringLabels)[i]; });
  get("session-details").open = !guided;
  get("mode-guided").setAttribute("aria-pressed", String(guided));
  get("mode-engineering").setAttribute("aria-pressed", String(!guided));
  (guided ? get("guided-contract-placeholder") : get("contract")).append(get("contract-content"));
  updateJourney();
}
function updateProposalSummary() {
  const goal = get("goal").value;
  get("summary-goal").textContent = goal.trim() || "Describe the outcome you want.";
  get("goal-count").textContent = `${goal.length}/2000 · Unshared proposal`;
  for (const id of ["exception", "failure", "boundary"]) {
    const text = get(id).value.trim();
    get(`summary-${id}`).textContent = text ? text.slice(0, 130) + (text.length > 130 ? "..." : "") : "Not decided yet";
    get(`decision-${id}`).dataset.answered = String(!!text);
  }
  for (const [id, response] of Object.entries(exampleResponses)) get(`choice-${id}`).checked = get("exception").value === response;
}
function updateJourney() {
  const stage = activePanel === "contract" ? 1 : activePanel === "acceptance" ? 2 :
    ["changes", "evidence"].includes(activePanel) ? 3 : 4;
  for (let i = 1; i <= 4; i++) get(`stage-${i}`).setAttribute("aria-current", stage === i ? "step" : "false");
  get("review-position").textContent = `${stage} of 4 stages`;
  get("journey-back").disabled = stage === 1 && questionIndex === 0;
  get("journey-next").disabled = stage === 4;
  get("journey-next").hidden = stage === 2;
  get("journey-next").textContent = stage === 1 ? "Next →" : stage === 2 ? "Inspect changes →" : stage === 3 ? "Review result →" : "Review position only";
  get("question-position").textContent = `${questionIndex + 1} of ${questions.length}`;
  for (const id of questions) get(`question-${id}`).hidden = id !== questions[questionIndex];
  get("question-consequence").textContent = consequences[questions[questionIndex]];
}
function error(message) {
  get("error").textContent = message;
  get("error").hidden = false;
}
function showTab(id, focus = false) {
  activePanel = id;
  for (const tab of tabs) {
    const selected = tab.getAttribute("aria-controls") === id;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    get(tab.getAttribute("aria-controls")).hidden = !selected;
    if (selected && focus) (get("presentation").value === "guided" ? get(id) : tab).focus();
  }
  updateJourney();
}
for (const tab of tabs) {
  tab.addEventListener("click", () => showTab(tab.getAttribute("aria-controls")));
  tab.addEventListener("keydown", (event) => {
    let at = tabs.indexOf(tab);
    if (event.key === "ArrowRight") at = (at + 1) % tabs.length;
    else if (event.key === "ArrowLeft") at = (at + tabs.length - 1) % tabs.length;
    else if (event.key === "Home") at = 0;
    else if (event.key === "End") at = tabs.length - 1;
    else return;
    event.preventDefault();
    showTab(tabs[at].getAttribute("aria-controls"), true);
  });
}
function sourceButton(file, view = "source") {
  const button = element("button", view === "diff" ? "Inspect diff" : "Inspect source");
  button.type = "button";
  button.dataset.artifact = file;
  button.addEventListener("click", () => load({ file, view }));
  return button;
}
function whyButton(file) {
  const button = element("button", "Why does this exist?");
  button.type = "button";
  button.addEventListener("click", () => {
    get("why-file").value = file;
    renderRelationships();
    showTab("why", true);
  });
  return button;
}
function renderRelationships() {
  if (!current) return;
  const file = get("why-file").value;
  const list = get("relationships");
  list.replaceChildren();
  const links = current.relationships.filter((x) => x.from === file || x.to === file);
  for (const link of links.slice(0, 10)) {
    const card = element("article");
    card.append(element("span", link.confidence, `badge ${link.confidence === "verified" ? "passed" : "unverified"}`),
      element("p", `${link.from} → ${link.to || "No linked artifact"}`), element("p", link.reason));
    const other = link.from === file ? link.to : link.from;
    if (other && current.files.includes(other)) {
      const actions = element("div", undefined, "actions");
      actions.append(sourceButton(other), whyButton(other));
      card.append(actions);
    }
    list.append(card);
  }
  if (links.length > 10) {
    const details = element("details");
    const summary = element("summary", `${links.length - 10} further source relationships`);
    details.append(summary);
    for (const link of links.slice(10)) details.append(element("p", `${link.confidence.toUpperCase()}: ${link.from} → ${link.to || "unavailable"} — ${link.reason}`));
    list.append(details);
  }
  if (!list.childElementCount) list.append(element("p", "Unavailable: no source-backed relationship recorded. Do not invent a rationale.", "notice"));
}
function renderChanges() {
  if (!current) return;
  const term = get("change-search").value.toLowerCase();
  const items = current.changes.filter((x) => x.path.toLowerCase().includes(term));
  get("change-files").replaceChildren(element("p", `${items.length} matching changes · showing up to ${changeLimit}`, "muted"));
  for (const file of items.slice(0, changeLimit)) {
    const row = element("article");
    row.append(element("h3", file.path), element("p", `${file.status} · ${file.kind}`, "muted"),
      element("p", file.kind === "acceptance" ? "Verified configured-path membership; not approval to edit." : "Acceptance coverage: unverified.", "muted"));
    const actions = element("div", undefined, "actions");
    actions.append(sourceButton(file.path, "diff"));
    if (file.status !== "deleted") actions.append(sourceButton(file.path));
    actions.append(whyButton(file.path));
    row.append(actions);
    get("change-files").append(row);
  }
  get("more-changes").hidden = items.length <= changeLimit;
  if (!items.length) get("change-files").append(element("p", "No matching changes displayed. Check baseline findings before concluding there are none.", "muted"));
  controls();
}
function findingCard(check, stale = false) {
  const card = element("details", undefined, "box");
  const title = element("summary");
  const label = stale ? `Recorded ${check.status} · not current` : check.status;
  title.append(element("span", label, `badge ${stale ? "" : check.status}`), document.createTextNode(` ${check.name}`));
  card.append(title, element("pre", check.output || "No output was retained."));
  return card;
}
function renderAcceptance() {
  if (!current) return;
  const term = get("acceptance-search").value.toLowerCase();
  const list = get("acceptance-files");
  list.replaceChildren();
  const items = current.acceptance.filter((x) => `${x.path} ${x.ids.join(" ")}`.toLowerCase().includes(term));
  for (const file of items) {
    const row = element("article");
    row.append(element("h3", file.path), element("p", "Execution per example: unverified", "muted"),
      element("p", `Last path commit: ${file.provenance}`, "muted"));
    if (file.ids.length) row.append(element("p", `IDs found in source text: ${file.ids.join(", ")}. This is not a verified test-to-example mapping.`));
    const actions = element("div", undefined, "actions");
    actions.append(sourceButton(file.path), whyButton(file.path));
    row.append(actions);
    list.append(row);
  }
  if (!items.length) list.append(element("p", term ? "No matching artifacts." : "No acceptance artifacts available. Inspect configuration and agree the authoritative examples with the owner.", "notice"));
}
function renderCompanion() {
  const report = current;
  const scope = `${report.root}\n${report.session?.id || ""}`;
  if (briefScope && briefScope !== scope) {
    pendingBrief = undefined;
    briefKey = undefined;
    get("suggested-brief").hidden = true;
  }
  briefScope = scope;
  get("returning").hidden = !report.session && !report.sessions.length;
  get("return-context").textContent = report.session ?
    `${report.session.task || report.session.id} · HEAD ${report.head.slice(0, 8)} · inspected ${new Date(report.inspectedAt).toLocaleString()}` :
    `${report.sessions.length} recorded session(s). Select the change you want to inspect; no newest-session assumption is made.`;
  get("return-changes").textContent = report.session?.base ?
    `${report.changes.length} changed file(s) against ${report.session.base.slice(0, 8)}. Changes are not proof of completed behavior.` :
    "No selected, recorded baseline. A missing comparison is not proof nothing changed.";
  get("return-verified").textContent = plainEvidence(report);
  const signals = report.agreementDelta.filter(item => item.classification === "agreement-source").length;
  get("return-decisions").textContent = `${signals} agreement/control change signal(s); ${report.findings.filter(item => item.status !== "passed").length} evidence/review gaps. Human judgment is still required; signals do not establish material impact.`;
  get("return-next").textContent = !report.session ? "Choose the recorded work to review." :
    signals ? "Inspect the changed agreement sources before deciding whether affected work can continue." :
      report.evidence.freshness !== "current" ? "Inspect missing or stale evidence before making a progress claim." :
        "Review the original results and remaining gaps. Current checks are not owner approval.";
  get("return-action").textContent = !report.session ? "Choose recorded work" : signals ? "Review agreement changes" : "Inspect evidence";
  get("session-details").open = !report.session || get("presentation").value === "engineering";
  get("repository-pulse").hidden = !report.repository;
  if (report.repository) {
    const repository = report.repository;
    get("pulse-summary").textContent = repository.local.find(item => item.name === "Workflow definitions")?.detail.split(".")[0] || "";
    get("pulse-status").textContent = `Local inspection ${new Date(repository.inspectedAt).toLocaleString()}. ${repository.github.inspectedAt ?
      `GitHub ${repository.github.repository || "unavailable"} inspected ${new Date(repository.github.inspectedAt).toLocaleString()}. Remote facts are a snapshot, not continuous monitoring.` :
      "GitHub has not been fetched for this snapshot. Refresh GitHub uses the server's existing CLI credentials; it does not sign in or change settings."}`;
    for (const [id, facts] of [["repository-local", repository.local], ["repository-github", repository.github.facts]]) {
      get(id).replaceChildren(...facts.map(item => {
        const card = element("article");
        card.append(element("span", item.status, `badge ${item.status === "verified" ? "passed" : item.status === "failed" ? "failed" : "unverified"}`),
          element("h3", item.name), element("p", item.detail),
          element("p", item.source, "fact-source"));
        if (item.url && app.getHostCapabilities()?.openLinks) {
          const button = element("button", "Open GitHub source");
          button.type = "button";
          button.addEventListener("click", async () => {
            try {
              const result = await app.openLink({ url: item.url });
              if (result.isError) throw new Error("The host declined the source link.");
            } catch (failure) { get("pulse-status").textContent = `Could not open source: ${failure.message}. ${item.url}`; }
          });
          card.append(button);
        } else if (item.url) card.append(element("p", item.url, "fact-source"));
        return card;
      }));
    }
  }
  if (report.brief && Object.keys(report.brief).length && JSON.stringify(report.brief) !== briefKey) {
    briefKey = JSON.stringify(report.brief);
    pendingBrief = report.brief;
    get("suggested-text").textContent = Object.entries(pendingBrief).map(([field, value]) => `${field}: ${value}`).join("\n\n");
    get("suggested-brief").hidden = false;
    get("brief-status").textContent = draftEdited ? "Your local answers are unchanged. Use this draft only if you want to replace the supplied fields." :
      "Review this proposed starting point, then choose Use this draft. Unspecified fields remain yours to answer.";
  }
}
function render() {
  const report = current;
  get("session").replaceChildren(new Option("Choose a recorded session", ""));
  for (const session of report.sessions) {
    const when = session.started ? new Date(session.started * 1000).toLocaleString() : "No start time";
    get("session").append(new Option(`${session.task || session.id} · ${when}`, session.id));
  }
  if (report.session && !report.sessions.some((x) => x.id === report.session.id)) {
    get("session").append(new Option(report.session.id, report.session.id));
  }
  get("session").value = report.session?.id || "";
  get("snapshot").textContent = `HEAD ${report.head.slice(0, 8)} · Base ${report.session?.base?.slice(0, 8) || "unavailable"} · Inspected ${new Date(report.inspectedAt).toLocaleTimeString()}`;
  const gaps = report.findings.filter((x) => x.status !== "passed").length;
  get("status").textContent = report.session ? `${gaps} evidence/review gaps · not approval.` :
    report.sessions.length ? "Choose the recorded session you want to inspect. This is not a list of chat transcripts." :
    "Connected. Begin in chat; refresh after real work is recorded.";
  firstRunPresentation();
  renderCompanion();
  const contract = get("contract-content");
  contract.replaceChildren(element("h2", "What was authorized?"));
  if (report.contract) {
    contract.append(element("p", `Recorded task source: ${report.contract}. Source content is not proof of approval.`),
      element("p", "Source excerpt (up to 3,000 characters); inspect the full source for context, boundaries and unresolved assumptions.", "muted"),
      element("pre", report.contractText, "excerpt"), sourceButton(report.contract), whyButton(report.contract));
  } else contract.append(element("p", "No intent/context document is linked to this session. Ask the owner for the authoritative request; do not infer authorization from the code.", "notice"));
  contract.append(element("h2", "Who owns acceptance?"),
    element("p", report.config.owner === "Not recorded" ? "Owner not recorded; approval unavailable." :
      `${report.config.owner} (configured name; approval unverified).`));
  const acceptanceLink = element("button", `Explore acceptance (${report.acceptance.length} artifacts)`);
  acceptanceLink.type = "button";
  acceptanceLink.addEventListener("click", () => showTab("acceptance", true));
  contract.append(acceptanceLink, element("h2", "Implementation boundary"),
    element("p", "The agent may continue only already-authorized work. Owner-approved acceptance is read-only. Editing, merging and deployment are separate permissions."),
    element("p", `Acceptance paths: ${report.config.acceptancePaths.join(", ") || "not configured"}`, "muted"),
    element("p", `Protected developer tests: ${report.config.protected.join(", ") || "not configured"}`, "muted"),
    ...(report.files.includes(".golden-path/config.json") ? [sourceButton(".golden-path/config.json")] :
      [element("p", "No gate configuration installed. Inspection does not add checks or acceptance.", "notice")]),
    element("h2", "Unresolved assumptions and delegation"),
    element("p", "No semantic delegation or assumption verdict is available. Inspect the request and changes; the existing gate cannot decide whether a changed outcome or tradeoff is acceptable.", "muted"));
  renderAcceptance();
  const evidence = report.evidence;
  get("freshness").textContent = `${evidence.outcome} · ${evidence.freshness === "current" ? "Matches the inspected local snapshot" : evidence.freshness === "stale" ? "Historical / stale — not evidence for the current work" : "Per-check evidence unavailable"}. ${evidence.recordedAt ? `Recorded ${evidence.recordedAt}.` : ""}`;
  get("checks").replaceChildren(...evidence.checks.map((x) => {
    const card = findingCard(x, evidence.freshness === "stale");
    card.id = `check-${x.name}`;
    return card;
  }));
  if (evidence.source) get("checks").append(sourceButton(evidence.source));
  get("findings").replaceChildren(...report.findings.map((x) => findingCard(x)));
  get("events").replaceChildren(...report.events.map((x) => findingCard({
    name: `${x.at} / ${x.event}`, status: "unverified", output: `${x.detail}\nHistorical event only; no test output is reconstructed.`,
  })));
  if (!report.events.length) get("events").append(element("p", "No readable events for this session.", "muted"));
  renderChanges();
  const previousFile = get("why-file").value;
  get("why-file").replaceChildren(...report.files.map((file) => new Option(file, file)));
  if (report.files.includes(previousFile)) get("why-file").value = previousFile;
  renderRelationships();
  get("agreement-delta").replaceChildren();
  const implementation = element("details");
  implementation.append(element("summary", `${report.agreementDelta.filter((x) => x.classification === "implementation-candidate").length} ordinary implementation candidates (meaning unverified)`));
  for (const delta of report.agreementDelta) {
    const card = element("details", undefined, "box");
    card.append(element("summary", `${delta.classification === "agreement-source" ? "Review agreement source" : "Implementation candidate"}: ${delta.path}`),
      element("p", delta.basis), element("p", delta.decision), sourceButton(delta.path, "diff"), whyButton(delta.path));
    if (delta.classification === "agreement-source") get("agreement-delta").append(card);
    else implementation.append(card);
  }
  if (implementation.childElementCount > 1) get("agreement-delta").append(implementation);
  if (!report.agreementDelta.length) get("agreement-delta").append(element("p", "No change signals displayed. An absent baseline or missing semantic evidence is not proof the agreement is unchanged.", "muted"));
  get("handoff-text").value = report.handoff;
  get("summary-gaps").textContent = `${gaps} review gaps`;
  const counts = { passed: 0, failed: 0, skipped: 0, unknown: 0 };
  for (const check of report.evidence.checks) {
    if (check.status === "failed") counts.failed++;
    if (check.status === "skipped") counts.skipped++;
    if (report.evidence.freshness !== "current" || ["unverified", "unavailable"].includes(check.status)) counts.unknown++;
    if (report.evidence.freshness === "current" && check.status === "passed") counts.passed++;
  }
  get("summary-evidence").replaceChildren();
  for (const [label, count] of [
    ["Current passed checks", counts.passed], ["Recorded failed checks", counts.failed],
    ["Recorded skipped checks", counts.skipped], ["Need current verification", counts.unknown],
  ]) {
    const row = element("div", undefined, "evidence-count");
    row.append(element("span", label), element("span", String(count)));
    get("summary-evidence").append(row);
  }
  get("summary-evidence").append(element("p", plainEvidence(report), "quiet"));
  const state = get("guided-state");
  state.replaceChildren(element("h2", "What can we honestly say?"));
  const table = element("table");
  const header = element("tr");
  for (const title of ["Stage", "What is known"]) {
    const th = element("th", title);
    th.scope = "col";
    header.append(th);
  }
  table.append(header);
  for (const [stage, meaning] of [
    ["Proposed", "Your answers above are a proposal until shared and reviewed. They are not approved acceptance."],
    ["Approved", "Owner approval of the executable acceptance has not been verified by this local inspection."],
    ["Implemented", `${report.changes.length} changed files are visible. File changes alone do not prove the requested behavior was built.`],
    ["Verified", plainEvidence(report)],
  ]) {
    const row = element("tr");
    row.append(element("td", stage), element("td", meaning));
    table.append(row);
  }
  state.append(table);
  const signals = report.agreementDelta.filter((x) => x.classification === "agreement-source").length;
  state.append(element("p", signals ?
    `${signals} agreement/control source change(s) need accountable review. Use “Review agreement changes” to inspect them. Ordinary code can also change the agreement; this is not a semantic detector.` :
    "If the outcome, limits, permissions or accepted examples need to change, pause that part and ask the owner. No detected signal is not proof no decision is needed.", "notice"));
  get("capture-command").textContent = report.session ?
    `node examples\\mcp-app\\capture-evidence.mjs --target "${report.root}" --session ${report.session.id}` :
    "Select a session first. See the prototype README for the capture script location.";
  controls();
  updateProposalSummary();
}
function receive(result) {
  if (result.isError) {
    error(result.content?.filter((x) => x.type === "text").map((x) => x.text).join("\n") || "Inspection failed.");
    get("status").textContent = "Refresh failed. Any displayed snapshot is unchanged and may be stale.";
    return;
  }
  const parsed = inspectionSchema.safeParse(result.structuredContent?.inspection);
  if (!parsed.success) { error("The server returned an invalid inspection. The previous snapshot is unchanged."); return; }
  current = parsed.data;
  if (!current.artifact && get("artifact-dialog").open) get("artifact-dialog").close();
  get("error").hidden = true;
  try { render(); }
  catch (failure) {
    error(`Could not display the complete inspection: ${failure.message}. Refresh before relying on this partial view.`);
    get("status").textContent = "Incomplete inspection display; do not treat it as a complete report.";
    return;
  }
  if (current.artifact) {
    const artifact = current.artifact;
    get("artifact-title").textContent = `${artifact.view === "diff" ? "Diff" : "Source"}: ${artifact.path}`;
    get("artifact-note").textContent = `${artifact.truncated ? "Truncated at 64,000 characters. " : ""}Snapshot ${current.head.slice(0, 8)}; viewer line numbers below are not coverage evidence.`;
    get("artifact-text").textContent = artifact.text.split("\n").map((line, i) => `${i + 1}  ${line}`).join("\n");
    get("open-editor").hidden = !app.getHostCapabilities()?.openLinks;
    get("editor-note").textContent = `${current.root}\\${artifact.path.split("/").join("\\")}. ${app.getHostCapabilities()?.openLinks ? "Editor opening depends on host support for vscode: links; the source remains available here." : "This host does not advertise link opening. Inspect the source here or open this path in VS Code."}`;
    if (!get("artifact-dialog").open) get("artifact-dialog").showModal();
    get("artifact-title").focus();
  }
}
async function load(extra = {}) {
  if (!connected || busy) return;
  const request = ++requestNumber;
  busy = true;
  controls();
  get("status").textContent = "Reading repository artifacts; no checks are being run...";
  try {
    const sessionId = get("session").value;
    const result = await app.callServerTool({ name: "inspect_engineering_session", arguments: { ...(sessionId ? { sessionId } : {}), ...extra } });
    if (request === requestNumber) receive(result);
  } catch (failure) {
    error(`Inspection failed: ${failure.message}. The previous snapshot is unchanged.`);
  } finally { busy = false; controls(); }
}
app.ontoolresult = (result) => {
  if (busy) {
    error("Conversation results arrived during inspection. Refresh to read the current source; the in-flight response has not been replaced.");
    return;
  }
  receive(result);
};
app.onhostcontextchanged = ({ theme }) => {
  if (theme === "light" || theme === "dark") document.documentElement.style.colorScheme = theme;
};
get("session").addEventListener("change", () => load());
get("why-file").addEventListener("change", renderRelationships);
get("refresh").addEventListener("click", () => load());
get("refresh-welcome").addEventListener("click", () => load());
get("refresh-returning").addEventListener("click", () => load());
get("refresh-github").addEventListener("click", () => load({ github: true }));
get("return-action").addEventListener("click", () => {
  if (!current.session) { get("session-details").open = true; get("session").focus(); }
  else showTab(current.agreementDelta.some(item => item.classification === "agreement-source") ? "delta" : "evidence", true);
});
get("apply-brief").addEventListener("click", () => {
  if (!pendingBrief) return;
  for (const [field, value] of Object.entries(pendingBrief)) get(briefFields[field]).value = value;
  proposalChanged();
  get("brief-status").textContent = "Proposed draft applied to the supplied fields. Review and correct it; nothing is approved or sent.";
  get("goal").focus();
});
get("select-welcome").addEventListener("click", () => {
  get("welcome-prompt").focus();
  get("welcome-prompt").select();
  get("welcome-status").textContent = "Message selected. Copy it into the existing chat and describe your outcome there. It has not been sent.";
});
async function continueInChat(textId, statusId) {
  const text = get(textId).value;
  if (sending || sentMessages.has(text)) return;
  if (textId === "welcome-prompt" && Object.values(briefFields).some(id => get(id).value.trim())) {
    get(statusId).textContent = "You have unshared Guided answers. Return to Guided, review your brief and continue from there so those answers are included. Nothing was sent or closed.";
    return;
  }
  if (!text.trim()) { get(statusId).textContent = "Prepare a non-empty message before continuing. Nothing was sent."; return; }
  sending = true;
  controls();
  try {
    const result = await app.sendMessage({ role: "user", content: [{ type: "text", text }] });
    if (result.isError) throw new Error("The host declined the message.");
    sentMessages.add(text);
  } catch (failure) {
    get(statusId).textContent = `Could not share in chat: ${failure.message}. Your message is retained; select and copy it instead. The App has not requested closure.`;
    sending = false;
    controls();
    return;
  }
  get(statusId).textContent = "Message accepted in the existing chat. Requesting App closure; no repository records or approvals were created. Reopen Golden Path later to inspect recorded work.";
  try {
    await app.requestTeardown();
    get(statusId).textContent = "Message accepted; closure requested. The host decides whether to close this view. If it stays open, you can close it manually without resending.";
  } catch (failure) {
    get(statusId).textContent = `Message accepted, but closure could not be requested: ${failure.message}. Close this view manually; do not resend the message.`;
  } finally { sending = false; controls(); }
}
get("send-welcome").addEventListener("click", () => continueInChat("welcome-prompt", "welcome-status"));
function exploreFirstRun(mode) {
  exploredFirstRun = true;
  get("presentation").value = mode;
  presentation();
  firstRunPresentation();
  showTab("contract");
  get(mode === "guided" ? "goal" : "contract").focus();
}
get("explore-welcome").addEventListener("click", () => exploreFirstRun("guided"));
get("details-welcome").addEventListener("click", () => exploreFirstRun("engineering"));
get("back-welcome").addEventListener("click", () => {
  exploredFirstRun = false;
  firstRunPresentation();
  get("welcome-title").focus();
});
get("acceptance-search").addEventListener("input", renderAcceptance);
get("change-search").addEventListener("input", () => { changeLimit = 4; renderChanges(); });
get("more-changes").addEventListener("click", () => { changeLimit += 4; renderChanges(); });
get("acceptance-evidence").addEventListener("click", () => {
  showTab("evidence", true);
  const check = get("check-acceptance");
  if (check) check.open = true;
});
get("select-handoff").addEventListener("click", () => { get("handoff-text").focus(); get("handoff-text").select(); });
get("presentation").addEventListener("change", presentation);
for (const mode of ["guided", "engineering"]) get(`mode-${mode}`).addEventListener("click", () => {
  get("presentation").value = mode;
  presentation();
});
for (const [index, panel] of ["contract", "acceptance", "changes", "handoff"].entries()) {
  get(`stage-${index + 1}`).addEventListener("click", () => showTab(panel));
}
get("journey-next").addEventListener("click", () => {
  if (activePanel === "contract") {
    const id = !get("goal").value.trim() ? "goal" : questions[questionIndex];
    if (!get(id).value.trim()) {
      get("question-error").textContent = "Describe what you expect, or say what is still unknown. No answer will be invented for you.";
      get("question-error").hidden = false;
      if (id === "exception") get("exception-custom").open = true;
      get(id).focus();
      return;
    }
    get("question-error").hidden = true;
    if (questionIndex < questions.length - 1) { questionIndex++; updateJourney(); get(questions[questionIndex]).focus(); }
    else showTab("acceptance");
  } else if (activePanel === "acceptance") showTab("changes");
  else if (["changes", "evidence"].includes(activePanel)) showTab("handoff");
});
get("journey-back").addEventListener("click", () => {
  if (activePanel === "contract" && questionIndex > 0) {
    questionIndex--;
    updateJourney();
    get(questionIndex === 0 && !get("exception-custom").open ? "choice-review" : questions[questionIndex]).focus();
  }
  else showTab(activePanel === "acceptance" ? "contract" : ["changes", "evidence"].includes(activePanel) ? "acceptance" : "changes");
});
function editProposal(id) {
  get("presentation").value = "guided";
  presentation();
  showTab("contract");
  if (questions.includes(id)) questionIndex = questions.indexOf(id);
  updateJourney();
  if (id === "exception") get("exception-custom").open = true;
  get(id).focus();
}
get("edit-goal").addEventListener("click", () => editProposal("goal"));
get("edit-answers").addEventListener("click", () => editProposal(questions[questionIndex]));
for (const id of ["exception", "failure", "boundary"]) get(`decision-${id}`).addEventListener("click", () => editProposal(id));
get("review-evidence").addEventListener("click", () => showTab("evidence"));
get("review-agreement").addEventListener("click", () => showTab("delta", true));
get("tips-toggle").addEventListener("click", () => {
  get("goal-tips").hidden = !get("goal-tips").hidden;
  get("tips-toggle").setAttribute("aria-expanded", String(!get("goal-tips").hidden));
});
function proposalChanged() {
  draftEdited = true;
  get("example-proposal").hidden = true;
  get("proposal-error").hidden = true;
  get("question-error").hidden = true;
  updateProposalSummary();
  controls();
}
for (const id of ["goal", "expected", "exception", "failure", "boundary", "owner-decision"]) {
  get(id).addEventListener(id === "owner-decision" ? "change" : "input", proposalChanged);
}
for (const [id, response] of Object.entries(exampleResponses)) get(`choice-${id}`).addEventListener("change", () => {
  if (get(`choice-${id}`).checked) {
    get("exception").value = response;
    proposalChanged();
  }
});
get("prepare-examples").addEventListener("click", () => {
  try {
    get("proposal-text").value = proposalText({
      outcome: get("goal").value, behavior: get("expected").value, exception: get("exception").value,
      failure: get("failure").value, boundary: get("boundary").value, ownerDecision: get("owner-decision").value,
    }, current);
    get("proposal-error").hidden = true;
    get("example-proposal").hidden = false;
    get("proposal-status").textContent = "Review this exact message before sharing. It has not been sent or saved as acceptance.";
    get("proposal-text").focus();
    controls();
  } catch (failure) {
    get("proposal-error").textContent = failure.message;
    get("proposal-error").hidden = false;
  }
});
get("select-examples").addEventListener("click", () => { get("proposal-text").focus(); get("proposal-text").select(); });
get("send-examples").addEventListener("click", () => continueInChat("proposal-text", "proposal-status"));
app.onteardown = async () => ({});
get("close-artifact").addEventListener("click", () => get("artifact-dialog").close());
get("open-editor").addEventListener("click", async () => {
  try {
    const result = await app.openLink({ url: current.artifact.editorUrl });
    if (result.isError) throw new Error("The host declined the editor link.");
  } catch (failure) {
    get("editor-note").textContent = `Could not open in the editor: ${failure.message}. Use the displayed path or inspect the source here.`;
  }
});
try {
  presentation();
  updateProposalSummary();
  await app.connect();
  const context = app.getHostContext();
  if (context) app.onhostcontextchanged(context);
  connected = true;
  controls();
} catch (failure) {
  error(`Could not connect to the MCP Apps host: ${failure.message}. No repository evidence has been loaded.`);
}
