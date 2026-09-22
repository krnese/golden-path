# Executable Microsoft AI Golden Path

The repository is the reference implementation, not a sample application.
It helps a human developer and GitHub Copilot derive the simplest justified
implementation from an outcome, preserve engineering intent, and prove changes.
An entirely deterministic workload is a first-class result.

**Complexity must be earned.** Microsoft AI services, agents, MCP, workflows,
state and infrastructure are options, not prerequisites or a maturity ladder.

Business Outcome -> Decomposition -> Workload -> Requirements -> Capability ->
Architecture -> Plan -> Build -> Prove -> Release -> Run -> Observe -> Learn -> Improve

## Start

Use Node 24 LTS and Git. These are repository validation tools, not a runtime
choice for future workloads. In this repository:

```sh
npm ci --ignore-scripts
npm run check
npm run trace -- wl-engineering
```

In VS Code with GitHub Copilot, select **Golden Path Engineer** and begin with:

> Outcome: [measurable business result]. Beneficiaries: [who]. Constraints:
> [time, cost, risk, data]. Decompose this into bounded workloads and acceptance
> criteria. Identify missing decisions before proposing technology. Apply the
> Golden Path and explain the smallest architecture that satisfies the needs.

The repository instructions also apply when using the default Copilot agent.
The primary agent loads one governing `golden-path` skill and selectively reads
its supporting references. Verify discovery in your installed VS Code version.
No editor extension or model is pinned by this repository.

## Where Intent Lives

| Artifact | Purpose |
| --- | --- |
| [Engineering workload](engineering/wl-engineering.json) | Entry point to canonical individually versioned artifacts; no centralized ledger |
| [Approved evolution decision](engineering/adr-bootstrap-minimum.json) | Why seven skills and centralized state were simplified after review |
| [Contract schema](contracts/engineering.schema.json) | Closed, versioned record shapes |
| [Golden Path](docs/golden-path.md) | Principles, change protocol, state boundaries, decision lifecycle, release and learning controls |
| [Invariant coverage](docs/invariants.md) | What automation enforces and what still requires judgment |
| [Behavioral evaluation](evaluations/bootstrap.md) | Six representative Copilot scenarios and evidence rubric |
| [Engineering agent](.github/agents/golden-path.agent.md) | One reasoning boundary using one skill and supporting references |
| [Validation](scripts/validate.mjs) | Read-only canonical discovery, derived traceability, implementation binding and transition checks |

Run `npm run trace -- <artifact-id>` from either end of a relationship. Output
lists the connected component's directed references, supporting forward and
reverse navigation; it is not a causal proof.

For a change against an existing Git revision:

```sh
npm run validate -- --base <full-40-character-base-commit-sha>
```

The validator discovers one JSON artifact per stable ID in `engineering/`,
rejects duplicate IDs, broken references and mirrored relationship fields, and
derives the graph in memory. It checks significant file bindings and reports
incidental unbound files without requiring a registry entry for every file.
CI compares the base revision, runs tests and audits dependencies. It cannot
infer semantic architecture or hidden executable capability from arbitrary code.

## Bootstrap Status

The first workload is **engineering this repository with a human and Copilot**.
It uses AI during development, not in a deployed application. The minimum
architecture is **approved** by the human request recorded in the consequential
decision. Repository implementations are **active** under that approval; this is
not a production deployment, proof of behavior, or permission for future writes.
Behavioral evaluations remain **defined, not executed**. No results are fabricated.

The first Golden Path evolution is the review of this scaffold: one skill with
references replaced seven independent skills; canonical artifacts and derived
relationships replaced the ledger and mirrored links. The decision preserves
the rejected alternatives and reasoning, not obsolete implementation. Separate
change/learning registries were removed; Git, review and owning artifacts suffice.

Only four top-level exclusions are outside the file inventory: `.git`,
`node_modules`, `.local`, and `coverage`. Do not put authoritative code there.
Use ignored `.local/` for temporary transcripts and working notes; no temporary
reasoning automatically becomes engineering doctrine. Do not store secrets or
sensitive production payloads in Git or evaluation transcripts.

There are deliberately no application, deployment, infrastructure, MCP, runtime
agent, database, orchestration, hook, or autonomous-improvement directories.
Add them only when a workload requirement earns them. Significant implementation
and reasoning surfaces have one binding owner. Canonical artifacts own their
identities and relationships directly; no manifest or duplicate file registry
is maintained. Empty architecture directories are unnecessary.

## Smallest Next Experiment

Run Scenario A from the behavioral evaluation with the primary agent in a fresh
session, requesting a proposal only. Verify it derives a deterministic design
without runtime AI. Do not execute the experiment as part of scaffolding.
After that future run, capture the redacted transcript and reviewer assessment
in a reviewed file or durable review URL; propose evidence linked only to
`eval-behavior`. Workload and outcome are derived. If it fails, identify the root-cause artifact and add a
regression before changing that artifact. Review the resulting diff normally.

Before relying on CI as a merge gate, a repository administrator must configure
required status checks and reviewer protections, especially for governance,
contracts, validation code and workflow changes. The scaffold cannot grant or
configure those permissions locally.