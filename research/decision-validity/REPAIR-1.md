# Decision-validity infrastructure repair 1

**Recommendation: NO-GO for scored execution.** The authorized Git discovery
repair works, but independent action validation did not finish. No scored
continuations ran (0/16). No Agent A initialization or Agent B stimulus ran.
This is infrastructure revalidation, not evidence about subject judgment or
Golden Path value.

## Scope and preservation

This separately versioned repair follows the authorization received
2026-10-12T16:44:20.641+02:00. Its baseline is
`eafb37cceec8a4f29bc270c4290279b3beb88658`, on the isolated
`research/decision-validity-feasibility` branch. No merge or push to main.

The original [protocol](../PROTOCOL.md), all 16 entries in
[FREEZE.sha256](../FREEZE.sha256), scenario definitions, authority model,
scoring criteria, evaluator and tests are unchanged. The
[original failed validation](../INDEPENDENT-VALIDATION.md) and
[historical results](../results/) remain intact. New evidence is confined to
this directory. See [preservation verification](evidence/preservation.json).

## Precise root cause and minimal correction

The fixture initialized a valid bare repository, then addressed it only through
the process working directory. This process inherits
`safe.bareRepository=explicit` through Git's environment configuration. That
policy rejects implicit bare-repository discovery.

[Reproduction evidence](evidence/git-root-cause.json) records:

| Operation on a fresh bare fixture | Exit | Observation |
|---|---:|---|
| `git init --bare` | 0 | Repository created |
| cwd-only `git config core.logAllRefUpdates true` | 128 | `fatal: not in a git directory` |
| cwd-only `git rev-parse --git-dir` | 128 | Explicit diagnostic names `safe.bareRepository` policy |
| Explicit `--git-dir` identity/configuration/readback | 0 | Bare identity true; setting true |
| Original cwd-only config repeated | 128 | Still rejected |
| Policy readback | 0 | Still `command line: explicit` |

This is an implementation/policy compatibility failure, not a missing repository
or an unsubstantiated environmental explanation. The five original failed tests
all stopped at the same configuration operation before exercising their intended
action assertions.

The entire runtime correction is:

- [materials.mjs](../materials.mjs): add `--git-dir remote` to bare configuration
  and symbolic-HEAD operations.
- [actions.mjs](../actions.mjs): use `--git-dir remote` for bare ref/reflog
  observations and retain that actual command in the observation.

Normal worktree operations are unchanged. No global settings, inherited Git
controls, requirements, approval rules, application evaluator or scoring changed.

## Before/after evidence

| Prerequisite | Before repair | Repair-1 result |
|---|---|---|
| Unchanged complete prerequisite test suite | 17/22 passed; five setup failures | **22/22 passed**, no skips |
| Neutral initial/native-resume/fresh probes | Automatic checks passed previously | New automatic checks passed; public traces inspected independently |
| Independent implementation challenges | Original independent validation stopped | Five completed checks passed |
| Independent actual-action challenges | Blocked at bare config | **Incomplete**: reviewer fixture's initial push failed with `Filename too long` |
| Original protocol/historical evidence | Frozen and retained | Preserved; all 16 frozen hashes verified |

The [complete test output](evidence/complete-prerequisites.tap) records 36.6 seconds.
The [new neutral probe traces](evidence/preflight/) and
[independent report](independent/REPORT.md) preserve separate results, rather
than replacing the failed attempt. Exact seven executed source files are in
[the archive](evidence/executed-sources.zip), with
[SHA-256 hashes](evidence/executed-sources.sha256); archive hashes were verified.

Commands, from the isolated worktree root (absolute output paths must be fresh):

```powershell
node research\decision-validity-feasibility\repair-1\reproduce-git.mjs <absolute-new-evidence.json>
node --test --test-reporter=tap research\decision-validity-feasibility\evaluate.test.mjs research\decision-validity-feasibility\actions.test.mjs research\decision-validity-feasibility\preflight.test.mjs
node research\decision-validity-feasibility\preflight.mjs <absolute-npm-loader.js> <absolute-new-output-directory>
```

All three commands exited 0. The reproduction deliberately expects the original
Git policy failures; they are evidence, not ignored execution errors.
Independent challenge commands, results and raw artifacts are recorded in the
[reviewer's report](independent/REPORT.md).

```powershell
node research\decision-validity-feasibility\repair-1\independent\challenge.mjs
node research\decision-validity-feasibility\repair-1\independent\inspect-public.mjs > research\decision-validity-feasibility\repair-1\independent\raw\public-inspection-output.txt
```

The challenge exited **1** after five completed passing checks; public inspection
exited **0**. The challenge's recorded interval was
14:51:02.012Z-14:51:07.904Z on 2026-10-12. No challenge rerun was attempted.

Pins: Node `v24.19.0`, Git `2.55.0.windows.5`, PowerShell `5.1.26100.9444`,
GitHub CLI `2.100.0`, Copilot CLI `1.0.95`; probe model
`claude-sonnet-5.5`. Loader/package hashes are retained in
[preservation.json](evidence/preservation.json).

## Independent review, actions and failure classification

A fresh reviewer context authored a separate implementation challenge rather
than relying solely on the evaluator author's candidates. Completed checks covered
correct R1 behavior, an unauthorized 30-day default, the properly approved
30-day variant, incorrect report fields/data, and explicit import failure.
Expected rejection of deliberately incorrect candidates is not a pilot failure.

The reviewer's initial fixture push failed before the actual-action challenge
sequence. The reported diagnostic is a path-length failure in the review harness.
The selected bare-remote path was 203 characters; the rejected incoming-object
filename was 282 characters. Git reported `remote unpack failed: unpack-objects
abnormal exit` after `Filename too long`. The failing subprocess's numeric exit
code was not separately retained; the enclosing challenge exited 1 and its full
exception is in [raw/results.json](independent/raw/results.json).
It is **not** recurrence of the repaired bare-discovery failure, evidence of
incorrect subject judgment, or semantic prevention by an engineering control.
No retry or unrelated repair was attempted. Thus the author-suite action tests
pass, but the required independently authored actual-action gate remains unmet.

The reviewer also identified a **static, unconfirmed** concern: deletion and
recreation could produce identical hash/message reflog entries and evade the
continuity comparison. Its reproducer was retained but never reached. This is a
potential measurement defect, not an observed lost event. It was not repaired.
The execution failure alone is sufficient for NO-GO.

The public probes show runtime-reported model identity, a remembered marker on
native resume, a fresh-context UNKNOWN response, authority-record retrieval, and
exercised file/Git/test tools. These observations support narrow infrastructure
claims, not full equivalence of all hidden instructions, tool schemas or session
state. Native session/compaction provenance and coordinator response timing
remain unestablished. Synthetic approval records test interpretation, not
authenticated organizational authorization.

The reviewer is independent of repair authorship in a separate context, but shares
the protocol, code, runtime and tooling environment. This is not independent
external replication or an outcome-blinded scored evaluation.

## Stop boundary and next decision

Complete prerequisite validation was attempted and stopped when the independent
gate failed. No scored episode, additional scenario, scoring adjustment,
conventional repair of the new failure, or Golden Path-specific capability was
introduced.

The smallest next step, **only with renewed authorization**, is to correct the
reviewer's scratch-path setup and complete the retained actual-action challenges,
including the unconfirmed observer concern. A confirmed methodological change
must be separately reviewed/versioned and, if it changes the frozen protocol or
evaluation boundaries, receive fresh approval. This report does not authorize it.

The Git setup correction is verified; trustworthy end-to-end measurement is not.
The results establish neither an irreducible engineering gap nor the sufficiency
of conventional practice. **Do not execute the frozen 16 continuations yet.**
