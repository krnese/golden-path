# Level 3: learning and measurement (docs only)

← [Golden Path README](../README.md) · [Documentation index](../README.md#documentation)

Level 3 has no code. If you want to know whether Golden Path helps on your work, run a matched experiment with the tools you already have. The retired Python runner is in [archive/research-runner](../archive/research-runner/README.md); revive it only for a specific, approved experiment.

## The question in everyday terms

**Can someone delegate a real change, keep control of what matters, and understand
the evidence well enough to decide whether the result is right?**

For a business reader, success means the intended result is visible and important
rules have not quietly changed. For an engineer, it means the agent understands
the existing system, respects its constraints, and produces a reviewable change
with evidence tied to the version being reviewed.

The [ambient intelligence post](https://github.blog/news-insights/company-news/the-next-developer-interface-is-ambient-intelligence/)
motivates this question: as starting and resuming agent work becomes easier, the
agreement and evidence must survive outside the conversation. It is not evidence
that Golden Path improves outcomes.

**Status: proposed experiments, not new results.** The
[evidence summary](evidence.md) describes what has actually been observed. This
roadmap adds no runtime, required paperwork or permission to merge or deploy.
Use existing issues, repository documents, PRs and checks.

### A few terms

| Term | Meaning here |
| --- | --- |
| Brownfield | An existing system with behavior, dependencies and decisions that must be understood before changing it |
| Acceptance | Examples of a good result, approved by the person responsible for the business rule, and the executable tests made from them |
| Fresh session | A new agent conversation without the earlier chat; it must recover the necessary context from the repository and named authoritative sources |
| Traceability | Being able to follow an agreed example to its test, actual output and the version checked |
| Harness | The application that runs the agent and its tools, such as Copilot in VS Code |
| Contract | Shorthand for the agreed outcome, constraints, permitted effects and acceptance; not a new file format or a grant of authority |

## Experiment roadmap

P0 means start here; P1 means extend the workflow after learning from P0; P2 means
test broader settings when a real workload justifies them. These are priorities,
not product levels or new approval gates.

Each row is a **claim to test**, not something a single successful run proves.

| Priority | Experiment | Business question | Engineering evidence to seek |
| --- | --- | --- | --- |
| P0 | Understand an existing repository | Does the agent know what must stay true before changing anything? | Source-backed explanation of the relevant execution path, dependencies, existing helpers, constraints and tests; independent review checks it against the system |
| P0 | Start a fresh session | Can work continue without someone remembering the previous chat? | A new session reconstructs the current agreement, acceptance version and open decisions without a recap or access to the earlier transcript |
| P0 | Follow intent through to evidence | Can the owner see whether the requested result happened? | Each example maps to a test and actual output, with the checked revision, CI links and uncovered cases |
| P1 | Issue to investigation to PR to evidence | Can the whole loop support an owner decision and a useful follow-up? | Linked records preserve intent and ownership through investigation, implementation, review and a separately approved acceptance revision where needed |
| P1 | Change existing architecture safely | Can we improve the system without breaking what people rely on? | A meaningful change preserves agreed compatibility and operational constraints, with relevant regression and integration checks |
| P1 | Try another model or harness | Does the agreement survive a change of agent environment? | The same approved task and examples work in selected environments; differences in tools, hooks and enforcement are recorded, not assumed away |
| P2 | Work across repositories | Can several teams keep one outcome coherent? | Named ownership, compatible revisions and integration evidence cover the combined result and a partial failure, not just green checks in each repository |
| P2 | AI work that needs Microsoft Foundry | Can real requirements lead to the right specialised platform? | Compare simpler alternatives; use Foundry only where the workload justifies its capabilities, with approved access, cost and operating constraints |
| P2 | Broader non-AI work | Does the method help ordinary software work too? | Complete useful non-AI changes without introducing AI infrastructure or unnecessary process |

**Use a non-AI task in the first P0 pilot.** Keep broader non-AI validation in P2,
but do not wait until then to check that the method is not an AI-platform funnel.
Cross-environment and distributed success establish only the cases tested, not
universal portability or reliability.

## Keep the Golden Loop in the issue

**The issue is the shared thread, not just a ticket handed to an agent.** A
business reader should be able to open it and see what was requested, what was
learned, what changed, the actual result and which decision is still theirs.
An engineer should be able to follow its links to the exact acceptance, code
and checks.

Use an existing issue and its linked records; do not create a parallel tracking
system. The issue connects the evidence but does not replace authoritative
acceptance files, Code Owner review, CI or branch protection.

| Loop stage | What goes in the issue or a linked comment | Who is responsible |
| --- | --- | --- |
| Intent | Desired outcome in plain language, named owner, examples, what must stay true and permitted effects | Business owner states the need; engineer helps make constraints explicit |
| Investigation | Relevant behavior and source links, proposed scope, assumptions and consequential unknowns | Agent investigates; engineer reviews technical claims |
| Acceptance | Link to the separate acceptance-only change and the example-to-test table, then the approved revision | Owner approves meaning; engineer vouches for the translation into tests |
| Implementation PR | Link back to the issue and the approved acceptance baseline; summarize the bounded implementation | Agent and engineer work within the agreement; normal review still applies |
| Evidence returned | Expected versus actual output per example, checked revision, CI links, acceptance integrity and uncovered cases | Agent supplies evidence; engineer verifies technical claims |
| Owner judgment | Meets the need, needs revision, or cannot yet be judged, with reasons | Business owner judges the outcome; this is separate from permission to merge or deploy |
| Next intent | A linked follow-up issue for a changed need; record any acceptance revision separately | Owner decides the next outcome rather than silently moving the current target |

Do not treat an issue edit, a comment or an agent's summary as authorization to
change protected acceptance. Surface conflicts as delegation changes. Preserve
the history: append corrections and identify superseded decisions rather than
rewriting the record to make earlier work look approved.

For the pilot, keep the owner judgment visible before marking the outcome
accepted. A PR auto-closing an issue or a green check is not that judgment;
use a non-closing reference while the decision is pending, or record the pending
decision explicitly in the team's existing workflow.

**Watch for automatic closing when an agent opens the PR.** In the cloud-agent
trial, the Copilot cloud agent intended a non-closing link, but the platform
appended `Fixes #38` to its PR description and GitHub linked the PR as closing
the issue. Merging closed the issue before the owner had recorded a judgment
(see the [cloud-agent trial](evidence.md#cloud-agent-golden-loop-trial-2026-10-26)).
Until a better control is shown to work, use one of these:

- **Judge before merging.** The owner records "meets the need", "needs revision"
  or "cannot yet judge", with reasons, on the issue or the PR before it is merged.
  Closing on merge is then harmless.
- **Remove both closing links before merging.** Delete the `Fixes`/`Closes`
  keyword from the PR description, and check that the issue is not linked in the
  PR's **Development** sidebar, which can also close the issue on merge.
- **If the issue closed anyway, reopen it** and record the pending decision, as
  was done for #38.

This is guidance, not enforcement. Whether a repository should automate it is an
open question for a later decision.

**Agent evidence must reach the PR.** In the same trial, the agent's per-example
evidence and its warning about the closing link appeared only in its session log,
not in the PR description or comments a reviewer reads. When an agent says "the
evidence is in the PR", check that it is. If it is missing, ask for it on the PR
or retrieve it from the session (for example with `gh agent-task view <session-id> --log`).

The current validation is recorded in [issue #35](https://github.com/krnese/golden-path/issues/35).
It was opened after documentation work began, so it is not evidence that an
issue initiated that work. A separate-context reading probe and scripted checks
are preparation for the full pilot, not a completed issue-to-implementation loop.
The [validation rehearsal results](evidence.md#issue-linked-validation-rehearsal-2026-10-26)
separate observed mechanism behavior from the real-workload claims still untested.

## First pilot: one existing system, one bounded change

This is a feasibility pilot: can the workflow run and produce understandable
evidence? It does not by itself measure Golden Path's incremental benefit.
Use the matched comparison below for that separate question.

### Choose the work and the people

Pick a real non-AI change in an existing repository with working baseline checks.
For example, change a report's explanation while preserving its existing
calculations and external format. That is an illustration, not supplied
acceptance or a task already selected for this pilot.

- **Business owner:** states the outcome, approves the meaning of examples and
  judges actual output. This does not require reviewing test code.
- **Engineer:** checks the examples' translation into tests, reviews the agent's
  understanding of the system, and verifies technical evidence.
- **Agent:** investigates and implements within the agreed boundary; it does
  not approve its own acceptance changes.

One person may fill both human roles, but record that limitation. Keep existing
review and authorization requirements. Do not deliberately break controls in a
live repository; use a disposable environment for scripted failure checks.

### Run the three P0 experiments together

| Step | What to do | Evidence to keep in existing records |
| --- | --- | --- |
| 1. Intent | Owner states the desired result and something that must not change. Agree examples and how the owner will judge actual output. | Task reference, named owner, examples and permitted effects |
| 2. Context | Agent investigates before editing implementation. Engineer checks its account of the relevant behavior and dependencies. Separate facts from assumptions and unknowns. | Source references and review corrections; a fluent summary alone is not success |
| 3. Boundary | Put only missing, durable context in the repository record that owns it. Link current decisions, constraints and unresolved questions; avoid copying the chat or solution hints. | Record revision and authoritative links, not a second specification |
| 4. Acceptance | Prepare and approve executable examples in a separate change before implementation. Engineer verifies the translation; owner approves the example-to-test meaning. | Example IDs, test mapping, approved acceptance revision and baseline check results |
| 5. Fresh session | Start from the latest approved acceptance in a new conversation. Give the task reference, not a chat recap. Before editing, have the agent reconstruct the agreement and check source freshness. | Reconstructed account, sources and any missing or stale context; operator assistance counts as an intervention |
| 6. Implementation | Agent makes the bounded change, preserves protected acceptance and existing tests, and adds developer tests separately. | Change, common CI results, acceptance integrity and actual output at the candidate revision |
| 7. Report | Return expected and actual results side by side. Owner judges the result and engineer verifies technical claims. | Owner decision, technical review, uncovered cases, effort and unresolved uncertainty |

Do not secretly supply the prior transcript through retained session memory.
If the environment cannot exclude it, report the fresh-session result as
unverified. A repository summary is not current approval: check the authoritative
sources. An owner acceptance revision requires a new implementation session;
never silently adopt it inside the existing one.

Agree which reconstruction errors are material before scoring. If the engineer
must correct the fresh session, record the initial failure or intervention
before continuing; a repaired run is not an unassisted success. Missing a
dependency, treating a proposal as approval, or using stale acceptance are
examples of failures worth reporting, even if the final code passes tests.

### Make the result understandable

Use a compact comparison in the existing PR or review record:

| Agreed example | Expected result | Actual result at the checked revision | Evidence and gap |
| --- | --- | --- | --- |
| Owner's example ID and plain-language description | Owner-approved behavior | Real output, not a mock-up or the agent's assurance | Test/check link and anything that result does not establish |

Alongside it, name the task, starting and candidate revisions, acceptance
revision, authoritative CI results, owner decision and engineer review. Label
illustrations as illustrations. If CI has not run, say so; local checks are
not the PR's check record.

Keep three judgments separate:

- **Observed:** what happened, including failures and human interventions.
- **Met the examples:** whether the fixed tests and actual-output comparison
  support the agreed examples.
- **Owner decision:** whether the result meets the need, needs revision or
  cannot yet be judged. Passing examples do not make this decision.

Report P0 results separately for understanding, fresh-session recovery and
traceability. One combined success does not establish that each element helped.
Missing evidence is **UNVERIFIED**; inadequate evidence to distinguish approaches
is **INCONCLUSIVE**, not proof of equivalence. Use the existing FAILED and
UNVERIFIED mechanism outcomes when reporting gate records.

Record preparation, setup, execution, review and rework effort, including work
done before the fresh session. The owner and engineer choose acceptable thresholds
before the pilot; there is no universal time-saving or adoption threshold.

### Let findings choose the investment

| Finding | Next investment to consider, not an automatic requirement |
| --- | --- |
| Important constraints were missed | Better access to authoritative sources and a more focused investigation procedure |
| A fresh session could not recover the agreement | Clearer durable records and freshness checks, not more transcript copying |
| The owner could not judge completion | Better actual-output comparisons in existing review surfaces |
| Setup or false blocks consumed the benefit | Simpler configuration and clearer recovery guidance |
| Another host changed enforcement | A narrow adapter and host-specific checks, not a portability claim |
| Ordinary practice worked just as well with less effort | Keep ordinary practice; do not build more tooling to manufacture a difference |

The next decision is to adopt, refine, investigate further or keep current
practice. Moving to P1 or P2 should answer a real unresolved question, not merely
complete the roadmap. A feasibility result is not a productivity finding.

## Start with the adoption question

For an engineering lead and a domain owner, the first useful question is whether the kit
makes owner-controlled acceptance easier to adopt and maintain. It is not automatically
whether agents produce better code. Use the [adoption checklist](ADOPTION.md) for the
workflow being evaluated; this guide is a proposed evaluation, not a report of a completed pilot.

Choose bounded real tasks from an existing repository and name the domain owner and developer.
Use separate people where possible. If one person fills both roles, record that limitation.
Before the pilot, the owners record:

- The decision the result will inform: adopt, refine the setup, or keep current practice.
- The primary measure and acceptable tradeoffs, including their own adoption thresholds.
- Which business judgments will require actual-output review rather than executable tests.
- Which evidence is required and what will count as unverified or inconclusive.

Do not invent universal adoption thresholds or omit drafting/review effort from the cost.

## Compare with competent existing practice

Keep the plain-agent comparison, but distinguish it from a claim that the kit adds value
over a well-configured repository:

| Arm | Setup | Question it addresses |
| --- | --- | --- |
| A: current plain agent | Current agent setup, with Golden Path absent and existing controls retained | Does adding the kit improve on this team's actual starting point? |
| B: competent practice | Plain agent with the same owner-approved acceptance, CODEOWNERS, required tests and review as arm C; no Golden Path guidance or hooks | Is the kit easier or more useful than assembling the ordinary controls? |
| C: Golden Path | The same accepted examples and conventional controls, plus L2 guidance and local hooks | What incremental value or friction does the kit introduce? |

**C versus B is the primary comparison for incremental kit value.** C versus A describes
the change from current practice, which may also include better requirements or repository
setup. If A already matches B, use two arms rather than duplicating the baseline.
Never weaken existing controls to manufacture a kit advantage.

Record intended treatment differences before running subjects. Common CI commands, ownership
and review policy remain equivalent between B and C. If a separate study evaluates the kit's
authorized-revision CI flow, declare that additional treatment explicitly rather than
attributing its effect to the local hooks.

## A matched experiment

1. **Question and decision first.** Record the comparison, primary measure and owner's adoption criteria using the sections above.
2. **Fixed tasks and fixed baseline.** Freeze owner-approved acceptance outside candidate control. Record the starting commit SHA **before** each subject runs and any setup-only differences between arms. Score against the frozen acceptance, never the subject's final test content.
3. **Matched arms.** Same model, client/harness version, task text, execution budget, starting implementation and accepted examples. Only the declared treatment changes. Alternate or randomize the order, and repeat each task at least 3 times per arm. Do not pass solutions or review discoveries from one subject to another.
4. **Run with native tools.**
   - One branch or worktree per run (`git worktree add ../run-<arm>-<n> <baseline-sha>`).
   - Keep the agent transcript the client gives you (chat export or session log).
   - Run the same common CI on every run's branch. Independently evaluate each candidate against the frozen owner-approved tests and compare acceptance files with its recorded baseline in every arm. Candidate-edited tests are not the scoring authority.
   - With L2, `gate.mjs check --base <baseline-sha>` and `.golden-path/ledger.jsonl` provide supplemental mechanism evidence. Do not require kit files in the control arms or score them using a candidate-modified gate.
5. **Score from evidence, per run:**
   - Acceptance tests pass at the baseline-protected content.
   - `git diff <baseline-sha> -- <acceptance paths>` is empty.
   - Count protected-test removals and assertion drops.
   - Time to green and human interventions.
   - Report any ledger `outcome: UNVERIFIED` and any run with no gate record (hook timeout, fails open) as **UNVERIFIED**, never as pass or red.
6. **Report honestly.** Per-arm counts with n, failures, unverified results and "inconclusive" when the arms do not differ beyond run-to-run noise. Lessons on/off measures retained lessons, not the whole kit. Small samples or equal outcomes do not establish equivalence.

## Measure the owner/developer workflow too

Measure setup usability separately from matched execution; a cloned, preconfigured worktree
cannot tell you how hard installation was. For each workflow record:

| Measure | Evidence |
| --- | --- |
| Setup effort and completion | Operator steps, interventions and which adoption conditions were verified |
| Acceptance preparation | Effort to draft examples/tests and for the owner to understand and approve them |
| Review effort | Developer and owner effort to inspect the PR and actual-output comparison |
| Time to a reviewable result | Elapsed time with the same definition of reviewable across arms; include unresolved exceptions |
| Acceptance changes | Attempted or completed changes, where detected, and whether owner-authorized |
| False blocks and interventions | Reasons, affected work and recovery actions |
| Uncertainty | FAILED/UNVERIFIED outcomes, missing hook records and unperformed client checks |
| Reuse decision | Whether participants understand the evidence and choose to use the workflow again |

Use existing issues, review comments, Git, CI and exported transcripts. Remove customer data and
secrets before publishing; keep sensitive evidence within its existing authorized boundary.
No dashboard, research runtime or new tracking system is required.

## Keep mechanism checks separate

Injected edits in a disposable demo can test refusal, fixed-baseline integrity, retry exhaustion
and authorized revisions. Report these as scripted mechanism checks, not naturally occurring
agent behavior. The [trial](examples/golden-loop/README.md) did not observe the agent trying to
tamper with acceptance.

Passing the kit's own tests demonstrates specific implementation behavior. A successful pilot
could support easier adoption or lower review effort within its sample. Neither alone supports
general productivity, customer demand, universal reliability or compliance claims.

Scripts can't tell whether the tests represent customer needs. Passing them doesn't prove business correctness, deployment readiness or authorisation.

---

← Previous: [Level 2 reference: checked completion](LEVEL-2.md)
