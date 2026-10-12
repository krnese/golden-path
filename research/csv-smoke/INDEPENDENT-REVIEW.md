# CSV A/B smoke results

**Both implementations pass the frozen functional checks. No meaningful incremental
Golden Path benefit is demonstrated. The intended treatment was not delivered:
the treatment subject received the discovery pointer and skill listing, but never
loaded the canonical skill or method. Consequently, the effect of actually using
Golden Path is inconclusive, not a tie or a negative causal result.**

One completed subject run per arm; treatment ran first by the retained coin-toss
[order](../execution-order.txt). No subject relaunch, coaching, implementation
change, evaluator change, tailored test or nested agent was used in this review.
All new review artifacts are in this directory.

## Candidates and execution

| Evidence | Control | Golden Path-labelled treatment |
| --- | --- | --- |
| Absolute candidate root | `C:\Users\krnese\ab1\control` | `C:\Users\krnese\ab1\golden-path` |
| Prepared HEAD | `5a75707a9d5b74b08cb7d78c81ba0b76c61611e0` | `922b13519952a68c4b7903e360722f2eacfa9e62` |
| Final HEAD | `c8d049c1bfb28ac4deb4b2f0dad6dc639bbb5fa6` | `4e44f05994538627baadb40640e83a109a0540d1` |
| Final branch / worktree | `work/csv-export`; clean; one new commit | `work/csv-export`; clean; one new commit |
| Runtime model / CLI | `claude-sonnet-5.5` / `1.0.95` | Same |
| Subject UTC start | `2026-10-12T16:47:39.4930928Z` | `2026-10-12T16:46:51.6095157Z` |
| Subject UTC end | `2026-10-12T16:48:17.5514688Z` | `2026-10-12T16:47:26.7472105Z` |
| Subject wall time | **38.0583760 s** | **35.1376948 s** |
| CLI exit / timeout | 0 / none; within 15 minutes | 0 / none; within 15 minutes |
| Subject's own tests | 9 passed: 5 original + 4 new | 8 passed: 5 original + 3 new |
| Changed files / insertions | 3 / 121 | 3 / 107 |

Wall time uses the retained launch/end timestamps, not rounded session-export
durations (35 s / 31 s), API time, or evaluator time. Treatment was 2.9206812 s
shorter in this pair; this does not establish a speed advantage.

Both prepared ZIPs match all 13 common-file hashes, including the original
application and task: [snapshot verification](preparation-snapshot-check.json).
The prepared-HEAD delta contains only the discovery pointer, canonical skill and
method. Treatment skill/method bytes match the canonical repository copies.
Reviewed full final deltas: [control](control/source.diff),
[treatment](golden-path/source.diff). Final refs, model evidence, hashes, durations
and command metadata are retained in [evidence-summary.json](evidence-summary.json).

## Frozen checks: once per arm

Evaluator SHA256, verified before and after:
`128B5B1B5039AB38CDFA6C0B53A713646994FB6953B5A499823E74D4FEF771C7`.
Original test SHA256 in both candidates:
`4B0D12221F6C4C146E8841351B56B51F528208D7D94F5ECAF4EA4494D296083D`.
Both task hashes also match the frozen value
`5D374DFDEA2B001B1984738599D425587DD8CE491D4456D6BC5C93081F8529D9`.

For each absolute root above, set `CANDIDATE_ROOT` and execute these frozen commands
in order. Each was executed exactly once per arm:

```powershell
node --version
node --input-type=module -e "import assert from 'node:assert/strict'; import {readFileSync} from 'node:fs'; import {join} from 'node:path'; assert.deepEqual(readFileSync(join(process.env.CANDIDATE_ROOT,'app','equipment.test.mjs')),readFileSync('C:\\Users\\krnese\\ab1-evidence\\evaluation\\equipment.test.mjs.snapshot')); console.log('Original test bytes match snapshot');"
node --test --test-reporter=tap --test-timeout=60000 C:\Users\krnese\ab1-evidence\evaluation\csv-export.test.mjs
node --test --test-reporter=tap --test-timeout=60000 "$env:CANDIDATE_ROOT\app\equipment.test.mjs"
```

| Check | Control: result; exit; elapsed | Treatment: result; exit; elapsed |
| --- | --- | --- |
| Node version | v24.19.0; 0; 1.4839539 s | v24.19.0; 0; 0.1968406 s |
| Original-test byte assertion | Pass; 0; 0.5863308 s | Pass; 0; 0.2640367 s |
| Frozen CSV evaluator | **6/6 pass**; 0; 0.9718031 s | **6/6 pass**; 0; 1.0413622 s |
| Unchanged original regressions | **5/5 pass**; 0; 0.5480969 s | **5/5 pass**; 0; 2.0770704 s |

Raw per-command `.stdout.txt`, `.stderr.txt` and `.metadata.json` are in
[control](control/) and [treatment](golden-path/). Metadata contains the exact
expanded command, absolute candidate root, separate UTC start/end, stopwatch
duration and immediately captured exit code. `cmd.exe` supplied only native
stream redirection, avoiding PowerShell stream transcoding; no alternative test
runner was introduced. All evaluator stderr files are empty. Evaluation calls
were dispatched independently and their timings are not subject-performance
measurements. No evaluator failure or unreached functional assertion occurred.

## Frozen criteria

Here, **pass** means supported by the named checks and scoped review, not a
universal proof. CSV test numbers refer to the retained TAP output:
[control](control/csv-export.stdout.txt), [treatment](golden-path/csv-export.stdout.txt).

| Criterion | Control | Treatment | Evidence / qualification |
| --- | --- | --- | --- |
| Manager export; missing 401; employee 403 | Pass | Pass | CSV 1-3; header and cookie identities |
| HTTP 200, CSV content type, attachment filename | Pass | Pass | CSV 3 |
| Exact header, CRLF records/final terminator, no BOM | Pass | Pass | CSV 4-6, raw bytes and parser |
| Commas, quotes, CRLF/lone CR/lone LF, Unicode, null serial, formula-looking data preserved | Pass | Pass | CSV 5 |
| Every fixture item, existing asset-tag order, repeated reads | Pass | Pass | CSV 5-6; active and returned items |
| Header-only empty inventory | Pass | Pass | CSV 4 |
| No equipment/assignment/user/lifecycle-event mutations | Pass | Pass | CSV 6; all rows/columns after each export/denial; read-only source path |
| Original test bytes unchanged | Pass | Pass | Exact snapshot assertion, not just Git diff |
| Existing behavior and server factory intact | Pass | Pass | 5 original regressions each; CSV setup/session/list/lifecycle checks; source review |
| Application documentation updated accurately | Pass | Pass | Route, roles, format and read-only behavior documented |
| No unintended scope changes | Pass | Pass | Only route/helper, separate tests and application documentation; all tool/shell actions reviewed |
| Finished changes committed on existing local branch | Pass | Pass | Final HEADs, one commit each, clean status |
| Final explanation accurate and complete for task | Pass | Pass | Recorded test totals/commands and commits agree; limitations qualified below |
| Wall-time evidence complete | Pass | Pass | Retained start/end/exit; no interruption |
| Native tool-use evidence complete | Pass | Pass | Every start matched to completion and stream event; nested exit-code limitation below |

Additional **experiment-validity** findings, not invented application criteria:
control loader separation passes on observed evidence; required treatment
skill/method loading **fails**; incremental effect of the intended treatment is
**inconclusive**.

## Loading, independence and action provenance

Native events:
[C](../profiles/control/.copilot/session-state/0f987054-a198-49a6-8efd-5bf06ad79d8e/events.jsonl)
and
[T](../profiles/golden-path/.copilot/session-state/3939904c-e0fc-49c8-a216-aaa010f9cb8c/events.jsonl).
`C:n` / `T:n` below are physical 1-based JSONL lines, not conversation turns.
The streamed [control actions](../control-run/actions.jsonl) and
[treatment actions](../golden-path-run/actions.jsonl) are UTF-16LE; native saved
events are UTF-8. All actual invocations were parsed structurally, not counted
from prose or streaming argument fragments.

- **Model and freshness:** C:1 `d63e92ef-84d0-41de-91ff-ab08da4d001a`;
  T:1 `fea57c73-1e6c-4099-87e7-c9ba2cbb9c46` record the respective prepared
  HEAD, fresh session, CLI version and selected model. Every actual usage record
  also names `claude-sonnet-5.5` (7 control calls, 8 treatment calls); first:
  C:5 `7c12376f-c9f0-43cf-a4c0-a98272c0560c`,
  T:5 `264c1b2f-4d8e-435c-b551-22f9724e50ad`.
- **Control:** C:3 `c7186c39-71a5-404d-8bd1-6e2d5351cf32` contains no GP
  instruction, skill or plugin. Only two non-GP built-in skills were listed.
  No previous turns/checkpoints were injected; preparation
  [session inventory](../audit/session-isolation.txt) records zero saved sessions,
  absent inherited session ID and absent additional instruction directories.
  Every tool path and both nested shell sequences stayed in its own checkout;
  no unexpected GP, evaluation, other-checkout or prior-session access was found.
- **Treatment:** T:3 `fa2ea1d5-6e7c-4f3f-9e57-163f15eb0b5e` contains the GP
  description and ordinary discovery pointer, not the canonical bodies
  (decoded context lines 169-185 and 310-315 in
  [context](golden-path/native-context.txt)). T:12
  `b7aefc35-e352-4fd9-8ab6-3ae295ee8138` (stream line 41) lists the skill and
  method filenames. **There is no `skill` invocation, file read or shell read of
  either body anywhere in the complete 14-call trace. Listing is not loading.**
- The native prelaunch [control skills](../audit/control-execution-skills.txt),
  [treatment skills](../audit/golden-path-execution-skills.txt) and plugin lists
  ([C](../audit/control-execution-plugins.txt), [T](../audit/golden-path-execution-plugins.txt))
  agree: no installed plugins; only treatment discovers GP. Native MCP loading
  events mark the configured servers disabled; no MCP invocation occurred.
- User events contain task-correlation IDs, but no inherited parent conversation
  was observed. Loader separation is an observed claim, not OS exclusion or
  proof about hidden provider state/pretraining. Shared-prefix prompt caching is
  not evidence of a resumed conversation.

Full, unabridged arguments/results, event IDs, native line numbers and matching
stream line numbers for **all 27 invocations** are retained in
[control native tools](control/native-tools.json) /
[treatment native tools](golden-path/native-tools.json), with readable
[C index](control/native-tool-index.txt) / [T index](golden-path/native-tool-index.txt).

| Actual native invocation type | Control | Treatment |
| --- | ---: | ---: |
| `view` | 5 | 6 |
| `glob` | 1 | 1 |
| `grep` | 1 | 1 |
| `edit` | 3 | 3 |
| `create` | 1 | 1 |
| `powershell` | 2 | 2 |
| **Total** | **13** | **14** |
| Failed native tools | 0 | 0 |
| Observed failed nested commands | 0 | 0 |
| Within-run retries | 0 | 0 |

Retries mean renewed attempts at the same operation after an unsatisfactory
attempt; separate edits to different locations and verification/status reads are
not retries. Each subject ran its test command once and committed once.

Nested shell audit (not extra tool invocations):

| Action | Control event | Treatment event |
| --- | --- | --- |
| Tests | C:45 `1d895dc3-a9f2-44bd-aab4-69ec7a9a04fc`, completion C:46; stream 1075/1108 | T:51 `f453c370-d380-4750-9398-021c1e5c09f2`, completion T:52; stream 973/1012 |
| Commit and inspect | C:51 `7d43e81d-4e1b-43b8-92af-9bbbbac58dd6`, completion C:52; stream 1144/1173 | T:57 `d1b6b5c4-3cd7-41b0-969a-49931c8b9039`, completion T:58; stream 1043/1073 |

Control: `node --test app\*.test.mjs 2>&1 | Select-Object -Last 14`; then
`git add -A; git commit -q -m <message>; git --no-pager log --oneline -1; git status --short`.
Treatment: `node --test app\*.test.mjs 2>&1 | Select-Object -Last 15; git status --short`;
then `git add app; git commit -q -m <message>; git log --oneline -1`.
Each commit message is `Add manager equipment CSV export` with the Copilot
co-author trailer. Each arm therefore has five nested external commands
(one Node, four Git) plus one `Select-Object` cmdlet; all four shell invocations
report exit 0. **Individual nested exit codes were not retained by subjects**;
semicolon chaining/piping can mask them. No failure is visible, test summaries
show zero failures, and final commits/status substantiate success, but exact
per-subcommand exit status is inconclusive. This is not silently counted as six
independently verified zero exits. Both subject stderr files only contain the
session-export notice wrapped as PowerShell `NativeCommandError`, not a subject
tool failure. Parent/preparation/reviewer/evaluator calls are excluded.

## Engineering judgment and verdict

Both subjects made the same sensible core decision: reuse the existing
manager-gated, asset-tag-ordered repository query, serialize four fields and leave
storage, identity handling and existing routes alone. Neither added dependencies,
UI, migration, deployment, remote action, framework or unrelated refactor.
Control used an additional small CSV assembly helper; treatment kept assembly
inside the route. Neither choice produced a demonstrated correctness difference.

Control's new tests separately check raw-byte BOM absence and repeated reads of
equipment plus an empty assignment list. Treatment asserts fixture creation
success and explicitly documents unchanged formula-looking data, but its BOM
assertion follows `response.text()` decoding, so is weaker than a raw-byte check.
Both subjects' own read-only tests miss populated lifecycle/user state and cookie
identities; the frozen evaluator covers those cases and passes both. These are
observed coverage differences, not a GP-attributable improvement.

The final explanations ([control session](../control-run/session.md), lines
741-759; [treatment session](../golden-path-run/session.md), lines 653-664)
accurately report commits, changes and underlying Node command/test totals.
Native final events are C:56 `e9f6d7d7-b452-4ff4-b5ac-ec59e5f51256` and T:62
`fbe9d7b4-c83c-4045-b762-3eff70816b04`. Control notes existing creation-time
trimming; treatment notes possible spreadsheet interpretation without changing
the requested data. Neither final narrative establishes additional correctness
or compensates for the missing treatment load.

**Interpretation limits:** this is one small, ordered run per arm, not a
statistical or causal comparison. There is no aggregate score and fewer
tools/tests/lines or shorter time is not inherently better. The evaluator was
unchanged and all assertions were reached; its small fixtures do not prove
unlimited scale, every Unicode value or absence of arbitrary external effects.
Persistent snapshots cannot alone detect transient write-and-undo operations;
source review found no such export path. Original regressions are not exhaustive.
The user explicitly accepted loader-only isolation; no OS security boundary is
claimed. This reviewer is a separate context from the subjects and preparation
author, but on the same platform and not instruction-blinded: the review itself
loaded ambient canonical Golden Path guidance. Preparation also disclosed GP
exposure. No historical research was inspected or changed.

**Usable conclusion:** both bounded CSV changes succeeded on the frozen evidence.
Observed control contamination: none. Intended treatment loading: failed.
Meaningful incremental benefit of using Golden Path: **not established /
inconclusive**. Preserve this run as-is rather than repairing or rerunning it.
