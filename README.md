# From AI-Assisted Coding to Governed Agentic Engineering

The **Executable Microsoft AI Golden Path** is an executable engineering system,
not a sample application or another static reference architecture. The repository
implements the discipline it describes: beginning with an outcome, deriving the
simplest justified architecture, preserving intent, and evaluating results.

**New here? [Start with your problem, not the architecture](docs/getting-started.md).**
Describe what you need in normal language; no architecture vocabulary is required.

**AI-assisted coding helps humans produce software. Governed agentic engineering
enables humans to direct software-producing agents within an engineering system
that makes intent, architecture, authority, evidence, and accountability explicit.**

Outcome -> Decompose -> Workload -> Requirements -> Architecture -> Build ->
Prove -> Run -> Learn -> Reuse

## Governed Agentic Engineering

Agents can participate in planning, building, testing, evaluating, and evolving
software, not only code generation. As implementation becomes cheaper, engineering
attention shifts toward intent, decomposition, requirements, architectural
judgment, authority, evidence, and deciding which learning becomes durable.
The developer becomes the director and accountable engineer of this
software-production system.

Governance does not mean adding human approval to every operation. It means
enabling fast, increasingly autonomous work within explicit, enforced boundaries.
**Agents reason. Policy constrains. Evidence validates. Humans remain accountable.**
This is the model explored here, not a claim of unrestricted autonomy or complete
runtime enforcement.

## Complexity Must Be Earned

Start with the workload, not an agent topology. A named requirement must earn
each added capability or boundary. Deterministic implementation is a first-class
result; reasoning, domain context, skills, subagents, services, MCP, state, and
infrastructure are options, not prerequisites.

**Complexity must be earned continuously, including by Golden Path itself.**
The repository is a workload for its own engineering loop, not an exemption from
it. Evidence may justify adding, changing, retaining, consolidating, replacing or
removing a mechanism. The [bootstrap evolution](engineering/adr-bootstrap-minimum.json)
demonstrates simplification, not a component list that future designs must preserve.
Self-governance means applying the same doctrine and human decision boundaries to
this system; it does not authorize autonomous self-modification.

**Stop at the lowest level that satisfies the workload.** This is not a maturity
model: higher complexity is not better. Capability count does not imply agent
count; reasoning does not imply agency; tools do not imply agents; context
separation does not automatically require agent separation. See
[earned architecture](docs/golden-path.md#earned-architecture) for the distinctions.

## Begin with an Outcome

Choose [local VS Code](docs/getting-started.md#use-local-vs-code) or
[browser-based Codespaces](docs/getting-started.md#use-codespaces-in-your-browser).
With the repository open and Copilot ready, describe your problem in a new
**Agent** session using the default Copilot agent:

> I want to build something that helps our support engineers resolve complex
> customer issues faster.

You do not need to choose technology or fill in a technical template first.
The [Getting Started guide](docs/getting-started.md) covers account access,
workspace trust, examples for other kinds of work, and how to describe changes
as your needs evolve. Copilot access and Codespaces usage are separate;
neither grants permission to change customer systems.

The repository provides the engineering instructions and the governing
`golden-path` skill with selectively loaded supporting references. A specialized
**Golden Path Engineer** is also available as an explicit entry point, not a
prerequisite. The discipline belongs to the engineering environment: versioned
intent, procedures, contracts, validation and review, not just a custom agent's
prompt.

For local repository checks, use Node 24 LTS and Git. These are validation tools,
not a runtime choice for future workloads:

```sh
npm ci --ignore-scripts
npm run check
npm run trace -- wl-engineering
```

Verify instruction and skill discovery in your installed VS Code version.
No editor extension or model is pinned by this repository.

## Engineering State and Responsibility

**Skills teach the engineering system how to perform work. Engineering state
records what has been decided must be true. Implementation realizes those
decisions. Evidence tells us whether those decisions produced the intended result.**

Domain expertise supplies reusable knowledge without necessarily being an
independently invocable procedure. Skills and context do not grant authority or
establish approved intent. Passing implementation tests does not by itself prove
engineering alignment or a business outcome. See the
[state model](docs/golden-path.md#state-model) and
[forms of proof](docs/golden-path.md#prove-release-and-run).

Git history records what changed, its attributed author and when. This repository
explores **GitHub as an engineering system of record for why it was built**:
which requirements earned the architecture, which decisions authorized it, what
evidence supports it, and why it was later changed or removed. This is an
architectural model demonstrated by the repository, not a claim about a built-in
GitHub product capability.

## Repository Map

| Artifact | Purpose |
| --- | --- |
| [Getting Started](docs/getting-started.md) | Plain-language starting prompts, changed requirements and optional engineering questions |
| [Engineering workload](engineering/wl-engineering.json) | Entry point to canonical individually versioned artifacts; no centralized ledger |
| [Approved evolution decision](engineering/adr-bootstrap-minimum.json) | Why seven skills and centralized state were simplified after review |
| [Contract schema](contracts/engineering.schema.json) | Closed, versioned record shapes |
| [Golden Path](docs/golden-path.md) | Architectural doctrine, earned complexity, state responsibilities, traceability, authority, proof and learning |
| [Invariant coverage](docs/invariants.md) | What automation enforces and what still requires judgment |
| [Behavioral evaluation](evaluations/bootstrap.md) | Architecture, authority and progressive intent scenarios with an evidence rubric |
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
The [Golden Loop](docs/golden-path.md#golden-loop) promotes evidence-backed
learning through engineering artifacts and review, not uncontrolled runtime
self-modification.

Before relying on CI as a merge gate, a repository administrator must configure
required status checks and reviewer protections, especially for governance,
contracts, validation code and workflow changes. The scaffold cannot grant or
configure those permissions locally.

**The Golden Path does not prescribe the architecture. It provides an engineering
system in which architecture is derived from workload requirements, complexity
must earn its place, agents operate within explicit boundaries, and evidence
determines whether the resulting system works.**