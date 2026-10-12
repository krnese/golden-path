# Distributed engineering coherence: existing mechanisms suffice

## Decision

**Adopt existing engineering mechanisms; do not add a Golden Path capability.**

The experiment supports the narrow hypothesis that objective linkage and impact
selection can move detection earlier when independent repositories test concurrent
changes only against a stable baseline. It does **not** show that existing CI/CD
is inadequate: the competent exact-version release gate detected all three
violations before deployment in every arm. Arm C is expressible as selective
integration-test configuration using existing dependency, test-ownership, merge,
and release systems.

A small, tool-neutral convention is useful where current systems lack it:
objective checks should retain the exact component-version tuple and evaluator
identity; candidate orchestration should select those checks from explicit
objective references plus bounded impact signals. This is CI configuration and
provenance, not a Golden Path ledger, schema service, or authorization system.

## What was frozen and executed

The protocol was committed as
`d731dbe71c8cc3a5497e1c1051fd3e29818cffb4` before fixture code. It pins Golden
Path baseline `041c2c2cf3f89c8575a93a78e4b60102cf3282a0`, five scenarios, three
arms, expected outcomes, metrics, and decision rules.

The equivalent multi-repository fixture has independently versioned `gateway`,
`worker`, and `transport` components. `OBJ-LAT-100`, owned by the fictional
Performance Council, requires maximum virtual end-to-end latency no greater than
100 ms. Every change has a legitimate purpose, passes its local check, preserves
its public interface contract, and occupies a separate component/version
namespace. The shared evaluator is identical in all arms.

The authoring agent implemented all changes independently within this fixture;
multiple independently sampled coding agents were not run. The experiment tests
coordination and version selection after competent, locally valid changes, not
variation in implementation quality.

## Existing engineering capability baseline

| Existing mechanism | What it can establish | Boundary observed here |
| --- | --- | --- |
| Git and merge queues | Candidate identity, ancestry, same-repository queued composition | No semantic conflict inference; separate repositories need a shared candidate manifest or orchestrator |
| CI/CD and integration tests | The objective for the exact composition they execute | Per-repository PR CI against a stable tuple did not cover concurrent cross-repository candidates; the release gate did |
| Contract testing | Interface compatibility and provider/consumer expectations | All interfaces remained unchanged while latency composition failed |
| Dependency analysis and build graphs | Candidate impact and selective-test reachability | Useful Arm C input; incomplete for dynamic, data, operational, or undeclared dependencies |
| CODEOWNERS and branch protection | Review routing, protected changes, and approval enforcement when configured | Code ownership alone neither owns `OBJ-LAT-100` nor proves authorization to relax it |
| Issues, epics, ADRs, requirements | Stable objective, rationale, owner, and contributor references | Contributor intent does not enumerate every change that may affect the objective |
| Deployment manifests and provenance | Exact integrated versions; strong input to tuple-specific evaluation | Usually later than independent PR evaluation unless candidate orchestration exposes the tuple earlier |
| Telemetry and outcome evaluation | Real operating outcome for deployed/canary versions | Valuable confirmation, but later than merge-time prevention and sensitive to workload representativeness |

The current Golden Path method asks engineers to use these systems and makes no
reliability claim. The inspected opt-in engineering-contract pilot independently
observes declared Git scope and baseline-owned checks, but does not discover
cross-repository, undeclared objective impact. The brownfield-continuity study
tests session recovery, not combined-version coherence. Neither was modified or
duplicated.

This experiment's difference is **not missing test coverage**: every arm had the
same evaluator. The pre-integration difference is test scheduling and candidate
version selection. A configured global merge queue, integration environment, or
release orchestrator could implement Arm C without Golden Path.

## Comparative results

| Measure | Arm A: existing practice | Arm B: explicit linkage | Arm C: impact-aware |
| --- | ---: | ---: | ---: |
| Violations detected before integration | 0/3 | 1/3 | 3/3 |
| Violations detected before deployment | 3/3 | 3/3 | 3/3 |
| Missed before integration | declared, unrelated, shared dependency | unrelated, shared dependency | none |
| Local checks | 10 | 10 | 10 |
| Contract checks | 10 | 10 | 10 |
| Candidate-vs-stable objective checks | 10 | 10 | 10 |
| Combined-candidate objective checks | 0 | 1 | 4 |
| Exact-release objective checks | 5 | 5 | 5 |
| Docs-control combined checks | 0 | 0 | 0 |
| Relevant compatible combined checks | 0 | 0 | 1 |
| Evaluator elapsed time | 17.071 ms | 23.353 ms | 27.612 ms |

Arm B's one additional check found only `declared-pair`. Arm C added four checks
relative to Arm A: the three consequential combinations and one relevant
compatible control. The compatible check passed at 91 ms and is measured overhead,
not a false positive; the frozen docs-only false-positive count was zero. Arm C's
observed evaluator overhead versus A was 10.541 ms on this synthetic run. Timing is
descriptive and too small/noisy to generalize. No routine scenario required human
intervention.

### Exact release tuples evaluated

All observations used evaluator SHA-256
`2b3ffb780e815e8c18a6419e60bf7155206f70ae85797b604444e991b01ccb93`.

| Scenario | Gateway | Worker | Transport | Max latency | Objective |
| --- | --- | --- | --- | ---: | --- |
| declared pair | `1.1.1-retry-linked` | `1.1.1-enrichment-linked` | `1.0.0` | 101 ms | fail |
| unrelated pair | `1.1.0-retry-unlinked` | `1.1.0-enrichment-unlinked` | `1.0.0` | 101 ms | fail |
| shared dependency | `1.1.0-retry-unlinked` | `1.0.0` | `1.1.0-backoff` | 101 ms | fail |
| compatible control | `1.1.0-retry-unlinked` | `0.9.1-fast` | `1.1.0-backoff` | 91 ms | pass |
| docs control | `1.0.1-docs` | `1.0.0` | `1.0.0` | 40 ms | pass |

The complete evidence records every candidate-vs-stable tuple as well as release
tuples. A green result is not generalized to an unobserved composition.

## Scenario interpretation

1. **Combined violation:** retry and enrichment each passed local, contract, and
   stable-tuple tests; together they reached 101 ms.
2. **Unrelated stated objectives:** reliability and completeness changes omitted
   `OBJ-LAT-100`; explicit linkage missed them, while path impact selected them.
3. **Shared dependency without interface change:** retry and a larger internal
   backoff reached 101 ms; contract tests remained green.
4. **Stale integration baselines:** each candidate substituted into the stable
   tuple passed; only the combined tuple failed.
5. **Repository boundaries:** every interaction crossed independently versioned
   component namespaces and had no textual merge conflict.
6. **No extra verification:** all arms scheduled zero combined checks for the
   docs-only control. Arm C correctly checked the runtime-relevant compatible
   composition and observed a pass.

## Authority, ownership, and provenance

- **Objective ownership:** the Performance Council owns the threshold, workload,
  and evaluator selection.
- **Code ownership:** component owners review gateway, worker, or transport code.
  This routes expertise but grants no authority to weaken `OBJ-LAT-100`.
- **Decision authority:** existing protected review must accept a consequential
  threshold or workload tradeoff. Routine implementations need no new approval.
- **Evidence provenance:** component CI owns local/contract evidence; the
  integration/release system owns exact-tuple objective evidence.

Candidate version records can say `contributesTo`; they cannot change the frozen
threshold or authorize an exception. If an integrated tuple must ship above
100 ms, the unresolved decision belongs to the objective authority, not to the
agent that authored a metadata field. The fixture models this separation but does
not authenticate real identities or approvals.

## Irreducible requirement

Existing sources cannot always reconstruct:

1. contributor intent (`contributes to`) when it was never recorded;
2. every possible impact (`may affect`) from static dependencies alone;
3. the concurrent candidate set before an orchestrator composes it;
4. authorization from an agent-authored assertion; or
5. which composition a detached green check actually evaluated.

The smallest sufficient persistent relationships are therefore:

- an owner-controlled objective reference to its evaluator and constraints;
- the exact candidate/deployed component-version manifest;
- tuple-bound check evidence including evaluator identity;
- optional contributor references for intent;
- fallible impact selection from existing runtime paths, dependencies, and test
  ownership; and
- authorization retained in the existing protected review system.

The authoritative component for each fact should remain the system that already
owns it: issue/ADR or acceptance test for the objective, build/dependency system
for impact signals, merge/release manifest for versions, CI/telemetry for evidence,
and code-host/IAM controls for authorization.

## Threats to validity

- One author-built, synthetic, deterministic latency model and one threshold.
- Three small components with known topology and no dynamic dependencies.
- One execution per arm; elapsed-time comparisons are not performance benchmarks.
- No independently sampled agents or human engineers; local plausibility was
  designed and tested, not externally rated.
- Arm A intentionally lacks a cross-repository candidate merge queue but includes
  a strong exact-release gate. Organizations with such a queue may already behave
  like Arm C before merge.
- Impact selection can miss runtime configuration, data shape, traffic,
  organizational, or operational relationships and may over-select in large
  systems.
- Virtual latency proves deterministic composition only. It does not establish
  production latency, workload representativeness, or operational reliability.
- Objective owner and authority are fictional; no real approval mechanism was
  tested.

## Architectural conclusion for leadership

Independent changes can be locally correct and jointly violate an objective
without merge conflicts or interface changes. The important boundary is not a
new coordination database: it is whether an existing integration or release
system evaluates the **right objective against the exact composed versions**.

Explicit intent links improve early detection only for declared relationships.
Bounded dependency/test-ownership signals can schedule more relevant checks, but
they remain fallible. In this experiment, existing exact-version release
validation prevented every bad deployment, so no new Golden Path control plane or
evidence ledger is justified. Configure current CI/orchestration to retain tuple-
specific evidence and, where earlier detection matters, add a small impact-aware
selection adapter. Avoid universal objective graphs, self-authorized exceptions,
duplicate approval stores, and mandatory human review of routine compatible work.
