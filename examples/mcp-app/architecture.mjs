import { App } from "@modelcontextprotocol/ext-apps";
import { modelSchema, updateSchema } from "./architecture-model.mjs";
import { collectionContent, connections, conversationPrompt } from "./review-content.mjs";

const app = new App({ name: "Golden Path decision workspace", version: "0.1.0" });
const get = (id) => document.getElementById(id);
let current;
let selected = { collection: "requirements", id: "R1" };
let dirty = false;
let busy = false;
let connected = false;
let pendingAction;

function error(message) {
  get("error").textContent = message;
  get("error").hidden = false;
}
function controls() {
  const item = current?.model[selected.collection].find((x) => x.id === selected.id);
  get("save").disabled = busy || !dirty || item?.status !== "draft";
  get("save").textContent = busy ? "Please wait..." : "Save draft";
  get("discard").disabled = busy || !dirty;
  get("reload").disabled = busy || !connected;
  get("reload").textContent = busy ? "Please wait..." : "Check for updates";
  get("prepare").disabled = busy || !current;
  get("statement").readOnly = get("rationale").readOnly = busy || item?.status !== "draft";
  get("draft-form").setAttribute("aria-busy", String(busy));
  get("item-select").disabled = busy;
}
function clearValidation() {
  for (const id of ["statement", "rationale"]) {
    get(id).removeAttribute("aria-invalid");
    get(`${id}-error`).hidden = true;
  }
}
function confirmLeaving(action) {
  if (busy) return;
  if (!dirty) { action(); return; }
  pendingAction = action;
  get("discard-dialog").showModal();
  get("keep-editing").focus();
}
get("keep-editing").addEventListener("click", () => {
  pendingAction = undefined;
  get("discard-dialog").close();
});
get("discard-dialog").addEventListener("cancel", () => { pendingAction = undefined; });
get("confirm-discard").addEventListener("click", () => {
  const action = pendingAction;
  get("discard-dialog").close();
  pendingAction = undefined;
  action?.();
});
function select(collection, id) {
  if (selected.collection === collection && selected.id === id) return;
  confirmLeaving(() => {
    selected = { collection, id };
    dirty = false;
    get("error").hidden = true;
    get("feedback").textContent = "Viewing the saved draft. No changes made.";
    render();
    get("review-title").focus();
  });
}
function renderConnections(item) {
  const { model } = current;
  const requirement = selected.collection === "requirements";
  const { linked, assumptions } = connections(model, selected.collection, item);
  get("trace-title").textContent = requirement ? "Where this shows up" : "What depends on this assumption";
  get("trace-hint").textContent = requirement ?
    "Connected parts of the example. These links provide context, not proof that the requirement is met." :
    "Open a connected requirement to consider what would change if this belief is wrong.";
  get("trace").replaceChildren();
  for (const link of linked) {
    const row = document.createElement("li");
    const card = document.createElement(requirement ? "div" : "button");
    card.className = "connection";
    if (!requirement) {
      card.type = "button";
      card.addEventListener("click", () => select("requirements", link.id));
    }
    const title = document.createElement("strong");
    title.textContent = requirement ? link.name : `${link.id} / ${link.text}`;
    card.append(title, document.createTextNode(requirement ? link.responsibility : "Review connected requirement"));
    row.append(card);
    get("trace").append(row);
  }
  if (!linked.length) {
    const row = document.createElement("li");
    row.className = "hint";
    row.textContent = "No connections recorded. Ask the agent what context is missing.";
    get("trace").append(row);
  }
  get("assumption-links").hidden = !requirement;
  get("related-assumptions").replaceChildren();
  for (const assumption of assumptions) {
    const row = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "connection";
    button.textContent = assumption.text;
    const hint = document.createElement("span");
    hint.textContent = `${assumption.id} / ${assumption.status === "draft" ? "Draft" : "Locked example"} / Review assumption`;
    button.append(hint);
    button.addEventListener("click", () => select("assumptions", assumption.id));
    row.append(button);
    get("related-assumptions").append(row);
  }
  if (requirement && !assumptions.length) {
    const row = document.createElement("li");
    row.className = "hint";
    row.textContent = "No assumptions linked. This does not mean there are none to challenge.";
    get("related-assumptions").append(row);
  }
}
function render() {
  const { model, statePath } = current;
  get("model-title").textContent = model.title;
  get("state-path").textContent = statePath;
  get("revision").textContent = String(model.revision);
  get("raw").textContent = JSON.stringify(model, null, 2);
  get("items").replaceChildren();
  get("item-select").replaceChildren();
  for (const [collection, labels] of Object.entries(collectionContent)) {
    const group = document.createElement("optgroup");
    group.label = labels.heading;
    get("item-select").append(group);
    const heading = document.createElement("h2");
    heading.textContent = labels.heading;
    const hint = document.createElement("p");
    hint.className = "hint";
    hint.textContent = labels.hint;
    get("items").append(heading, hint);
    for (const item of model[collection]) {
      const option = document.createElement("option");
      option.textContent = `${item.id} / ${item.status === "draft" ? "Draft" : "Locked"} - ${item.text.slice(0, 90)}`;
      option.dataset.collection = collection;
      option.dataset.id = item.id;
      option.selected = selected.collection === collection && selected.id === item.id;
      group.append(option);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "item";
      button.setAttribute("aria-pressed", String(selected.collection === collection && selected.id === item.id));
      const meta = document.createElement("span");
      meta.className = "item-meta";
      meta.textContent = `${item.id} / ${item.status === "draft" ? "Draft" : "Locked example"}`;
      const summary = document.createElement("span");
      summary.className = "item-text";
      summary.textContent = item.text;
      button.append(meta, summary);
      button.addEventListener("click", () => select(collection, item.id));
      get("items").append(button);
    }
    if (!model[collection].length) {
      const empty = document.createElement("p");
      empty.className = "hint";
      empty.textContent = "None recorded. Ask the agent what may be missing.";
      get("items").append(empty);
    }
  }
  const item = model[selected.collection].find((x) => x.id === selected.id);
  if (!item) { error("This item is no longer available. Check for updates to continue."); return; }
  const labels = collectionContent[selected.collection];
  get("item-title").textContent = `${labels.item} / ${item.id}`;
  get("review-title").textContent = labels.title;
  get("item-status").textContent = item.status === "draft" ? "Draft · Open to change" : "Locked example · Read only";
  get("editor-note").textContent = item.status === "draft" ?
    "Edit the wording and reason below. Saving updates the draft for you and the agent; it does not approve it." :
    "This example cannot be edited here. Discuss a proposed change with the owner in your conversation.";
  get("statement-label").textContent = labels.statement;
  get("statement-hint").textContent = labels.statementHint;
  get("rationale-label").textContent = labels.rationale;
  get("rationale-hint").textContent = labels.rationaleHint;
  get("statement").value = item.text;
  get("rationale").value = item.rationale;
  clearValidation();
  renderConnections(item);
  get("workspace").hidden = get("next").hidden = false;
  refreshHandoff();
  controls();
}
function refreshHandoff() {
  if (!current) return;
  get("conversation-prompt").value = conversationPrompt(current);
  get("handoff-note").textContent = `Based on saved version ${current.model.revision}. ${dirty ?
    "Your unsaved edits are not included. Save them first if you want to discuss those changes." :
    "This is a discussion prompt, not an outcome report or owner acceptance."}`;
}
function receive(result, saved = false, fromConversation = false) {
  if (result.isError) {
    const detail = result.content?.filter((x) => x.type === "text").map((x) => x.text).join("\n") || "The shared draft could not be loaded.";
    error(saved ? `The shared source could not accept this save. Your edits are still here. Check for updates before retrying. ${detail}` : detail);
    get("feedback").textContent = "This view has not accepted an updated draft. Your edits, if any, are still here.";
    return false;
  }
  const data = result.structuredContent;
  if (!data || typeof data.statePath !== "string" || !modelSchema.safeParse(data.model).success) {
    error("The shared source returned an invalid draft. This view has not accepted it. Check for updates to retry.");
    get("feedback").textContent = "No updated draft was accepted. Your current view and edits are unchanged.";
    return false;
  }
  if (fromConversation && (dirty || busy || get("discard-dialog").open)) {
    get("update-notice").textContent = "New information arrived from the conversation. Your current view and edits are unchanged. Check for updates when you are ready; unsaved edits will need to be discarded.";
    get("update-notice").hidden = false;
    return false;
  }
  current = data;
  if (!current.model[selected.collection].some((x) => x.id === selected.id)) {
    selected = { collection: "requirements", id: current.model.requirements[0].id };
  }
  dirty = false;
  get("error").hidden = get("update-notice").hidden = true;
  render();
  get("feedback").textContent = saved ?
    `Draft saved as version ${data.model.revision}. The agent can now re-read it. This is not approval.` :
    `Showing saved version ${data.model.revision}. Start with what matters, then question the assumptions.`;
  return true;
}
app.ontoolresult = (result) => receive(result, false, true);
app.onhostcontextchanged = ({ theme }) => {
  if (theme === "light" || theme === "dark") document.documentElement.style.colorScheme = theme;
};
get("item-select").addEventListener("change", () => {
  const { collection, id } = get("item-select").selectedOptions[0].dataset;
  for (const option of get("item-select").options) {
    option.selected = selected.collection === option.dataset.collection && selected.id === option.dataset.id;
  }
  select(collection, id);
});
for (const id of ["statement", "rationale"]) get(id).addEventListener("input", () => {
  const item = current.model[selected.collection].find((x) => x.id === selected.id);
  dirty = get("statement").value !== item.text || get("rationale").value !== item.rationale;
  get("feedback").textContent = dirty ? "Unsaved changes. Only you can see these edits until you save." : "No unsaved changes.";
  clearValidation();
  refreshHandoff();
  controls();
});
async function reload() {
  busy = true;
  controls();
  get("feedback").textContent = "Checking the shared source...";
  try { receive(await app.callServerTool({ name: "inspect_architecture", arguments: {} })); }
  catch (failure) {
    error(`Could not check for updates: ${failure.message}. Your current view and edits are unchanged.`);
    get("feedback").textContent = "Updates could not be loaded. Your current view and edits are unchanged.";
  }
  finally { busy = false; controls(); }
}
get("reload").addEventListener("click", () => confirmLeaving(reload));
get("discard").addEventListener("click", () => confirmLeaving(() => {
  dirty = false;
  get("error").hidden = true;
  render();
  get("feedback").textContent = "Changes discarded. Showing the saved draft you last loaded.";
  get("statement").focus();
}));
get("save").addEventListener("click", async () => {
  if (busy || !dirty || current.model[selected.collection].find((x) => x.id === selected.id)?.status !== "draft") return;
  const input = {
    ...selected, expectedRevision: current.model.revision,
    text: get("statement").value, rationale: get("rationale").value,
  };
  const validation = updateSchema.safeParse(input);
  if (!validation.success) {
    for (const [id, field] of [["statement", "text"], ["rationale", "rationale"]]) {
      if (validation.error.issues.some((issue) => issue.path[0] === field)) {
        get(id).setAttribute("aria-invalid", "true");
        get(`${id}-error`).textContent = `Add ${id === "statement" ? "a statement" : "a reason"} before saving; spaces alone are not enough. Keep it within ${id === "statement" ? "4,000" : "8,000"} characters.`;
        get(`${id}-error`).hidden = false;
      }
    }
    get("feedback").textContent = "Not saved. Check the highlighted fields.";
    document.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }
  busy = true;
  controls();
  get("feedback").textContent = "Saving your draft...";
  try {
    const result = await app.callServerTool({ name: "update_architecture_draft", arguments: validation.data });
    if (receive(result, true) && app.getHostCapabilities()?.updateModelContext) {
      try {
        await app.updateModelContext({ content: [{
          type: "text",
          text: `Architecture draft changed at ${current.statePath}, revision ${current.model.revision}. Reload inspect_architecture before further reasoning. This was not an approval.`,
        }] });
      } catch (failure) {
        error(`Your draft is saved as version ${current.model.revision}, but the agent could not be notified: ${failure.message}. Ask it to reload inspect_architecture explicitly.`);
      }
    }
  } catch (failure) {
    error(`Could not confirm the save: ${failure.message}. Your edits are still here. Check for updates before retrying; the shared source may already have changed.`);
    get("feedback").textContent = "Save could not be confirmed. Your edits are still here.";
  } finally {
    busy = false;
    controls();
  }
});
get("prepare").addEventListener("click", () => {
  refreshHandoff();
  get("handoff").hidden = false;
  get("handoff-heading").focus();
});
get("close-handoff").addEventListener("click", () => {
  get("handoff").hidden = true;
  get("prepare").focus();
});
get("select-prompt").addEventListener("click", () => {
  get("conversation-prompt").focus();
  get("conversation-prompt").select();
});
try {
  await app.connect();
  const context = app.getHostContext();
  if (context) app.onhostcontextchanged(context);
  connected = true;
  controls();
} catch (failure) {
  error(`Could not connect to your host: ${failure.message}. Restart the MCP App from your conversation to try again.`);
  get("feedback").textContent = "No shared draft loaded.";
}
