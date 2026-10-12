# Loader-isolated CSV A/B smoke test results

**Both implementations passed the fixed engineering checks. Meaningful
incremental benefit from using Golden Path is not demonstrated; its intended
canonical treatment was not established.**

The user accepted loader-only isolation in
[the execution authorization](EXECUTION-AUTHORIZATION.md). Each subject ran
once, without coaching, retry or changes to the frozen task/evaluator.
The pre-execution coin toss selected treatment first, then control.

## Side-by-side outcomes

| Measure | Control | Configured Golden Path treatment |
|---|---:|---:|
| Frozen independent CSV checks | 6/6 passed | 6/6 passed |
| Original regressions | 5/5 passed | 5/5 passed |
| Original test bytes | Unchanged | Unchanged |
| Independent evaluator command exits | All 0 | All 0 |
| Requirement gaps found in reviewed scope | None | None |
| Unnecessary changes found | None | None |
| Changed application files | 3 | 3 |
| Diff size | +121 / -0 | +107 / -0 |
| Subject wall time | 38.058376 seconds | 35.137695 seconds |
| Native tool invocations | 13 | 14 |
| Failed native tools / observed retries | 0 / 0 | 0 / 0 |
| Final state | Committed, clean | Committed, clean |
| Golden Path exposure | No observed loading or unexpected access | Pointer/listing present; no observed canonical body load |

Times include the native invocation, not the subsequent independent evaluation.
Both completed well within the identical 15-minute budget. The approximately
2.9-second difference is one observation, not evidence of a repeatable speed
benefit. Both runtime records identify `claude-sonnet-5.5`, using the same CLI,
prompt, tool flags and fresh-profile conditions.

## Important treatment-validity failure

The treatment received the ordinary discovery pointer and skill description.
A glob also listed the canonical skill and method files. However, the independent
reviewer inspected the retained automatic context and all 14 matched native tool
invocations/completions and found **no skill invocation or file/shell read of
either canonical body**.

Therefore the user's requirement that treatment load the canonical Golden Path
skill was **not demonstrated**. This is a treatment-uptake limitation, not an
implementation failure or an evaluator defect. No coaching, forced load or second
run was introduced after observing it.

Control's retained context/actions showed no Golden Path loading, inherited
session or unexpected access to Golden Path material. Ordinary cross-directory
visibility was accepted and is not itself contamination.

The exposure conclusion is bounded by retained native records; it does not
exclude undocumented unlogged injection or prior model knowledge. It is still
insufficient to count this as a verified test of using the complete method.
Discovery/pointer exposure alone did not establish the required uptake.

## Actual engineering behavior

Both implementations reused existing manager authorization and SQL ordering,
preserved stored values, handled CSV escaping and left existing behavior intact.
Each changed only the server, new separate CSV tests and application route
documentation. Neither changed the original tests, dependencies, database schema,
UI or unrelated application code.

Control added a small CSV assembly helper; treatment assembled CSV in the route.
Neither choice produced an observed correctness difference.

Control added four tests, including raw-byte BOM detection and a separate
repeated-read check. Treatment added three tests, asserted successful fixture
creation explicitly, and combined ordering/value/read-only checks. Treatment's
BOM assertion operated after `response.text()` decoding, making it weaker than
control's raw-byte assertion. Both subjects omitted populated lifecycle/user
state and cookie-identity coverage in their own tests; the frozen independent
checks exercised those cases and passed both.

Treatment documented formula-looking values explicitly; neither implementation
transformed them. These are differences in actual work, not demonstrated effects
of Golden Path. Method-oriented wording was not scored as engineering value.

| Tool type | Control | Treatment |
|---|---:|---:|
| view | 5 | 6 |
| glob | 1 | 1 |
| grep | 1 | 1 |
| edit | 3 | 3 |
| create | 1 | 1 |
| powershell | 2 | 2 |

Treatment's additional view read the existing equipment query and its ordering.
Control recovered that context through grep. Fewer calls is not inherently
better. Individual nested shell-command exit codes were not separately retained;
successful shell exits alone are not proof of every nested command's exit.
The independent test commands did retain individual exits and full output.

## Exact versions and independent evidence

| Arm | Starting HEAD | Ending HEAD |
|---|---|---|
| Control | `5a75707a9d5b74b08cb7d78c81ba0b76c61611e0` | `c8d049c1bfb28ac4deb4b2f0dad6dc639bbb5fa6` |
| Treatment | `922b13519952a68c4b7903e360722f2eacfa9e62` | `4e44f05994538627baadb40640e83a109a0540d1` |

The unchanged evaluator SHA-256 is
`128B5B1B5039AB38CDFA6C0B53A713646994FB6953B5A499823E74D4FEF771C7`.

For each candidate, the reviewer ran the frozen original-test byte assertion,
then:

```powershell
$env:CANDIDATE_ROOT = 'C:\Users\krnese\ab1\control'
node --test --test-reporter=tap --test-timeout=60000 C:\Users\krnese\ab1-evidence\evaluation\csv-export.test.mjs
node --test --test-reporter=tap --test-timeout=60000 "$env:CANDIDATE_ROOT\app\equipment.test.mjs"
```

Both commands passed for both candidates; all assertions were reached, all
recorded command exits were 0 and stderr was empty. No evaluator infrastructure
defect was observed and no evaluator code was changed. This establishes
successful execution for these candidates, not universal evaluator soundness.
The identical commands were also run with `CANDIDATE_ROOT` set to
`C:\Users\krnese\ab1\golden-path`; per-command metadata retains both invocations.

- [Independent full comparison](comparison/RESULTS.md)
- [Control evaluator output](comparison/control/csv-export.stdout.txt) and
  [original regressions](comparison/control/original-regression.stdout.txt)
- [Treatment evaluator output](comparison/golden-path/csv-export.stdout.txt) and
  [original regressions](comparison/golden-path/original-regression.stdout.txt)
- [Control native transcript](control-run/session.md) and
  [treatment native transcript](golden-path-run/session.md)
- [Source/snapshot preservation](post-evaluation-preservation.txt)

Native JSONL, complete tool records, timing/exit metadata, source diffs, final Git
bundles and working-tree snapshots are retained beside those files.

## Limits and conclusion

The evaluator author and outcome reviewer were separate from subject execution
but shared the platform and had generic Golden Path guidance in their own
contexts. This is not blinded external evaluation. Frozen identical assertions
reduce, but do not remove, evaluator bias. One pair cannot establish reliability,
effect size, significance, false-alarm rates or general architectural value.

All 38 immutable preparation evidence files remained unchanged; native profile
files were allowed to acquire the new sessions. Both recorded ending candidate
trees remain unchanged after evaluation. Historical Golden Path research, main,
and original snapshots were not modified.

**Conclusion:** the capable control solved this task with conventional tools.
The configured treatment also solved it, but showed no verified quality advantage
and did not demonstrate loading the canonical method. Consequently the
incremental value of actually applying Golden Path remains inconclusive.
This result justifies neither a superiority claim nor a new mechanism.
No automatic rerun, experiment redesign or additional infrastructure follows.
