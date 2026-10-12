# Brownfield engineering continuity experiment

Research, not active Golden Path instructions or a new runtime.

* [Implementation audit](IMPLEMENTATION.md): what the current method/plugin
  actually implements, including the absent durable continuity mechanism.
* [Frozen protocol](PROTOCOL.md), [shared task](task.md) and
  [restart revision](revision.md).
* [Freeze manifest](freeze.json) and [fixture/plugin provenance](source-provenance.json).
* [Deterministic outcome evaluator](evaluate.test.mjs) and
  [CLI experiment driver](experiment.mjs).
* [Results and limitations](RESULTS.md).

## Reproduction

Requires Windows, Git, Node 24 (built-in SQLite), and for fresh model subjects
Copilot CLI 1.0.95 plus working authentication. The observed default model was
`claude-sonnet-5.5`. Another model/version is a new stratum, not an exact replay.
No package installation is needed: the application tests use built-in Node
modules. The fixture retains inherited locked devDependencies for provenance;
these tests do not exercise AJV/YAML.

The source application, original five tests and engineering-only skill extraction
are retained here; the adjacent adopter workspace is NOT needed to reproduce.
Do not rerun `prepare` or `freeze` over checked-in artifacts. The driver refuses
overwrite of inputs/output directories and verifies frozen inputs before execution.
Use new explicit output directories for every command. From the repository root:

```powershell
node --test research\brownfield-continuity\experiment.test.mjs
node research\brownfield-continuity\experiment.mjs verify
node research\brownfield-continuity\experiment.mjs baseline C:\temp\gp-brownfield-baseline
```

The baseline driver exits successfully after recording an evaluation; that is NOT
an application pass. Inspect the emitted result: the original five regressions
pass, while all six retry outcome tests fail with nonzero exit status.

For a new four-subject comparison:

```powershell
$env:COPILOT_CLI_PATH = Join-Path (Split-Path (Get-Command copilot).Source) 'node_modules\@github\copilot\npm-loader.js'
node research\brownfield-continuity\experiment.mjs preflight C:\temp\gp-brownfield-preflight
```

Review the emitted manifest before scored execution. Confirm two clean independent
homes, identical actual model, successful test tools, control absence of Golden
Path, and treatment skill invocation plus actual method reading. The run command
also checks the main isolation/model gates. If these gates fail, retain and report
the failure; do not weaken the control, repair the frozen protocol, or silently
retry different subjects.

```powershell
node research\brownfield-continuity\experiment.mjs run C:\temp\gp-brownfield-run C:\temp\gp-brownfield-preflight\manifest.json
```

`run` uses the installed CLI's default selection in fresh configurations, records
the actual model, and does not specify a model override. It invokes ordinary CLI
tools with the same permissions in both arms. It terminates the CLI process tree
ten seconds after the first backend mutation, then starts a fresh UUID/home with
the revised task. Runtime homes/authentication are not publishable evidence.

## Independently re-evaluate a retained candidate

The results package retains compressed text-file snapshots of partial and final
candidates, not complete session directories. Restore a final candidate into a
fresh absolute path:

```powershell
node research\brownfield-continuity\experiment.mjs restore research\brownfield-continuity\results\pair-1-A\T2-candidate.json.gz C:\temp\gp-candidate-A
$env:GP_CANDIDATE = 'C:\temp\gp-candidate-A'
Copy-Item research\brownfield-continuity\fixture\app\equipment.test.mjs C:\temp\gp-candidate-A\app\equipment.test.mjs
node --test research\brownfield-continuity\evaluate.test.mjs C:\temp\gp-candidate-A\app\equipment.test.mjs
```

The outcome evaluator opens an actual loopback HTTP server on an ephemeral port,
creates an original-schema SQLite database containing legacy data, and independently
issues requests, closes/reopens the server, injects a transactional write failure
and checks persisted rows. Server/database restart is an actual application
outcome test, distinct from restarting the engineering agent. Original test bytes
are evaluator-owned during the experiment. Never accept modified agent tests as
the sole regression evidence.

Public tool events, candidate hashes, patches, evaluator stdout/stderr and
available usage are retained. Hidden reasoning, credentials, CLI homes and
general workplace/session exports are excluded. Interrupted phase usage may be
unavailable; null is not zero. No dollar cost is inferred without actual pricing.

The [summary](results/summary.json) can be recalculated from the retained public
evidence by applying the reporting functions in [summarize.mjs](summarize.mjs).
Its parser/reporting checks are:

```powershell
node --test research\brownfield-continuity\experiment.test.mjs research\brownfield-continuity\analysis.test.mjs
```

[Post-run diagnostics](results/diagnostics.json) are explicitly outside the frozen
score: they reproduce a control cleanup failure and check an unrequested treatment
key-length limit. They did not feed back into subjects or change primary scoring.
The frozen guard's false positives remain failures in the raw artifacts, not
post-hoc repaired passes. Read [the interpretation](RESULTS.md) before using the
raw guard or censored timings as a comparison.

## Freeze integrity

The checked-in freeze predates scored execution and hashes all decision-bearing
protocol, task, evaluator, driver, fixture and treatment source bytes. Narrative
audit/results and reproduction instructions are outside the freeze so observations
can be reported without rewriting the protocol. A hash is an integrity check,
not a trusted timestamp or independent preregistration service. Source hashes,
recorded timestamps and ordered public events make changes detectable within the
retained package; they do not prove the experiment author's independence.
