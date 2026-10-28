import { AppBridge, PostMessageTransport } from "@modelcontextprotocol/ext-apps/app-bridge";

const frame = document.getElementById("app");
const status = document.getElementById("host-status");
const architecture = document.body.dataset.view === "architecture";
const bridge = new AppBridge(null, { name: "Golden Path local validation host", version: "0.1.0" },
  { serverTools: {}, updateModelContext: { text: {} } }, { hostContext: { theme: "dark", platform: "web", displayMode: "inline" } });

async function request(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`Inspection endpoint failed (${response.status}): ${await response.text()}`);
  return response.json();
}
const inspect = () => architecture ? request("/model") : request("/report", { method: "POST" });
bridge.oncalltool = async ({ name, arguments: args }) => {
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
    status.textContent = architecture ?
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
