import { z } from "zod";

export const sessionIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,80}$/);
export const runtimeSchema = z.object({
  kitVersion: z.string(), appVersion: z.string(), nodeVersion: z.string(),
  protocolVersion: z.literal(1),
  runningSource: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
  checkoutSource: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
  builtSource: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
  runningBuild: z.string().regex(/^[a-f0-9]{64}$/).nullable().optional(),
  builtBuild: z.string().regex(/^[a-f0-9]{64}$/).nullable().optional(),
  status: z.enum(["current", "rebuild-required", "restart-required", "unknown"]),
  detail: z.string(), next: z.string(),
  installation: z.object({
    status: z.enum(["present", "missing", "unknown"]),
    version: z.string().nullable(), level: z.union([z.literal(1), z.literal(2), z.literal(3)]).nullable(),
    detail: z.string(),
  }),
});
export const briefSchema = z.object({
  outcome: z.string().trim().min(1).max(2000).optional(),
  behavior: z.string().trim().min(1).max(2000).optional(),
  exception: z.string().trim().min(1).max(2000).optional(),
  failure: z.string().trim().min(1).max(2000).optional(),
  boundary: z.string().trim().min(1).max(2000).optional(),
}).strict();
export const repositoryFactSchema = z.object({
  name: z.string(),
  status: z.enum(["configured", "verified", "missing", "failed", "pending", "unknown", "stale"]),
  detail: z.string(),
  source: z.string(),
  url: z.string().url().optional(),
});
export const repositorySchema = z.object({
  inspectedAt: z.string().datetime(),
  local: z.array(repositoryFactSchema),
  github: z.object({
    repository: z.string().nullable(),
    inspectedAt: z.string().datetime().nullable(),
    facts: z.array(repositoryFactSchema),
  }),
});
export const inspectionInput = z.object({
  sessionId: sessionIdSchema.optional(),
  file: z.string().min(1).max(500).optional(),
  view: z.enum(["source", "diff"]).optional(),
  github: z.boolean().optional(),
  brief: briefSchema.optional(),
}).strict();
export const checkSchema = z.object({
  name: z.string(),
  status: z.enum(["passed", "failed", "skipped", "unverified", "unavailable"]),
  output: z.string(),
});
export const captureSchema = z.object({
  version: z.literal(1),
  sessionId: sessionIdSchema,
  recordedAt: z.string().datetime(),
  root: z.string(),
  head: z.string().nullable(),
  diffHash: z.string().nullable(),
  stable: z.boolean(),
  result: z.object({
    base_sha: z.string().nullable(),
    outcome: z.string(),
    results: z.array(z.object({
      name: z.string(), ok: z.boolean(), output: z.string(),
      skipped: z.boolean().optional(), status: z.string().optional(),
      unverified: z.boolean().optional(), timed_out: z.boolean().optional(),
    }).passthrough()),
  }).passthrough(),
});
export const inspectionSchema = z.object({
  root: z.string(),
  inspectedAt: z.string(),
  head: z.string(),
  diffHash: z.string().nullable(),
  sessions: z.array(z.object({ id: sessionIdSchema, task: z.string().nullable(), started: z.number().nullable() })),
  session: z.object({
    id: sessionIdSchema, base: z.string().nullable(), baseSource: z.string(),
    task: z.string().nullable(), outcome: z.string(),
  }).nullable(),
  config: z.object({
    owner: z.string(), check: z.string().nullable(), acceptanceCommand: z.string().nullable(),
    acceptancePaths: z.array(z.string()), protected: z.array(z.string()),
  }),
  contract: z.string().nullable(),
  contractText: z.string().nullable(),
  relationships: z.array(z.object({
    from: z.string(), to: z.string().nullable(),
    confidence: z.enum(["verified", "inferred", "unavailable"]), reason: z.string(),
  })),
  agreementDelta: z.array(z.object({
    path: z.string(), classification: z.enum(["agreement-source", "implementation-candidate"]),
    basis: z.string(), decision: z.string(),
  })),
  acceptance: z.array(z.object({
    path: z.string(), ids: z.array(z.string()), status: z.literal("unverified"),
    provenance: z.string(),
  })),
  changes: z.array(z.object({
    path: z.string(), kind: z.string(), status: z.string(), ids: z.array(z.string()),
  })),
  evidence: z.object({
    source: z.string().nullable(), freshness: z.enum(["current", "stale", "unavailable"]),
    recordedAt: z.string().nullable(), recordedHead: z.string().nullable(), outcome: z.string(),
    checks: z.array(checkSchema),
  }),
  findings: z.array(checkSchema),
  events: z.array(z.object({ event: z.string(), at: z.string(), detail: z.string() })),
  files: z.array(z.string()),
  handoff: z.string(),
  brief: briefSchema.optional(),
  repository: repositorySchema.optional(),
  runtime: runtimeSchema.optional(),
  artifact: z.object({
    path: z.string(), view: z.enum(["source", "diff"]), text: z.string(),
    truncated: z.boolean(), editorUrl: z.string(),
  }).optional(),
});
