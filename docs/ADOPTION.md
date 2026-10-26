# Adopt owner-controlled acceptance

[Golden Path README](../README.md) | [Level 2 reference](LEVEL-2.md)

For an engineering lead or developer working with a product/domain owner in an existing
repository. Start with one business rule, not a new platform or a complete acceptance suite.
This checklist uses existing Golden Path behavior; it does not configure GitHub settings for you.

## 1. Agree one bounded outcome

Choose a deterministic rule such as a discount, approval threshold or API contract.
Name the owner of its meaning and the developer responsible for implementation.
Record the intent, authoritative sources, allowed changes and what must stay true using
your existing task or issue.

The owner supplies concrete inputs and expected results. A developer or agent can draft
executable tests, but the owner approves what those tests mean before implementation begins.
Keep implementation separate from acceptance approval. A request to revise an agreed example
goes back to the owner, not into an implementation workaround.

Use a business-readable table in the task or PR, alongside the test source:

| Example | Expected result approved by owner | Actual result after implementation | Executable check | Remaining owner judgment |
| --- | --- | --- | --- | --- |
| Invoice above the agreed approval threshold | Requires review and states the threshold | Fill from real output, not the target illustration | Link to the approved test | Is the explanation understandable? |
| Same product appears twice | Names the duplicated product | Fill from real output | Link to the approved test | Is the wording useful to the reviewer? |

The examples above are a review format, not business rules to copy into your repository.
Owners need to approve understandable examples, not merely accept a green test report.
The [invoice trial](examples/golden-loop/README.md) shows why real output still matters.

## 2. Check prerequisites and the client boundary

- Node.js 22+ and git are available to the hook process, not just your terminal.
- The target is a git repository with a committed starting baseline.
- Existing developer and acceptance test commands are known and runnable.
- Use Copilot in VS Code with a trusted workspace as the demonstrated starting point.
  Record the actual client version, selected harness, model and installation route.
- Check hook discovery, event payloads and blocking decisions with
  [Verify in VS Code](../VERIFY-IN-VSCODE.md). Changing the model does not validate another harness.
- Install either copy-in hooks or plugin mode, not both.
- When redistributing copied kit files, retain the copyright and permission notice from
  the [MIT License](../LICENSE), for example in `.github/GOLDEN-PATH-LICENSE` alongside
  the installed kit. The installer does not copy that notice or change your application's license.

The VS Code hooks experience is preview. The kit does not promise parity across all clients
or agents. A successful CLI invocation does not prove the signed-in client invokes the hook.

## 3. Configure acceptance, not just a check

From a Golden Path clone, preview a **fresh** installation:

```bash
node plugin/install.mjs --target "<your-repo>" --level 2 --check "<fast-check-command>" --acceptance-path "acceptance/**" --acceptance-owner "<named-owner>" --acceptance-command "<acceptance-test-command>" --with-ci --dry-run
```

Replace every placeholder with your actual repository, owner and existing commands.
Use the acceptance glob for your approved tests; repeat `--acceptance-path` for additional paths.
If your developer tests are not under `tests/`, add `--protected "<your test folder>/**"` (repeatable);
heed any `WARNING` about protected paths that don't exist.
Remove `--dry-run` to install after reviewing the proposed files.

The kit does not ship your business tests or invent the owner's examples. The acceptance owner
string is used in messages; per-path GitHub ownership is configured separately through CODEOWNERS.
For individual-user approvals, use the owner's real GitHub handle, not the demo's fictional users.

If already installed, inspect `.golden-path/config.json` before assuming the flags applied.
**Installer reruns preserve it.** An authorized maintainer must explicitly review any configuration
revision; do not delete it to force new flags into effect.

Confirm:

- `check` is the intended existing fast command.
- `acceptance.paths` covers every owner-approved executable acceptance file.
- `acceptance.owner` identifies the owner for agent-facing messages.
- `acceptance.command` actually executes those tests.
- `protected` matches the folders that hold your developer tests (default `tests/**`).
- Local commands, integrity checks and git work together fit `hook_budget_sec` (default 100).
- Heavier suites have separate CI jobs; `--with-ci` repeats the configured commands, not a
  magically expanded suite.
- With `--with-ci`, CI can install what your commands need: add `.golden-path/ci-setup.sh` unless
  `npm ci` on a `package-lock.json` is enough ([project setup in CI](LEVEL-2.md#changing-acceptance-tests-on-purpose-authorised-revision)).

Commit approved acceptance and configuration through your normal review process before the
implementation session starts. The session-start commit is the local comparison baseline.

## 4. Configure the durable review boundary

An authorized repository maintainer configures all of the following:

| Control | What to verify |
| --- | --- |
| CODEOWNERS | Every acceptance path has the intended owner; later matching rules take precedence |
| Required Code Owner review | Acceptance revisions require the owner's approval |
| Stale approval dismissal | New commits invalidate old approvals as documented |
| Required status checks | `golden-path-check` and your heavier regression jobs are required |
| Bypass policy | Relevant rules cannot be silently bypassed; any permitted exceptions are explicit |

These are GitHub settings, not installer effects. Verify the settings and a representative PR
rather than relying on files alone. Protect the workflow, config and ownership files through
your normal controls too.

**Check your plan first.** Rulesets, branch protection and required Code Owner review are not available
on private repositories under GitHub Free; the API answers "Upgrade to GitHub Pro or make this repository
public" (seen in a pilot). Without them, CODEOWNERS only requests reviews and `golden-path-check` is
advisory: describe such a setup as feedback only, not owner-controlled acceptance. Read the effective rules
without changing anything:

```bash
gh api repos/<owner>/<repo>/rules/branches/<default-branch> --jq '.[] | {type, parameters}'
```

The kit's authorized-revision check resolves **individual `@user` owners**, not team/email owners.
Follow [authorized revisions](LEVEL-2.md#changing-acceptance-tests-on-purpose-authorised-revision)
for exact prerequisites and current-head approval.

If the PR author is the only owner, they cannot approve their own PR. Add another authorized
individual before requiring that approval; see
[single-maintainer guidance](LEVEL-2.md#code-owner-review-for-single-maintainer-repos).
Do not describe review routing alone as enforced owner approval.

## 5. Verify the mechanism in a disposable demo

Before relying on the setup, use the [invoice demo](../examples/invoice-demo/README.md) and
[signed-in verification checklist](../VERIFY-IN-VSCODE.md):

1. Verify the selected client discovers and invokes the hook.
2. Verify red acceptance blocks completion within the retry budget.
3. Verify a common acceptance edit is refused and names the owner.
4. Verify the integrity backstop detects an out-of-band edit against the fixed baseline,
   even if it was committed. Do this only in the disposable verification repository.
5. Verify a reviewed implementation PR runs required checks against the PR base.
6. Verify an owner revision uses the separate authorized-revision PR and current-head approval.
   After merge, begin a new implementation session against that approved baseline.

Record observed results and environment. Leave unperformed checks explicitly unverified.
The demo starts with intentionally red acceptance; that is not a reason to weaken its tests.

Local guards are heuristic. On retry exhaustion the agent may stop with terminal **FAILED**;
unreadable evidence is **UNVERIFIED**. A host hook timeout can allow stopping without a gate record.
These are not success. No owner notification is sent automatically; use your existing PR/review
process to surface exceptions. See [exact behavior](LEVEL-2.md#what-level-2-does-exactly).

## 6. Decide whether setup is complete

Owner-controlled acceptance is ready for the selected workflow only when:

- The owner has approved the business examples and their executable interpretation.
- Acceptance paths, owner and command are explicitly configured.
- The selected client/harness passes the relevant local verification.
- Required CI and ownership/review settings have been verified on GitHub.
- The team understands how to revise acceptance and handle FAILED/UNVERIFIED results.

An installer exit code of zero establishes none of the business or GitHub approval conditions.
If they are missing, describe the setup as check-only or partially configured.

## 7. Return evidence and evaluate adoption

Show actual output next to expected examples. Report what changed, which checks passed,
the candidate/base commits, remaining judgment and any requested acceptance revision.
Passing tests does not authorize merge or prove the examples capture customer needs.

Use the [pilot guide](LEVEL-3-EXPERIMENTS.md) to assess setup effort and repeated use against
competent existing practice. Keep pilot findings separate from the kit's mechanism tests.
