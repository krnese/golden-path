# Golden Path

**A lightweight engineering method for delegating software development to
increasingly autonomous agents.**

Implementation throughput can exceed accountable human supervision. Golden Path
helps establish what has been delegated, lets agents engineer broadly inside that
boundary, and brings human judgment back when consequences materially change.

**Understand → Bound → Engineer → Prove → Report**

**Delegate broadly. Escalate consequential change. Prove using the systems that
own the truth.**

## Try it in your existing project

1. Give your coding agent the [canonical skill](.github/skills/golden-path/SKILL.md)
   and [method](METHOD.md), or read them yourself. No package installation,
   custom agent or project reorganization is required.
2. Describe the outcome and current change. Use existing issues, ADRs, design
   documents and policies to establish the working agreement.
3. Let the agent investigate and implement within that agreement, use your
   existing checks, and report what was established and what remains uncertain.

For native skill discovery, install the skill and its linked method together in
a location supported by your runtime, preserving or updating their relative link.
This repository uses `.github/skills/golden-path/SKILL.md`; automatic discovery
varies by runtime. Explicitly supplying both documents is the fallback.

The optional [engineering agreement template](templates/ENGINEERING.md) helps
when the necessary information is missing. **Do not create another agreement
when equivalent authoritative information already exists.**

## Two behaviors

- **WITHIN DELEGATION:** proceed autonomously inside the established boundary,
  subject to existing repository and platform controls.
- **DELEGATION CHANGE:** surface a consequential change rather than silently
  redefining the assignment. Explain the consequence and the decision needed.

See [work within delegation](examples/within-delegation.md) and
[a delegation change](examples/delegation-change.md). These examples illustrate
intended behavior, not proven reliability.

## What this is not

Golden Path is a **reference implementation of an engineering method**, not a
platform, control plane or authorization system. Git, review, tests, evaluations,
CI/CD, identity, security, deployment, provenance and observability systems remain
authoritative. Existing mandatory review still applies.

There is no required engineering graph, evidence ledger or Golden Path approval
state. The skill grants no authority, does not guarantee detection of consequential
changes, and does not prove outcome success.

## Try it and challenge it

This packaging has **not demonstrated incremental value over competent existing
engineering practice**. The question is whether it improves consequential
engineering behavior without adding material ceremony.

[Report what happened](CONTRIBUTING.md), including unnecessary questions, missed
consequences and cases where ordinary practice worked equally well.
[The research history](research/experimental-v1/README.md) explains why the
earlier structured-state architecture was not retained.

This repository's required `validate` check now checks Git patch whitespace only.
It does not validate engineering correctness, delegation, authority, evidence or
acceptance.
