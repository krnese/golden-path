import { AppBridge, PostMessageTransport } from "@modelcontextprotocol/ext-apps/app-bridge";

const frame = document.getElementById("app");
const status = document.getElementById("host-status");
const architecture = document.body.dataset.view === "architecture";
const engineering = document.body.dataset.view === "engineering";
const handoffDemo = engineering && new URLSearchParams(location.search).get("handoff") === "demo";
const bridge = new AppBridge(null, { name: "Golden Path local validation host", version: "0.1.0" },
  { serverTools: {}, updateModelContext: { text: {} }, ...(handoffDemo ? { message: { text: {} } } : {}) },
  { hostContext: { theme: "dark", platform: "web", displayMode: "inline" } });

if (handoffDemo) {
  document.getElementById("handoff-demo").hidden = false;
  bridge.onmessage = async ({ role, content }) => {
    if (role !== "user" || content.some(item => item.type !== "text")) throw new Error("The simulation accepts user text only.");
    const message = document.getElementById("simulated-message");
    message.textContent = content.map(item => item.text).join("\n");
    message.hidden = false;
    status.closest("details").open = true;
    status.textContent = "Simulation accepted this message. Nothing was sent to Copilot or saved to repository records.";
    return {};
  };
  bridge.onrequestteardown = async () => {
    try {
      await bridge.teardownResource({});
      frame.hidden = true;
      document.getElementById("reopen-app").hidden = false;
      status.textContent = "Simulation closed the App after message acceptance. Reopen to read actual repository records; no chat or progress was created by this simulation.";
    } catch (error) {
      status.textContent = `Simulation could not close the App: ${error.message}. The accepted message is still displayed below.`;
      status.setAttribute("role", "alert");
    }
  };
}
document.getElementById("reopen-app").addEventListener("click", () => location.reload());

async function request(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`Inspection endpoint failed (${response.status}): ${await response.text()}`);
  return response.json();
}
const inspect = (args = {}) => engineering ? request("/engineering", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(args),
}) :
  architecture ? request("/model") : request("/report", { method: "POST" });
bridge.oncalltool = async ({ name, arguments: args }) => {
  if (engineering) {
    if (name !== "inspect_engineering_session") throw new Error("This engineering view permits only read-only inspection.");
    return inspect(args);
  }
  if (architecture && name === "update_architecture_draft") {
    return request("/model", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(args) });
  }
  if (name !== (architecture ? "inspect_architecture" : "inspect_golden_path_adoption") || (args && Object.keys(args).length)) {
    throw new Error("This preview exposes only the bound inspection and, in architecture mode, isolated example draft updates.");
  }
  return inspect();
};
bridge.onupdatemodelcontext = async ({ content }) => {
  status.textContent = `App freshness notification: ${content?.filter((x) => x.type === "text").map((x) => x.text).join(" ") || "Model changed."} No reasoning agent runs in this local host.`;
  return {};
};
bridge.onsizechange = ({ height }) => {
  if (Number.isFinite(height)) frame.style.height = `${Math.max(300, Math.min(height + 24, 18000))}px`;
};
bridge.oninitialized = async () => {
  try {
    await bridge.sendToolInput({ arguments: {} });
    await bridge.sendToolResult(await inspect());
    status.textContent = engineering ? "MCP Apps handshake completed. Engineering artifacts are read-only; no checks run." : architecture ?
      "MCP Apps handshake completed. Chat tools and the App use the same local example model." :
      "MCP Apps handshake completed. The selected repository is inspected locally.";
  } catch (error) {
    status.textContent = error.message;
    status.setAttribute("role", "alert");
    status.closest("details").open = true;
    await bridge.sendToolResult({ isError: true, content: [{ type: "text", text: error.message }] });
  }
};
try {
  await bridge.connect(new PostMessageTransport(frame.contentWindow, frame.contentWindow));
  frame.src = "/app";
} catch (error) {
  status.textContent = `MCP Apps bridge failed: ${error.message}`;
  status.setAttribute("role", "alert");
  status.closest("details").open = true;
}
