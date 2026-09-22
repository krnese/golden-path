# Getting Started: Describe the Problem

**Don't architect your prompt.**

You do not need to choose an architecture, AI model, agent pattern, skill, MCP
server, workflow, or Microsoft service before you begin. Start by describing
what you are trying to achieve in normal language.

**You bring the intent. The Golden Path brings the engineering discipline.**

## Your First Prompt

Open this repository in VS Code with GitHub Copilot. Select **Golden Path
Engineer** in chat and try:

> I want to build something that helps our support engineers resolve complex
> customer issues faster.

The repository instructions also apply to the default Copilot agent. If you need
help opening the repository or setting up Copilot, ask a teammate; the
[README](../README.md#begin-with-an-outcome) has the repository setup details.
You do not need to run validation commands to describe your problem.

Expect a conversation, not an immediate technology selection. The Golden Path
should help clarify who benefits, where work is difficult, and what improvement
would count as success. For example, it might ask where engineers lose the most
time or ask you to describe one representative incident.

**Users describe intent, requirements, constraints, and what changes. The
engineering system determines what architecture those requirements earn.**

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
