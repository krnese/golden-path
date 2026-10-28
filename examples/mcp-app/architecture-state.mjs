import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { modelSchema, updateSchema } from "./architecture-model.mjs";

export function readArchitecture(file) {
  const statePath = fs.realpathSync(file);
  const stat = fs.statSync(statePath);
  if (!stat.isFile() || stat.size > 1 << 20) throw new Error("Architecture state must be a JSON file smaller than 1 MiB.");
  const model = modelSchema.parse(JSON.parse(fs.readFileSync(statePath, "utf8")));
  return { model, statePath };
}

export function updateDraft(file, input) {
  const change = updateSchema.parse(input);
  const statePath = fs.realpathSync(file);
  const lockPath = `${statePath}.lock`;
  let lock;
  try {
    lock = fs.openSync(lockPath, "wx", 0o600);
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    throw new Error("Architecture model is busy. Reload and retry; no draft was saved.");
  }
  let temporary;
  try {
    const { model } = readArchitecture(statePath);
    if (model.revision !== change.expectedRevision) {
      throw new Error(`Model revision changed from ${change.expectedRevision} to ${model.revision}. Reload before saving; no draft was saved.`);
    }
    const selected = model[change.collection].find((x) => x.id === change.id);
    if (!selected) throw new Error(`Unknown ${change.collection} item: ${change.id}`);
    if (selected.status !== "draft") throw new Error("Baseline items are locked. This prototype cannot change approved constraints or approval records.");
    selected.text = change.text;
    selected.rationale = change.rationale;
    model.revision++;
    temporary = `${statePath}.${randomUUID()}.tmp`;
    const descriptor = fs.openSync(temporary, "wx", 0o600);
    try {
      fs.writeFileSync(descriptor, JSON.stringify(model, null, 2) + "\n");
      fs.fsyncSync(descriptor);
    } finally {
      fs.closeSync(descriptor);
    }
    fs.renameSync(temporary, statePath);
    temporary = undefined;
    return { model, statePath };
  } finally {
    if (temporary && fs.existsSync(temporary)) fs.unlinkSync(temporary);
    fs.closeSync(lock);
    fs.unlinkSync(lockPath);
  }
}
