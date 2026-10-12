# Distributed engineering coherence: frozen protocol

Research only. This experiment does not modify the Golden Path method, the
engineering-contract pilot, or the brownfield-continuity experiment.

## Question and hypothesis

Can independently valid changes collectively invalidate an engineering objective
that none of those changes explicitly intended to modify?

**H1:** with identical local, contract, and end-to-end test capabilities, linking
declared contributors to an objective and evaluating their exact combined version
set detects more pre-integration violations than independent repository CI.

**H2:** adding bounded impact signals from changed runtime paths and declared
component dependencies detects violations caused by changes that do not reference
the objective, without scheduling the end-to-end check for a docs-only control.

**Null / adoption rule:** if a competent integration or release gate evaluating
the exact composed version set detects every violation before deployment, the
experiment does not establish a need for a new Golden Path capability. Earlier
detection or better attribution may justify only a small convention or CI adapter.

## Baseline and isolation

- Golden Path baseline:
  `041c2c2cf3f89c8575a93a78e4b60102cf3282a0`.
- Branch: `research/distributed-coherence`, in a dedicated worktree.
- The dirty source worktree is read-only evidence. Its engineering-contract and
  brownfield-continuity artifacts are not copied, edited, or treated as baseline
  product capabilities.
- This protocol and its hash are committed before fixture implementation or
  scored execution. Any change to scenarios, expected outcomes, evaluator
  semantics, arm selection, or thresholds requires a new experiment version.

## Existing-capability baseline

The strong conventional baseline may use repository-local tests, interface
contract tests, dependency manifests, CODEOWNERS review routing, branch
protection, build/selective-test graphs, per-PR integration environments, merge
queues, release manifests, provenance, deployment gates, and telemetry. These
systems can enforce an objective when they are configured to run its evaluator
against the exact candidate composition.

This experiment isolates a narrower coordination question: separate repositories
evaluate concurrent candidates against the same stable integration baseline.
There is no cross-repository merge queue producing a candidate matrix, but there
is a competent release gate that evaluates the exact composed version set before
deployment. That is a common topology, not a claim that GitHub Actions, merge
queues, or CI/CD cannot express the stronger check.

CODEOWNERS is modeled only as code-review routing. Objective ownership and
authority to change the 100 ms constraint remain with the owner-controlled
objective record. Candidate-authored metadata cannot relax the frozen evaluator.

## Fixture and objective

Use an equivalent multi-repository simulation with three independently versioned
component directories:

1. `gateway`: chooses request attempt count.
2. `worker`: performs one attempt and determines its virtual processing latency.
3. `transport`: supplies retry backoff without changing its public interface.

The fixed workload contains successful requests and one transient failure that
can succeed on retry. Virtual time makes the result deterministic and avoids
host-timing noise.

**OBJ-LAT-100:** maximum end-to-end virtual latency is at most 100 ms. Completion
rate is retained as a separate reliability observation and is not part of this
latency objective.

The owner-controlled baseline tuple is:

`gateway@1.0.0 + worker@1.0.0 + transport@1.0.0`

Baseline policies are one attempt, 40 ms per attempt, and 5 ms retry backoff.
The baseline objective result is 40 ms. Its transient request does not complete,
which motivates the retry change but does not violate the latency objective.
Workload selection is fixed per scenario below, not selected by an arm.

Local checks validate each component's legitimate purpose and invariants.
Contract checks validate the unchanged interfaces. The single end-to-end evaluator
is available to every arm and returns the exact version tuple, workload ID,
completion result, maximum virtual latency, and objective result.

## Frozen changes and expected local results

| Version | Legitimate purpose | Relationship metadata | Runtime effect | Expected local/contract |
| --- | --- | --- | --- | --- |
| `gateway@1.1.0-retry-unlinked` | retry one transient failure for reliability | contributes to `OBJ-REL`; no latency reference | two attempts | pass |
| `gateway@1.1.1-retry-linked` | same retry behavior | contributes to `OBJ-REL` and `OBJ-LAT-100` | two attempts | pass |
| `gateway@1.0.1-docs` | clarify operations documentation | none; docs path only | unchanged | pass |
| `worker@1.1.0-enrichment-unlinked` | improve response completeness | contributes to `OBJ-COMPLETE`; no latency reference | 48 ms per attempt | pass |
| `worker@1.1.1-enrichment-linked` | same enrichment behavior | contributes to `OBJ-COMPLETE` and `OBJ-LAT-100` | 48 ms per attempt | pass |
| `worker@0.9.1-fast` | reduce processing cost | contributes to `OBJ-EFFICIENCY` | 35 ms per attempt | pass |
| `transport@1.1.0-backoff` | reduce retry pressure on a recovering dependency | contributes to `OBJ-REL`; public interface unchanged | 21 ms backoff | pass |

No expected component change has a textual merge conflict because each belongs to
a separate component/version namespace.

## Frozen scenarios and oracle

All candidate repositories start from the stable tuple. `retry` is the fixed
workload with one transient failure; `steady` has no failure.

| ID | Exact candidate tuple | Workload | Expected max | Objective | Additional combined check required |
| --- | --- | --- | ---: | --- | --- |
| `declared-pair` | `gateway@1.1.1-retry-linked`, `worker@1.1.1-enrichment-linked`, `transport@1.0.0` | retry | 101 | fail | yes |
| `unrelated-pair` | `gateway@1.1.0-retry-unlinked`, `worker@1.1.0-enrichment-unlinked`, `transport@1.0.0` | retry | 101 | fail | yes |
| `shared-dependency` | `gateway@1.1.0-retry-unlinked`, `worker@1.0.0`, `transport@1.1.0-backoff` | retry | 101 | fail | yes |
| `compatible-control` | `gateway@1.1.0-retry-unlinked`, `worker@0.9.1-fast`, `transport@1.1.0-backoff` | retry | 91 | pass | yes |
| `docs-control` | `gateway@1.0.1-docs`, `worker@1.0.0`, `transport@1.0.0` | steady | 40 | pass | no |

The first three scenarios cover combined changes, unrelated stated objectives,
an internal shared-dependency behavior change, stale stable-baseline PR checks,
and repository boundaries. The two controls distinguish a relevant compatible
combination from a change requiring no cross-component verification.

## Arms

Every arm runs the same local checks, contract checks, and evaluator bytes.
Differences are test scheduling and version selection, not test availability.

### Arm A: competent existing practice

For each candidate component, run local and contract checks, then run the
end-to-end objective evaluator with that one candidate substituted into the
stable tuple. Do not synthesize concurrent cross-repository candidates during PR
CI. Before deployment, release orchestration runs the evaluator once against the
exact composed tuple. Record both pre-integration and pre-deployment detection.

### Arm B: explicit objective linkage

Use Arm A. Before integration, also combine concurrent candidate versions when
at least two changes explicitly reference `OBJ-LAT-100`, and evaluate that exact
tuple. A successful observation is evidence only for that tuple.

### Arm C: impact-aware objective verification

Use Arm B. Before integration, also select a combined tuple when changed runtime
paths belong to a component in the objective's request path, including a runtime
dependency, even when candidate metadata omits `OBJ-LAT-100`. Docs-only paths are
excluded. These signals mean `may affect`, not authority or proof of impact.

The impact rule is intentionally bounded to the fixture's existing component
dependency and test-ownership information. It is not a comprehensive dependency
graph or a new service.

## Measurements

Primary:

- violating scenarios detected before integration, out of 3;
- violating scenarios detected before deployment, out of 3;
- false-negative scenario IDs at each point.

Secondary:

- false-positive scheduling: combined objective checks for `docs-control`;
- relevant compatible checks executed for `compatible-control` (reported as
  overhead, not a false positive);
- number of local, contract, stable-baseline integration, combined-candidate,
  and release checks;
- evaluator elapsed milliseconds and total process elapsed milliseconds;
- exact version tuple and evaluator content hash for every objective result;
- malformed or missing version evidence;
- required human intervention (expected zero during routine trials).

Compute overhead is descriptive on one Windows host and is not a benchmark.

## Execution and integrity

1. Implement immutable version records, local/contract checks, the deterministic
   evaluator, arm selector, and tests after this protocol and freeze are committed.
2. Preflight the baseline and every version's frozen local/contract expectation.
3. Verify all five scenario oracle values before comparative execution. A mismatch
   invalidates this experiment version; do not tune thresholds or policies.
4. Run all arms from the same fixture in one deterministic command.
5. Persist machine-readable evidence with SHA-256 hashes of protocol, evaluator,
   scenario manifest, objective record, and every version record.
6. Recalculate the report summary from retained evidence and test that
   recalculation.
7. Do not repair scored outputs. Infrastructure defects invalidate the run and
   require a new experiment version.

## Authority and interpretation

- **Objective owner:** owns `OBJ-LAT-100`, its workload, and threshold.
- **Code owners:** review their component implementations; they do not thereby
  gain authority to relax `OBJ-LAT-100`.
- **Decision authority:** uses existing protected review/branch controls to accept
  a consequential objective or constraint change.
- **Evidence authority:** local CI owns component evidence; the end-to-end
  evaluator and release provenance own tuple-specific objective evidence.

The fixture does not authenticate real people or approvals. A candidate may
propose a threshold change, but only an owner-selected protected baseline may
change the evaluator. Agent-authored metadata never authorizes its own exception.

## Decision rule

- Recommend existing mechanisms if exact-tuple release validation catches every
  violation before deployment and the only gap is absent scheduling/configuration.
- Recommend a minimal convention or adapter only if B or C measurably improves
  pre-integration detection with bounded false positives and existing records
  cannot reliably reconstruct objective relationships or evaluated tuples.
- Recommend no new capability if linkage adds no detection or if differences are
  attributable to unequal tests.
- Do not recommend a centralized control plane, universal objective graph,
  Golden Path evidence ledger, self-approval metadata, or mandatory human review
  for routine compatible changes.

## Threats fixed before execution

Synthetic policies, one deterministic workload, author-built changes, known
dependency topology, one host, and one execution limit generalization. The author
is not blinded. Virtual latency demonstrates composition semantics, not production
performance. Arm A lacks a cross-repository candidate merge queue by design but
includes a strong exact-release gate; organizations with a global merge queue can
express Arm C-like scheduling using existing CI. Impact rules may miss dynamic,
operational, data, or organizational dependencies and may over-select in larger
systems.
