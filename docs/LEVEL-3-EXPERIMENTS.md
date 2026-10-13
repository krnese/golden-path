# Level 3: learning and measurement (docs only)

Level 3 has no code. If you want to know whether Golden Path helps on your work, run a matched experiment with the tools you already have. The retired Python runner is in [archive/research-runner](../archive/research-runner/README.md); revive it only for a specific, approved experiment.

## A matched experiment

1. **Question and decision first.** Write down what you'll decide from the result ("adopt L2 for team X if …") and the primary comparison: Golden Path vs your plain agent setup.
2. **Fixed tasks and fixed baseline.** Pick real tasks with acceptance tests the agent can't edit. For each task, record the baseline commit SHA **before** the subject runs. Score against that SHA, never the subject's final HEAD.
3. **Matched arms.** Same model, client version, task text, time limit and repository state. Only the arm changes. Alternate or randomize the order, and repeat each task at least 3 times per arm.
4. **Run with native tools.**
   - One branch or worktree per run (`git worktree add ../run-<arm>-<n> <baseline-sha>`).
   - Keep the agent transcript the client gives you (chat export or session log).
   - Run the same CI on every run's branch. With L2, `gate.mjs check --base <baseline-sha>` gives the checks, and `.golden-path/ledger.jsonl` gives gate events.
5. **Score from evidence, per run:**
   - Acceptance tests pass at the baseline-protected content.
   - `git diff <baseline-sha> -- <acceptance paths>` is empty.
   - Count protected-test removals and assertion drops.
   - Time to green and human interventions.
   - Report any ledger `outcome: UNVERIFIED` and any run with no gate record (hook timeout, fails open) as **UNVERIFIED**, never as pass or red.
6. **Report honestly.** Per-arm counts with n, the failures, what was unverified, and "inconclusive" when the arms don't differ beyond run-to-run noise. Lessons on/off measures only the benefit of retained lessons; the vs-plain comparison is primary.

Scripts can't tell whether the tests represent customer needs. Passing them doesn't prove business correctness, deployment readiness or authorisation.
