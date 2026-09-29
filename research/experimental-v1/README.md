# Structured-state experiment: retired architecture

This directory is research history, not active instructions or an adoption path.
The JSON files are frozen experimental protocols, not a current engineering
schema, approval system or required project state.

## Historical implementation

- Exact baseline: `c32b4aca3af0e7c8c6e7f300e275700ff0937da7`
- Annotated tag: `experimental/structured-state-v1`
- Migration approval: 2026-09-29; replace the active architecture with a minimal
  method, preserve Git history and selected research, and retain only one
  canonical skill. No external protection change was authorized.

The tag was created locally before migration. Publishing it requires separate
authorization; another clone may need to use the exact commit until it is shared.
The commit, not the presence of a tag in a particular clone, identifies the
historical source.

Inspect it without changing the working tree:

```text
git show experimental/structured-state-v1:README.md
git ls-tree -r --name-only c32b4aca3af0e7c8c6e7f300e275700ff0937da7
git show c32b4aca3af0e7c8c6e7f300e275700ff0937da7:scripts/validate.mjs
```

For historical execution only, use a separate disposable checkout of that commit.
It contains the original manifests, locked dependencies, schemas, tests, governing
records, delivery gate and documentation. Its Node 24 commands were
`npm ci --ignore-scripts`, `npm run check` and
`npm run validate -- --base <full-sha>`. Installation and execution require your
normal permissions. None of these are commands for the active method.

No source archive is embedded here. Git preserves the implementation.

## What was tested

The earlier architecture required typed engineering artifacts, a derived graph,
implementation bindings, declaration-transition validation, evidence records and
a pure delivery-admission gate. It provided real structural checks, but no live
delivery adapter or general verification of implementation effects.

Selected predeclared protocols are preserved without editing:

- [Continuity versus conventional documentation](continuity-protocol.json)
- [State/procedure ablation](state-ablation-protocol.json)
- [Candidate-transition policy comparison](transition-protocol.json)

[Results and limitations](RESULTS.md) retain the unfavorable findings and the
reason for the product decision. [Selected transition output](transition-output.txt)
contains labeled verbatim excerpts, not a complete execution archive.

These protocols/results were originally retained outside the source repository.
Their inclusion here is historical preservation, not a new run. Original protocol
paths refer to that local experiment environment. Full session transcripts,
temporary repositories, credentials and external workplace exports are not
included. This selection alone is not a complete reproduction package or an
independent verification of every observation.

## Why the architecture was not retained

Structured state did not demonstrate material continuity advantage over excellent
documentation or superior consequential reasoning in the tested scenarios.
A compact conventional policy implementation reproduced the demonstrated
deterministic acceptance/refusal results. The common candidate/proof/acceptance
semantics were not established, and undeclared effects remained undetected.

The broader architecture therefore did not earn its complexity. This does not
prove that structured contracts are never useful; it does remove the evidence
basis for prescribing this model to every adopter.

## Controls retired by the migration

| Retired active check | Disposition |
| --- | --- |
| Required artifact kinds, fields, references and single-owner graph | Retired with the model; not replaced by Markdown records |
| Workload/acceptance/evaluation graph coverage | Existing tests and evaluation owners determine applicable proof; no equivalent universal graph guarantee remains |
| Approved active ancestry and declared authority-transition comparison | Golden Path approval records retired; real review, IAM, security and delivery policy retain their own authority, not equivalent declaration guarantees |
| Exhaustive file bindings and agent/skill metadata restrictions | Retired; runtime controls and repository review remain responsible for their actual boundaries |
| Evidence-location and evidence-presence checks | Parallel evidence records retired; use actual retained results and provenance |
| Synthetic delivery-admission predicates and lifecycle record shapes | Preserved in Git, not replaced by another admission engine |
| Framework npm tests and dependency audit | Retired with the active Node implementation and dependency manifests |

Upstream GitHub rules were read back during migration: PR-based integration,
required `validate` check, force-push protection and deletion protection; zero
required approving reviews. No external configuration was changed.

The retained `validate` job now checks patch whitespace only. Its green result
does not preserve the retired guarantees or prove engineering correctness,
delegation, authority, evidence or acceptance. Required-check enforcement and
human judgment are distinct; shared human/agent credentials remain a limitation.

The next hypothesis is only whether packaging the method improves consequential
engineering behavior without material ceremony over competent existing practice.
That has not been tested. The active examples are illustrations, not results.
