import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const directory = path.dirname(fileURLToPath(import.meta.url));
try {
  const { values } = parseArgs({ options: { state: { type: "string" } }, allowPositionals: false });
  const state = path.resolve(values.state || path.join(directory, "..", "..", ".local", "mcp-app", "architecture.json"));
  fs.mkdirSync(path.dirname(state), { recursive: true });
  fs.copyFileSync(path.join(directory, "example-model.json"), state, fs.constants.COPYFILE_EXCL);
  fs.chmodSync(state, 0o600);
  console.log(`Created isolated example model: ${state}`);
  console.log("This is not real business acceptance or an approval record.");
} catch (error) {
  console.error(`Example initialization failed: ${error.message}. Existing models are never overwritten.`);
  process.exitCode = error.code === "EEXIST" ? 2 : 1;
}
