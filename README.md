# From AI-Assisted Coding to Governed Agentic Engineering

The **Executable Microsoft AI Golden Path** is a **repository-based engineering
environment**, currently adopted by forking or cloning it. The repository provides
the engineering contract, agent guidance and procedures, machine-readable
engineering state, deterministic validation and governance structure.

Application architecture is derived from workload requirements, not prescribed
by Golden Path. V0.1 **does prescribe an engineering-state model and repository
organization**. Attaching Golden Path to an existing application repository is
not currently a solved capability.

> **Status: V0.1 experimental.** Golden Path is an experimental executable
> engineering system for deriving, governing, proving and evolving software
> architecture from workload intent. It is ready for engineers to try with their
> own workloads; it is not a proven or production-ready product. See
> [Maturity](#maturity-v01-experimental) for what is demonstrated and what is not.

## Quick Start

1. Fork or clone this repository and open its root folder in VS Code (or a
   Codespace). Your fork becomes the engineering environment for your own project.
2. Sign in to GitHub Copilot and start a new chat in **Agent** mode with the
   default agent. No custom agent, extension, cloud account or setup script is needed.
3. Describe the outcome you want in your own words, for example:

> I want to build [describe the outcome and who it helps]. Start from the outcome
> and use the engineering system in this repository to determine the requirements
> and simplest justified architecture. Do not assume technologies, agents, skills,
> tools, workflows or platforms unless the workload earns them.

**Don't architect your prompt.** You do not need to know whether you need an
agent, skill, MCP server, workflow, model, database or cloud service. Expect
questions about the problem before any technology choice. The
[Getting Started guide](docs/getting-started.md) covers account access, workspace
trust, Codespaces and examples.

You are not expected to understand or manually maintain Golden Path record formats:

- **You bring:** the outcome, constraints, domain knowledge, judgment, challenge
  and approval. You remain accountable for reviewing decisions and results.
- **The engineering agent is expected to:** maintain the records, trace decisions,
  run deterministic validation, and surface where additional evidence or human
  judgment is required.

**Intended progression, not demonstrated adopter success:**
describe an outcome -> clarify only what is necessary -> derive the workload and
requirements -> choose the simplest justified architecture -> build a useful
increment -> prove it against the agreed requirement.

For example, an equipment-tracking increment could record an assignment and show
who holds the item, then test that behavior against the requirement. The useful
result is working behavior with evidence, not just valid engineering records.
The [detailed mechanisms](#repository-map) remain inspectable, not prerequisites
for starting.

## Your Fork Is Your Engineering Environment

**A fresh fork contains the engineering discipline but no assumptions about what
you are building.** Canonical engineering state lives in two places:

- `engineering/` is Golden Path's own framework state: why the framework exists
  and how engineering is performed here. You normally leave it alone.
- `project/` is yours. It does not exist in a fresh fork. As Golden Path
  establishes your outcome, it records your workloads, requirements, decisions,
  capabilities, implementation boundaries, evaluations and evidence there, using
  the same schema and checks. You can have more than one workload.
- Your code lives in your own implementation directories (for example `app/`),
  each bound once from `project/`. Keep your application's own manifests,
  dependencies, scripts, tool configuration and README inside that directory
  (for example `app/package.json` or `app/pyproject.toml`). Do not edit the root
  `package.json`, `package-lock.json`, `.gitignore` or `README.md` for your
  project's needs: those belong to Golden Path's own tooling.

`npm run check` validates your `project/` state together with the framework and
runs any Node test files it finds; tests in other ecosystems run with their own
tooling. Its output reports your project artifact count and how your evidence is
classified. `npm run trace -- <your-workload-id>` shows your project's links.

**Framework provenance must not become adopter authority.** Decisions in
`engineering/` were approved by the upstream Golden Path maintainers for the
framework; they never approve your project's decisions. The validator enforces
this by rejecting references between `engineering/` and `project/`. See
[framework state and project state](docs/golden-path.md#framework-state-and-project-state).

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

Governance does not mean adding human approval to every operation. Instructions
and procedures guide agent reasoning; engineering state records what must remain
true. Deterministic validators enforce a defined structural subset, and GitHub
controls govern integration where configured. Generalized execution-time
**Action Admission remains experimental and unproven**, including interception
through the current Copilot Agent Host repository-hook path. See
[invariant coverage](docs/invariants.md) for the enforcement limits.

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
[browser-based Codespaces](docs/getting-started.md#use-codespaces-in-your-browser),
then use the [Quick Start](#quick-start) prompt in a new default **Agent** session.
Even a single sentence such as "I want to build something that helps our support
engineers resolve complex customer issues faster" is a valid start.

You do not need to choose technology or fill in a technical template first.
Copilot access and Codespaces usage are separate; neither grants permission to
change customer systems.

The repository provides the engineering instructions and the governing
`golden-path` skill with selectively loaded supporting references; the generic
default Agent is the canonical entry point. A specialized **Golden Path Engineer**
agent is also available as an optional, focused entry point, not a prerequisite.
The discipline belongs to the engineering environment: versioned intent,
procedures, contracts, validation and review, not a custom agent's prompt.

For local repository checks, use Node 24 LTS and Git. These are validation tools,
not a runtime choice for future workloads:

```sh
npm ci --ignore-scripts
npm run check
npm run trace -- wl-engineering
```

`wl-engineering` is Golden Path's own framework workload; trace your own workload
ID from `project/` to see your project's links.

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
| [Framework workload](engineering/wl-engineering.json) | Entry point to Golden Path's own canonical framework state in `engineering/`; no centralized ledger |
| `project/` | Your project's canonical state; created when your first outcome is established |
| [Framework/project boundary decision](engineering/adr-project-state-boundary.json) | Why forks keep framework state and adopter state separate |
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

The validator discovers one JSON artifact per stable ID in `engineering/` and the
optional `project/`,
rejects duplicate IDs, broken references, cross-boundary references and mirrored
relationship fields, and derives the graph in memory. It checks significant file
bindings (project implementations may bind a whole directory) and reports
incidental unbound files without requiring a registry entry for every file.
CI compares the base revision, runs tests and audits dependencies. It cannot
infer semantic architecture or hidden executable capability from arbitrary code.

## Maturity: V0.1 Experimental

The framework's own canonical workload is **engineering Golden Path itself with a
human and Copilot**. It uses AI during development, not in a deployed application.
A fresh fork has no project workload until the adopter establishes one.
The minimum framework architecture is **approved** by the upstream human requests
recorded in the consequential decisions. Repository implementations are **active**
under that approval; this is not a production deployment, proof of behavior,
permission for future writes, or approval of any adopter's project.

**Demonstrated in this repository today** (structurally, by `npm run check` and CI):

- Machine-readable engineering state: one typed artifact per stable ID
- Outcome -> workload -> requirement -> decision -> capability -> implementation
  and evaluation traceability, derived rather than mirrored
- Separate framework state (`engineering/`) and adopter project state (`project/`),
  with structural proof that framework approvals, policies and evaluations cannot
  authorize or satisfy project state, and that multiple project workloads coexist
- Earned-architecture decisions recording unmet requirement, alternatives and
  simpler-option assessment, including a completed simplification of this scaffold
- Authority semantics (READ through HIGH_IMPACT_WRITE) with write policy and
  authority-transition checks against a base revision
- Deterministic invariant validation and file- or directory-binding inspection
- Behavioral evaluation definitions and evidence conventions
- A platform-neutral governed-delivery contract and read-only admission gate,
  exercised with synthetic allow/deny fixtures

Separately, an [owner-approved upstream governance trial](engineering/evidence-external-governance-implementation.json)
records applied GitHub integration rules and a non-merging required-check
failure/recovery probe. This is platform evidence, not a result of `npm run check`,
proof of human judgment or automatic protection for forks. Final integration of
the governance change remains an owner decision.

**Unproven or intentionally absent:**

- Broad behavioral reliability. Most behavioral scenarios have not been executed;
  see the [evaluation status](evaluations/bootstrap.md) for what has actual evidence.
  One observation is never a reliability claim.
- That a fresh agent in a clean fork reliably establishes and persists the adopter's
  project state. W has one unscored baseline run recorded as a regression origin;
  W2 and X have not been run.
- Adopter implementations with installed dependencies inside their own directory
  (for example `app/node_modules`) on Linux or Codespaces: package managers create
  symbolic links there, which repository inspection may reject. Not yet tested.
- Upstream updates into forks, a project-owned landing README, and representation
  of agents inside the system being built
- Real physical deployment adapters and real external delivery execution
- Production enforcement, and external identity or authorization integration
- Runtime independence across agent products other than GitHub Copilot in VS Code
- Multi-engineer collaboration at scale and independent peer-review operation
- Business-outcome evidence from adopter workloads

The first Golden Path evolution is the review of this scaffold: one skill with
references replaced seven independent skills; canonical artifacts and derived
relationships replaced the ledger and mirrored links. The decision preserves
the rejected alternatives and reasoning, not obsolete implementation. Separate
change/learning registries were removed; Git, review and owning artifacts suffice.

Only four top-level exclusions are outside the file inventory: `.git`,
`node_modules`, `.local`, and `coverage`. Do not put authoritative code there.
Use ignored `.local/` for temporary transcripts and working notes; no temporary
reasoning automatically becomes engineering doctrine. Do not store secrets or
sensitive production payloads in Git or evaluation transcripts. The inspector
still reports Git-ignored personal files such as `.vscode/settings.json`; the
repository test tolerates them only when they are not scripts, `.github/`
customizations or agent instruction files.

The framework itself deliberately has no application, deployment, infrastructure,
MCP, runtime agent, database, orchestration, hook, or autonomous-improvement
directories; it adds them only when a framework requirement earns them. Your own
project's implementation directories are expected, and are bound from `project/`.
Significant implementation
and reasoning surfaces have one binding owner. Canonical artifacts own their
identities and relationships directly; no manifest or duplicate file registry
is maintained. Empty architecture directories are unnecessary.

## Trying It with Your Own Workload

External trials are the purpose of V0.1. Bring an end-to-end engineering problem
we did not anticipate, start from the [Quick Start](#quick-start) in a fresh
default Agent session, and observe whether the repository alone guides you from
outcome to requirements, simplest justified design, implementation and proof.
Use fictional or redacted data and no production credentials.

Useful observations include where it asked the right or wrong first question,
where it assumed technology or architecture the work had not earned, where it
stopped or continued inappropriately at an authority boundary, and what you had
to explain that the repository should already have known. Share them through a
**Trial report** issue; [CONTRIBUTING.md](CONTRIBUTING.md) explains what is most
useful, how to share evidence safely and how reports are used. A failure is evidence: it starts the
[Golden Loop](docs/golden-path.md#golden-loop) and should change the owning
artifact through review, not silently rewrite expected behavior.

Before relying on CI as a merge gate, a repository administrator must configure
required status checks and reviewer protections, especially for governance,
contracts, validation code and workflow changes. The scaffold cannot grant or
configure those permissions locally.

**The Golden Path does not prescribe the architecture. It provides an engineering
system in which architecture is derived from workload requirements, complexity
must earn its place, agents operate within explicit boundaries, and evidence
determines whether the resulting system works.**