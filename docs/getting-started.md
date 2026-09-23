# Getting Started: Describe the Problem

**Don't architect your prompt.**

You do not need to choose an architecture, AI model, agent pattern, skill, MCP
server, workflow, or Microsoft service before you begin. Start by describing
what you are trying to achieve in normal language.

**You bring the intent. The Golden Path brings the engineering discipline.**

## Your First Prompt

With the repository open in VS Code and Copilot ready, start a new **Agent**
session using the default Copilot agent and describe your outcome:

> I want to build [describe the outcome and who it helps]. Start from the outcome
> and use the engineering system in this repository to determine the requirements
> and simplest justified architecture. Do not assume technologies, agents, skills,
> tools, workflows or platforms unless the workload earns them.

A plain sentence is also enough, for example:

> I want to build something that helps our support engineers resolve complex
> customer issues faster.

The repository supplies the engineering instructions and Golden Path skill, so
the generic default Agent is the canonical entry point. You do not need to select
a custom agent. **Golden Path Engineer** is available as an optional focused
entry point if you prefer; it is not required for Golden Path behavior.

Your fork or clone becomes the engineering environment for your own project.
A fresh fork contains the engineering discipline but no assumptions about what
you are building: Golden Path's own framework state is in `engineering/`, and your
project's state is recorded in `project/` as your outcome is established. Upstream
framework approvals never approve your project's decisions.

Not set up yet? Choose [local VS Code](#use-local-vs-code) or
[Codespaces in your browser](#use-codespaces-in-your-browser) below.
You do not need to run validation commands to describe your problem.

Expect a conversation, not an immediate technology selection. The Golden Path
should help clarify who benefits, where work is difficult, and what improvement
would count as success. For example, it might ask where engineers lose the most
time or ask you to describe one representative incident. It should ask only what
changes its next decision and state reasonable assumptions for the rest. Once it
understands enough, it summarizes that understanding, asks you to confirm when it
inferred what success means or what you want produced, and records your project
in `project/` for you. You do not need to learn its record formats. When you ask
it to build, your code goes into its own directory.

For smaller requests such as "I need a script to clean up files", it should
establish the relevant behavior and whether you want an example, saved and tested
code, or an executed result. It should reuse answers and repository context,
not require a full questionnaire when the task is already clear. As the
conversation progresses, new needs such as scheduling or production use should
trigger focused questions about the changed scope, not restart discovery.
Asking why something was done is not approval to change it; asking to stop
should stop pending work. Preparing code does not authorize external execution.

**Users describe intent, requirements, constraints, and what changes. The
engineering system determines what architecture those requirements earn.**

## Before You Begin

You need a GitHub account with Copilot access. If your employer supplies it, use
the account assigned that access and follow your organization's policies.
A paid plan is not a stated prerequisite: Copilot Free offers limited access,
and features, models and allowances vary. Check the current
[Copilot plans](https://docs.github.com/en/copilot/get-started/plans).

Repository access, Copilot access and permission to push changes are separate.
No Azure subscription, separate model API key, MCP server or production
credentials are required for this starting experience.

Begin with fictional or redacted examples. Follow your organization's rules
before sharing internal code, customer details or logs with an AI service.
See the [Copilot Trust Center](https://resources.github.com/copilot-trust-center/)
for data-handling information.

### Use Local VS Code

1. Install a current VS Code release and
   [set up Copilot](https://code.visualstudio.com/docs/setup/copilot).
2. Fork or clone this repository and open its root folder in VS Code.
   Viewing its GitHub page alone does not load the local engineering environment.
3. Review any workspace-trust prompt. Trust the folder only if you trust its
   contents; AI features may be unavailable in Restricted Mode.
4. Confirm Copilot is signed in with the intended account and **Agent** is
   available. Start a new chat with [the first prompt](#your-first-prompt).

You do not need to select Golden Path Engineer or enable blanket tool
auto-approval. Review requested commands and permissions as they arise.

### Use Codespaces in Your Browser

Codespaces supplies a remote computer and browser-based VS Code; Copilot supplies
AI assistance. You need access to both. Codespaces compute and storage usage are
separate from Copilot allowances. Confirm who pays and review
[Codespaces billing](https://docs.github.com/en/billing/concepts/product-billing/github-codespaces)
before creating one. Organization policies may restrict either service.

1. On your fork's GitHub page (or this repository's, to try it first), choose **Code -> Codespaces** and create a
   codespace on the intended branch. For a first conversation and these repository
   checks, the smallest available machine is a reasonable starting point.
2. Wait for the remote connection and environment setup to finish. The editor
   appearing does not mean the terminal and Copilot are ready yet.
3. Review the workspace-trust prompt for this repository, then complete Copilot
   sign-in if requested. Confirm the default **Agent** is ready.
4. Send [the first prompt](#your-first-prompt). No custom agent is required.
5. When finished, **stop the codespace explicitly** from the
   [Codespaces dashboard](https://github.com/codespaces). Closing a tab is not a
   reliable way to stop compute usage. Stopped codespaces still use storage;
   preserve needed work before deleting one.

Codespaces is different from opening a repository in github.dev: it provides
compute and a terminal for running checks. No repository-specific dev-container
configuration is supplied yet, so do not assume the default image will always
provide the required tools or versions. See the
[official Codespaces guide](https://docs.github.com/en/codespaces/quickstart).

### Optional: Run Repository Checks

For either environment, check `node --version` before running the
[README validation commands](../README.md#begin-with-an-outcome). This repository
requires Node 24 LTS and Git; install or select that version if necessary.
`npm ci --ignore-scripts` installs the locked validation dependencies. These
tools are needed for checks, not for the first conversation.

Saving changes locally does not publish them. Commit your project work to your
own fork or branch. Proposing changes to Golden Path itself is separate: use a
pull request to the upstream repository with the appropriate permissions.

### If Setup Does Not Work

| Symptom | What to check |
| --- | --- |
| Copilot or Agent is unavailable | Account selection, Copilot access, organization policy and workspace trust. Ask your administrator rather than bypassing restrictions. |
| Blank terminal or "Getting chat ready..." | Wait for remote setup to finish; inspect setup status and notifications if it persists. A visible editor alone is not a readiness check. |
| The assistant appears unaware of the Golden Path | Confirm the repository root is open and inspect available instruction/skill discovery diagnostics and chat activity in your VS Code version. Restart with a fresh chat after correcting setup. |
| Copilot stops accepting requests | Check usage allowance, billing and organization policy; repository access does not provide extra Copilot usage. |
| Codespaces CLI creation reports a missing scope | CLI credentials are separate from browser sign-in. Use the browser path or explicitly review the requested credential scope; do not broaden it silently. |
| Checks report a local editor settings file as unbound | Expected and tolerated when the file is Git-ignored; see the local-settings note below. |

Seeing a skill read in chat activity is evidence of discovery, not proof of all
engineering behavior. An assistant's claim that it followed instructions is not
sufficient verification on its own.

Personal workspace settings, including terminal auto-approval preferences, are
not shared Golden Path prerequisites. The root `.vscode/settings.json` is ignored
by Git to prevent accidental sharing. The repository inspector still lists it as
unbound, but the repository test tolerates Git-ignored personal files, so it does
not make `npm run check` fail. Git-ignored scripts, `.github/` customizations and
agent instruction files are never tolerated, because local agents may still load
them. Do not register personal approvals as shared governance.

## Five Ways to Begin

For each request, the Golden Path should clarify the outcome, break the work
into manageable responsibilities, identify requirements and success criteria,
and derive the simplest justified design. You do not need to supply all the
answers up front.

### Helping a Support Team

**What you say**
> I want to help our support engineers resolve complex customer issues faster.

**What the Golden Path does:** Finds the slowest part of an investigation,
separates gathering information from interpreting it, and agrees how to measure
improvement before choosing a design.

**Why:** You know the support problem; you should not need to design an agent team.

### Building an Internal Application

**What you say**
> Our team needs a simple way to request equipment and see whether it is approved.

**What the Golden Path does:** Clarifies users, approval rules, records and
permissions, then defines what a successful request looks like and the simplest
application that supports it.

**Why:** Ordinary business rules may need ordinary software, not AI.

### Modernizing an Existing Application

**What you say**
> Our scheduling application is hard to maintain. I want to improve it without
> disrupting the people who use it.

**What the Golden Path does:** Asks what is difficult today, identifies behavior
that must be preserved, and defines safe, testable improvements before considering
a replacement or migration.

**Why:** Modernization should solve your actual problems, not assume a rewrite.

### Automating Repetitive Work

**What you say**
> Every Friday we copy numbers from several reports into a spreadsheet. I want
> to reduce that manual work.

**What the Golden Path does:** Clarifies the sources, calculations, exceptions
and access rules; defines acceptable accuracy and time savings; then considers
the simplest repeatable automation.

**Why:** A known sequence of steps does not automatically need an agent.

### Using Organizational Knowledge

**What you say**
> I want employees to find reliable answers in our internal guidance.

**What the Golden Path does:** Identifies trusted sources, who may read them,
how current answers must be, and how to check correctness before choosing how
to find and explain the information.

**Why:** You should not have to select search technology or an AI model first.

## Use the Level You Understand

### Level 1 - I Know the Outcome

Describe what you want to achieve. The Golden Path helps establish the workload
(the work the system needs to do) and should ask only questions that materially
affect engineering decisions. "I don't know yet" is a useful answer.

Share what you can: your desired outcome, representative examples, constraints,
success criteria, domain expertise, changed requirements, feedback and evidence.
Do not include credentials or sensitive customer information in examples.

### Level 2 - I Know What Needs to Change

After something has been built, describe a new requirement, constraint, failure,
performance target, policy or piece of domain expertise. The Golden Path should
evaluate the impact and change the design only when necessary.

**Instead of**
> Add three subagents so these investigations can happen in parallel.

**Prefer**
> These investigations are independent once the incident scope is known. They
> currently execute sequentially in about 25 seconds, and the requirement is to
> complete the investigation in under 10 seconds.

The engineering system should decide whether this earns parallel execution,
concurrent tools, another reasoning boundary, a subagent or something simpler.
It should test the complete result, not assume parallel work meets the target.
These numbers illustrate a request; they are not measured repository results.

**Instead of**
> Create a skill for App Service incidents.

**Prefer**
> App Service availability investigations require a repeatable diagnostic
> procedure: establish the failure window, review recent changes, compare
> application and platform signals, and record missing evidence.

Bring the actual procedure and explain where it needs to be reused. The system
should evaluate whether it belongs in domain context, a skill, deterministic
logic or another capability. Naming a procedure does not settle its packaging.

### Level 3 - I Want to Inspect or Challenge the Engineering

This level is optional. Architects and engineers can ask:

- What requirement earned this architecture boundary?
- Could this remain deterministic?
- Why is this a skill rather than context?
- Why does this require another agent?
- What additional operating responsibility does this decision introduce?
- What authority does this capability have?
- What evidence supports this decision?
- Show the traceability from the implementation back to the workload.

You do not need to understand these terms to start or to explain what is wrong.
For the reasoning behind them, see [earned architecture](golden-path.md#earned-architecture).

## How Requirements Can Change the Design

These examples describe intended behavior, not guaranteed results, approved
designs or a ladder you should climb. They are not magic phrases for obtaining
more agents.

| What you tell the system | Expected behavior |
| --- | --- |
| "I want to help support engineers diagnose incidents faster." | Establish the workload and measurable outcome before choosing technology. |
| "Some incidents contain ambiguous and contradictory evidence that requires interpretation." | Re-evaluate the needed capabilities. Reasoning may be justified, but an agent is not automatically required. |
| "We have a reusable evidence-quality procedure that must produce a structured assessment and be independently reusable across different investigations." | Evaluate whether a reusable procedural capability, such as a skill, is justified instead of context or ordinary code. |
| "An infrastructure investigation must adaptively choose diagnostic capabilities based on what it discovers, maintain its own bounded context, and return an evidence-backed result." | Evaluate whether a delegated agent boundary is justified; compare simpler options and define limits and proof. |

**Architecture follows requirements. Complexity must be earned.**

You should not need to know whether work should be deterministic or AI-driven,
whether reasoning needs a model call or an agent, whether expertise belongs in
context or a skill, whether a capability needs a tool or MCP, whether parallel
work needs subagents, or which Microsoft product should implement it. Those are
engineering decisions made after the work is understood.

Describing a desired result is not permission for unrestricted action. Expect
explicit discussion of access and approval before consequential changes. The
system should explain its choices and limitations in language you understand.
Passing software tests is not the same as showing that your problem improved.

## Go Deeper Only When You Need To

- [Golden Path governance](golden-path.md) explains architectural decisions,
  authority and evidence.
- [Invariant coverage](invariants.md) explains what repository checks enforce
  and what still needs review.
- [Bootstrap evaluation](../evaluations/bootstrap.md) describes how intended
  assistant behavior can be assessed; it does not claim completed evaluation.

**Start with the problem, not the architecture. Describe what you need in the
language you already understand. The Golden Path will help turn that intent
into an engineered system and introduce complexity only when the requirements
justify it.**
