import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { inspectionSchema } from "../engineering-schema.mjs";
import { proposalText, plainEvidence } from "../guided-content.mjs";

test("the actual UI renders all panels, preserves guided notes across inspection and surfaces errors", async () => {
  const nodes = [];
  class Node {
    constructor(tag = "div", text = "", value = "") {
      this.tagName = tag;
      this.textContent = text;
      this.value = value;
      this.children = [];
      this.dataset = {};
      this.attributes = {};
      this.listeners = {};
      this.hidden = false;
      nodes.push(this);
    }
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.children = [...children]; }
    get childElementCount() { return this.children.length; }
    setAttribute(name, value) { this.attributes[name] = value; }
    getAttribute(name) { return this.attributes[name]; }
    addEventListener(name, fn) { this.listeners[name] = fn; }
    focus() { this.focused = true; }
    select() {}
    showModal() { this.open = true; }
    close() { this.open = false; }
  }
  const html = fs.readFileSync(new URL("../engineering.html", import.meta.url), "utf8");
  const ids = new Map([...html.matchAll(/<[^>]*\bid="([^"]+)"[^>]*>/g)].map((x) => {
    const node = new Node();
    node.hidden = /\shidden(?:\s|>)/.test(x[0]);
    return [x[1], node];
  }));
  const tabs = ["contract", "acceptance", "evidence", "changes", "why", "delta", "handoff"].map((id) => {
    const node = ids.get(`tab-${id}`);
    node.textContent = id;
    node.setAttribute("aria-controls", id);
    return node;
  });
  ids.get("presentation").value = "guided";
  const document = {
    body: new Node(), documentElement: { style: {} },
    getElementById: (id) => {
      assert.ok(ids.has(id), `Missing UI element ${id}`);
      return ids.get(id);
    },
    createElement: (tag) => new Node(tag),
    createTextNode: (text) => new Node("text", text),
    querySelectorAll: (selector) => selector === "[role=tab]" ? tabs : nodes.filter((x) => x.dataset.artifact),
  };
  let app;
  class App {
    constructor() { app = this; }
    async connect() {}
    getHostContext() { return undefined; }
    getHostCapabilities() { return this.capabilities || {}; }
    async sendMessage(message) { this.sent = message; return { isError: true }; }
    async requestTeardown() {
      this.closeRequests = (this.closeRequests || 0) + 1;
      if (this.closeFailure) throw new Error("Host does not support closure");
    }
  }
  const source = fs.readFileSync(new URL("../engineering.mjs", import.meta.url), "utf8").replace(/^import .+;\r?$/gm, "");
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  await new AsyncFunction("App", "inspectionSchema", "proposalText", "plainEvidence", "document", "Option", source)(
    App, inspectionSchema, proposalText, plainEvidence, document, class extends Node { constructor(text, value) { super("option", text, value); } },
  );
  const report = {
    root: "C:\\repo", inspectedAt: new Date().toISOString(), head: "a".repeat(40), diffHash: "hash",
    sessions: [], session: null,
    config: { owner: "@owner", check: null, acceptanceCommand: null, acceptancePaths: [], protected: [] },
    contract: null, contractText: null, acceptance: [],
    changes: Array.from({ length: 8 }, (_, i) => ({ path: `file${i}.mjs`, kind: "implementation / other", status: "changed", ids: [] })),
    evidence: { source: null, freshness: "unavailable", recordedAt: null, recordedHead: null, outcome: "Unavailable", checks: [] },
    findings: [], events: [], files: [".golden-path/config.json"],
    relationships: [], agreementDelta: [], handoff: "Actual handoff",
  };
  ids.get("goal").value = "Keep my unsaved outcome.";
  app.ontoolresult({ structuredContent: { inspection: report } });
  assert.match(ids.get("status").textContent, /Connected. Begin in chat/);
  assert.equal(ids.get("first-run").hidden, false);
  assert.equal(ids.get("workspace").hidden, true);
  assert.equal(ids.get("send-welcome").hidden, true);
  assert.equal(app.sent, undefined);
  ids.get("select-welcome").listeners.click();
  assert.equal(ids.get("welcome-prompt").focused, true);
  assert.match(ids.get("welcome-status").textContent, /has not been sent/);
  assert.doesNotMatch(ids.get("welcome-status").textContent, /placeholder/);
  ids.get("details-welcome").listeners.click();
  assert.equal(ids.get("presentation").value, "engineering");
  assert.equal(ids.get("workspace").hidden, false);
  ids.get("back-welcome").listeners.click();
  assert.equal(ids.get("first-run").hidden, false);
  ids.get("explore-welcome").listeners.click();
  assert.equal(ids.get("workspace").hidden, false);
  assert.equal(ids.get("first-run").hidden, true);
  assert.equal(ids.get("presentation").value, "guided");
  assert.equal(ids.get("error").hidden, true, ids.get("error").textContent);
  assert.equal(ids.get("change-files").children.length, 5);
  assert.equal(ids.get("more-changes").hidden, false);
  assert.equal(ids.get("handoff-text").value, "Actual handoff");
  assert.ok(ids.get("guided-state").childElementCount > 0);
  assert.equal(ids.get("goal").value, "Keep my unsaved outcome.");
  assert.equal(ids.get("send-examples").hidden, true);
  assert.equal(ids.get("stage-1").getAttribute("aria-current"), "step");
  ids.get("journey-next").listeners.click();
  assert.equal(ids.get("question-error").hidden, false);
  ids.get("choice-review").checked = true;
  ids.get("choice-review").listeners.change();
  assert.match(ids.get("summary-exception").textContent, /Flag it for a person/);
  ids.get("journey-next").listeners.click();
  assert.equal(ids.get("question-expected").hidden, false);
  assert.equal(ids.get("question-position").textContent, "2 of 4");
  ids.get("journey-back").listeners.click();
  assert.equal(ids.get("question-exception").hidden, false);
  ids.get("journey-next").listeners.click();
  assert.equal(ids.get("question-expected").hidden, false);
  ids.get("tips-toggle").listeners.click();
  assert.equal(ids.get("tips-toggle").getAttribute("aria-expanded"), "true");
  ids.get("tips-toggle").listeners.click();
  assert.equal(ids.get("tips-toggle").getAttribute("aria-expanded"), "false");
  ids.get("stage-2").listeners.click();
  assert.equal(ids.get("stage-2").getAttribute("aria-current"), "step");
  assert.equal(ids.get("review-position").textContent, "2 of 4 stages");
  ids.get("review-agreement").listeners.click();
  assert.equal(ids.get("delta").hidden, false);
  assert.equal(ids.get("delta").focused, true);
  ids.get("stage-2").listeners.click();
  ids.get("mode-engineering").listeners.click();
  assert.equal(ids.get("mode-engineering").getAttribute("aria-pressed"), "true");
  ids.get("mode-guided").listeners.click();
  assert.equal(ids.get("goal").value, "Keep my unsaved outcome.");
  report.evidence.freshness = "stale";
  report.evidence.checks = [
    { name: "check", status: "passed", output: "Old success" },
    { name: "acceptance", status: "failed", output: "Old failure" },
  ];
  app.ontoolresult({ structuredContent: { inspection: report } });
  assert.equal(ids.get("summary-evidence").children[0].children[1].textContent, "0");
  assert.equal(ids.get("summary-evidence").children[1].children[1].textContent, "1");
  assert.equal(ids.get("summary-evidence").children[3].children[1].textContent, "2");
  for (const [id, value] of Object.entries({
    goal: "Keep my unsaved outcome.", expected: "Normal behavior.", exception: "Edge case.",
    failure: "Explicit failure.", boundary: "No payments.", "owner-decision": "review",
  })) ids.get(id).value = value;
  app.capabilities = { message: { text: {} } };
  app.ontoolresult({ structuredContent: { inspection: report } });
  assert.equal(ids.get("send-welcome").hidden, false);
  await ids.get("send-welcome").listeners.click();
  assert.match(ids.get("welcome-status").textContent, /unshared Guided answers/);
  assert.equal(app.sent, undefined);
  assert.equal(app.closeRequests, undefined);
  app.sent = undefined;
  assert.equal(ids.get("send-examples").hidden, false);
  ids.get("prepare-examples").listeners.click();
  assert.equal(app.sent, undefined);
  await ids.get("send-examples").listeners.click();
  assert.equal(app.sent.role, "user");
  assert.match(ids.get("proposal-status").textContent, /Could not share in chat/);
  assert.equal(ids.get("proposal-text").value, app.sent.content[0].text);
  ids.get("more-changes").listeners.click();
  assert.equal(ids.get("change-files").children.length, 9);
  app.ontoolresult({ isError: true, content: [{ type: "text", text: "Source unavailable" }] });
  assert.equal(ids.get("error").textContent, "Source unavailable");
  assert.equal(ids.get("handoff-text").value, "Actual handoff");
  assert.equal(ids.get("goal").value, "Keep my unsaved outcome.");
  app.ontoolresult({ structuredContent: { inspection: {} } });
  assert.match(ids.get("error").textContent, /invalid inspection/);
  assert.equal(ids.get("handoff-text").value, "Actual handoff");
  ids.get("back-welcome").listeners.click();
  assert.equal(ids.get("first-run").hidden, false);
  report.sessions = [{ id: "recorded-work", task: "task.md", started: null }];
  app.ontoolresult({ structuredContent: { inspection: report } });
  assert.equal(ids.get("first-run").hidden, true);
  assert.equal(ids.get("workspace").hidden, false);
  assert.equal(ids.get("back-welcome").hidden, true);
  assert.match(ids.get("status").textContent, /Choose the recorded session/);
  assert.equal(ids.get("goal").value, "Keep my unsaved outcome.");
  assert.equal(ids.get("returning").hidden, false);
  assert.match(ids.get("return-next").textContent, /Choose the recorded work/);
  report.brief = { outcome: "A proposed starting point from the conversation.", behavior: "An observable result." };
  app.ontoolresult({ structuredContent: { inspection: report } });
  assert.equal(ids.get("goal").value, "Keep my unsaved outcome.");
  assert.equal(ids.get("suggested-brief").hidden, false);
  ids.get("apply-brief").listeners.click();
  assert.equal(ids.get("goal").value, report.brief.outcome);
  assert.equal(ids.get("expected").value, report.brief.behavior);
  assert.equal(ids.get("boundary").value, "No payments.");
  assert.equal(ids.get("owner-decision").value, "review");
  ids.get("prepare-examples").listeners.click();
  const calls = [];
  let accept;
  app.sendMessage = message => {
    calls.push("send");
    app.sent = message;
    return new Promise(resolve => { accept = resolve; });
  };
  const delivery = ids.get("send-examples").listeners.click();
  assert.equal(ids.get("send-examples").disabled, true);
  await ids.get("send-examples").listeners.click();
  assert.deepEqual(calls, ["send"]);
  assert.equal(app.closeRequests, undefined);
  accept({});
  await delivery;
  assert.equal(app.closeRequests, 1);
  assert.match(ids.get("proposal-status").textContent, /closure requested.*host decides/);
  await ids.get("send-examples").listeners.click();
  assert.deepEqual(calls, ["send"]);
  assert.equal(app.closeRequests, 1);
  ids.get("goal").value = "A corrected outcome after successful delivery.";
  ids.get("goal").listeners.input();
  ids.get("prepare-examples").listeners.click();
  assert.equal(ids.get("send-examples").disabled, false);
  app.sendMessage = async () => { calls.push("send"); return {}; };
  app.closeFailure = true;
  await ids.get("send-examples").listeners.click();
  assert.match(ids.get("proposal-status").textContent, /Message accepted, but closure could not be requested/);
  assert.equal(app.closeRequests, 2);
  await ids.get("send-examples").listeners.click();
  assert.deepEqual(calls, ["send", "send"]);
});
