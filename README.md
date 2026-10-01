# Golden Path

**Implementation throughput can exceed accountable human supervision.**

Golden Path explores a deliberately small engineering method for delegating work
to agents without silently expanding what has been accepted:

**Understand → Bound → Engineer → Prove → Report**

**Delegate implementation broadly within accepted boundaries. Escalate
consequential change. Prove using systems that own truth.**

## What it asks you to do

Understand the intended result and existing system. Establish the delegated work,
constraints and permitted effects using existing issues, designs and policies.
Let the agent make implementation choices within those boundaries. If a
consequential change appears necessary, pause the affected action and surface the
decision to the appropriate owner; continue separable permitted work.

Use existing tests, review, CI and operating evidence. Report what changed, what
the evidence establishes and what remains uncertain. Humans remain accountable;
the method does not guarantee recognition of consequential change.

## What this is not

Golden Path is **not** an agent runtime, orchestration framework, agent
architecture, governance platform, state machine, policy engine or new system
of record. It does not replace Git, CI/CD, IAM, deployment systems, telemetry or
existing engineering practice. Those systems retain their authority and controls,
including mandatory review.

There are no required Golden Path records, graphs, approval states or ledgers.
The skill grants no permissions, and implementation success is not outcome proof.

## Evidence, not promises

This project is intentionally experimental and falsification-driven. Claims must
be compared with **competent conventional engineering practice**, not a weak
baseline. If Golden Path adds no incremental value, **NO CHANGE** is the correct
result.

- Earlier structured-state experiments did not earn their complexity; the
  architecture was retired. [History and limitations](research/experimental-v1/README.md).
- The lightweight method's continuing-delegation experiment returned **NO CHANGE**:
  both groups handled 12/12 consequential cases and 6/6 benign cases correctly.
  Golden Path made uncertainty more explicit but did not improve boundary
  behavior; median total elapsed cost was 13.9% higher.
  [Results and limitations](research/continuing-delegation/RESULTS.md).

These small synthetic experiments do not establish general reliability or
business-outcome improvement. The method's incremental value remains unproved.
Keep what helps; do not add machinery to preserve a hypothesis that failed.

## Start here

Read [METHOD.md](METHOD.md), or supply it and the
[canonical skill](.github/skills/golden-path/SKILL.md) to your coding agent.
Describe real work using your existing authoritative sources and checks.
No package installation, custom agent or project reorganization is required.

The skill is a portable procedure, not a runtime integration. For native
discovery, install the skill and method together in a supported location,
preserving their relative link; discovery varies by runtime. Supplying both
documents explicitly is the fallback.

| Find | Where |
| --- | --- |
| Current proposal | [Method](METHOD.md) and [skill](.github/skills/golden-path/SKILL.md) |
| Practical illustrations, not evidence | [Examples](examples/README.md); [optional agreement template](templates/ENGINEERING.md), only when existing guidance is insufficient |
| Research designs and reproduction | [Continuing-delegation protocol](research/continuing-delegation/PROTOCOL.md); [retired experiments](research/experimental-v1/README.md) |
| Observed evidence and limitations | [Continuing-delegation results](research/continuing-delegation/RESULTS.md); [earlier results](research/experimental-v1/RESULTS.md) |

[Report failures, unnecessary escalation and equal results](CONTRIBUTING.md).
This repository's `validate` CI job checks patch whitespace only, not engineering
correctness, authority, evidence or acceptance.
