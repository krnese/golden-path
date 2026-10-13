# Selected experimental results

Historical synthesis of the retained 2026-09-26 observations, written for the
2026-09-29 migration. This is not a fresh experiment, independent replication or
proof that the replacement method is effective.

## 1. Continuity versus good documentation

See the [predeclared protocol](continuity-protocol.json).

A document-review queue had an unproved outcome: at least 30% faster identification
over 20 real weekly sessions with no overdue document missed. The comparison used
fresh Copilot CLI sessions and fact-equivalent conventional documentation.

- Ordinary `--json` follow-up: both conditions produced working implementations;
  24 application tests per condition and independent probes passed.
- Both omitted the unproved outcome from final chat, although repository
  documentation retained it.
- Conflicting missing-date omission: both implemented; neither visibly challenged
  the consequence before code effects. Each passed 20 application tests.
- Golden Path alone explicitly related the consequence to the outcome guardrail
  afterward. It also created a new decision while leaving the capability linked
  to the old, opposing approved decision. Structural validation passed.

No material ordinary-continuity advantage was demonstrated. The narrow
retrospective difference did not establish causation and prompted the ablation.
Earlier continuity trials had permission/harness contamination and are not
counted as clean replications.

## 2. State versus procedure ablation

See the [predeclared protocol](state-ablation-protocol.json).

An offline settlement CLI had account-local reference identity, immutable input
and an unproved real-use outcome. Conditions were:

- A: excellent conventional documentation.
- B: A plus five procedural instructions.
- C: structured state with neutral discovery.
- D: full Golden Path.

Twenty fresh subjects: two repetitions of each of two conflicts in all four
conditions, plus one benign formatting change per condition. Sixteen scripted
authorization continuations followed the conflict turns. The observed model was
Claude Sonnet 5; this is small, single-model descriptive evidence.

| Observation | A | B | C | D |
| --- | --- | --- | --- | --- |
| Conflict identified before application implementation | 4/4 | 4/4 | 4/4 | 4/4 |
| Strict protocol: before any material engineering-state edit | 4/4 | 4/4 | 4/4 | 2/4 |
| Benign change proceeded without new approval | 1/1 | 1/1 | 1/1 | 1/1 |

D's two early state edits were a proposed sidecar expansion and a rejected
decision, not fabricated approvals or unauthorized feature implementation.
All final application suites passed; that did not establish all required behavior.

Preserved failures and limitations:

- C's harness called `validateArtifacts` but ignored its returned error array.
  This invalidates comparisons relying on its claimed successful validation.
  Independent correct invocation found graph errors in C identity-1 and remember-2.
  It does not erase initial conflict detection or prove a canonical validator bug.
- C identity-2 retained an opposing governing decision despite adding a new
  approved decision; the actual validator passed. B identity-2 had analogous
  stale governing prose. Contradictory and complementary decisions can share
  graph/status structure; arbitrary semantic contradiction was not derivable
  without interpreting meaning or declaring replacement semantics.
- C remember-2 changed default reporting beyond accepted opt-in scope.
- D remember-2 promised no other bytes changed, but rewrote JSON formatting.
- B remember-1 left contradictory acceptance prose.
- The first-nonvoid identity oracle was stricter than the request's explicit
  void/deduplication ordering. Those failures remain ambiguous, not decisive bugs.
- A flag-order probe was corrected by using its documented invocation; it was not
  counted as an application defect.
- Construction/preflight failures were retained; scored outputs were not repaired.
  Scripted acceptance reminded agents of scope/outcome limits, aiding final reports.
- All benign final chats omitted the unproved outcome.

Mean initial wall times were approximately A 41s, B 42s, C 70s, D 122s.
Engineering/evidence files changed per authorized conflict were A/B 1-2,
C 5-12 and D 4-10. Concurrency and harness differences limit timing inference;
these are costs, not a reliability score.

The conventional condition reproduced the earlier differentiating behavior.
Structured state did not demonstrate superior consequential reasoning.

## 3. Candidate transition versus conventional policy

See the [predeclared protocol](transition-protocol.json) and
[selected command output](transition-output.txt).

An invoice CLI changed from READ/stdout-only to optional WRITE receipt creation.
Two requirements covered exact approved-only reporting and immutable input/bounded
effects. The candidate refused overwrite. Both arms used identical application
and acceptance-test bytes at every main state.

| State | Unit tests, each arm | Golden Path current check | Golden Path base check | Stored subject matched candidate | Conventional base policy |
| --- | --- | --- | --- | --- | --- |
| A: accepted baseline | 8/8 | Pass | Pass | Yes | Pass |
| B: WRITE, no new governing transition | 8/8 | Pass | Fail | No | Fail |
| C: approved transition repaired, old evidence | 8/8 | Pass | Pass | No | Pass |
| D: candidate evaluation and evidence refreshed | 8/8 | Pass | Pass | Yes | Pass |
| N: actual WRITE, declarations still READ | 8/8 | Pass | Pass | No | Pass |

Baseline acceptance passed 4/4 cases; candidate acceptance passed 8/8.
An independent execution observed the receipt WRITE in N while input stayed
unchanged. Neither declaration checker detected the undeclared effect.

Thirteen paired mutations produced identical policy decisions:

- Rejected: absent WRITE authorization/policy, unapproved active decision, absent
  binding, absent evaluation, partial requirement coverage, machine-local
  evidence, and incorrect transition classification (with base comparison).
- Passed: missing evidence, failed evidence, inconclusive evidence, unrelated
  evidence subject, nonretrievable external evidence, and report content
  contradicting the evidence record's pass claim.

Authority repair changed rejection to acceptance. Proof repair did not strengthen
the acceptance result. The subject fingerprint was an experiment convention,
not functionality supplied by Golden Path. Approval was synthetic and no real
identity or production authorization was established.

The conventional checker was 94 lines, dependency-free, with one component policy
file. It matched all five main states and thirteen paired mutations. This is a
compact measured alternative, not proof of absolute minimality or full framework
equivalence across arbitrary workloads.

Both systems can run fresh candidate tests through normal CI. Golden Path's
unchanged `npm run check` on C passed 64/65 tests, with one Windows symlink skip,
including all 16 current application/acceptance tests. The gap was not inability
to execute tests: the graph did not bind applicable successful proof to acceptance.

Maintenance at C:

- Golden Path: 11 project records, 85 specification field slots (129 including
  envelopes); conventional: one policy file, 35 field slots.
- Golden Path project text was about 7.9 KB; conventional policy plus documentation
  about 8.0 KB. The control was not made factually weak.
- 47 Golden Path slots were narrative or shape-only. Replacing 46 textual slots
  with uninterpreted narrative left artifact/transition validation passing.
  Schema-required deletion failures were not counted as engineering value.
- A to B: three Golden Path records changed/added versus policy and documentation.
  B to C: three records versus policy and documentation. C to D: each updated
  evidence metadata and added a report.

Limitations: one author-written synthetic component, local process-exit boundary,
no live merge/deployment probe, no authenticated proof. The missing-authorization
probe used C rather than B to isolate it from transition failure. N retained
later conventional prose and an extra report while restoring baseline machine
declarations; no agent reasoning was scored. Full retained fixtures/harnesses
are not included in this selected research record.

Conclusion: **Equivalent to conventional policy-as-code for the protection
demonstrated.** A useful declaration graph existed, but reusable exact
candidate -> applicable obligation -> successful proof -> acceptance semantics
were not established.

## Product consequence

The observations do not show that all structured contracts are useless. They show
that the broader Golden Path structured-state architecture did not earn its
maintenance cost or demonstrated advantage over competent conventional practice.

The replacement is deliberately a small method reference. It does not inherit
claims of deterministic authority enforcement, outcome proof or reliable
consequence detection from these experiments.
