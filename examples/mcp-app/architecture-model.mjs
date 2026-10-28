import { z } from "zod";

const item = z.object({
  id: z.string().min(1), status: z.enum(["draft", "baseline"]),
  text: z.string().min(1).max(4000), rationale: z.string().min(1).max(8000),
});
export const modelSchema = z.object({
  schemaVersion: z.literal(1), kind: z.literal("isolated-example"),
  revision: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  title: z.string().min(1),
  requirements: z.array(item.extend({ componentIds: z.array(z.string()) }).strict()).min(1),
  assumptions: z.array(item.extend({ requirementIds: z.array(z.string()) }).strict()),
  components: z.array(z.object({ id: z.string(), name: z.string(), responsibility: z.string() }).strict()),
}).strict().superRefine((model, context) => {
  for (const collection of ["requirements", "assumptions", "components"]) {
    if (new Set(model[collection].map((x) => x.id)).size !== model[collection].length) {
      context.addIssue({ code: "custom", message: `Duplicate IDs in ${collection}.` });
    }
  }
  if (model.requirements.some((r) => r.componentIds.some((id) => !model.components.some((c) => c.id === id))) ||
    model.assumptions.some((a) => a.requirementIds.some((id) => !model.requirements.some((r) => r.id === id)))) {
    context.addIssue({ code: "custom", message: "Reference to a missing requirement or component." });
  }
});
export const updateSchema = z.object({
  collection: z.enum(["requirements", "assumptions"]),
  id: z.string().min(1),
  expectedRevision: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER - 1),
  text: z.string().trim().min(1).max(4000),
  rationale: z.string().trim().min(1).max(8000),
}).strict();
