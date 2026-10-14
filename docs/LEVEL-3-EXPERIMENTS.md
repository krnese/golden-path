# Level 3: learning and measurement (docs only)

← [Golden Path README](../README.md) · [Documentation index](../README.md#documentation)

Level 3 has no code. If you want to know whether Golden Path helps on your work, run a matched experiment with the tools you already have. The retired Python runner is in [archive/research-runner](../archive/research-runner/README.md); revive it only for a specific, approved experiment.

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
