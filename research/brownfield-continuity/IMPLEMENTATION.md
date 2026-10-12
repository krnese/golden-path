# Implementation audit

Inspected on 2026-10-12 at Golden Path revision
`041c2c2cf3f89c8575a93a78e4b60102cf3282a0`. This is an audit of the active
implementation, not a restatement of its historical architecture.

## What actually exists

| Question | Observed implementation | What is not established |
| --- | --- | --- |
| Engineering state persisted | Files committed by normal Git workflows; existing issues, ADRs, policies and tests if the adopter has them. The optional [agreement template](../../templates/ENGINEERING.md) provides headings, not a store. | No active intent database, contract schema, state graph, freshness protocol, checkpoint or persisted agent memory. No guarantee the agent writes an earlier conversational decision to any file. |
| Recovery | [Canonical skill](../../.github/skills/golden-path/SKILL.md) tells the agent to read the [method](../../METHOD.md), then use existing authoritative engineering sources. The [discovery pointer](../../.github/copilot-instructions.md) makes that skill discoverable in Copilot. | No recovery script, transcript importer, cross-session reconciliation, compaction hook or automatic conflict resolution. Documents must be found and interpreted by the new agent. |
| Constraints across sessions | Constraints already in repository/issue/design/policy files can survive. The method asks the agent to identify and maintain them. | Session-only constraints do not become durable automatically. Skill availability is not evidence of correct constraint recovery or enforcement. |
| Decisions | Existing issues, ADRs and designs remain the owners. The optional template can fill a gap. "WITHIN DELEGATION" and "DELEGATION CHANGE" are reasoning aids, explicitly not required persisted records. | No decision writer, mandatory decision log, typed transition history or independent acceptance of a decision. |
| Validation | Existing engineering tests/CI/operational systems own truth. The active [CI workflow](../../.github/workflows/golden-path.yml) checks Git patch whitespace only. | Active Golden Path has no application-outcome validator or independent evaluator. A green `validate` job establishes whitespace hygiene, not engineering correctness. |
| Outcome evaluation | Earlier [continuing-delegation research](../continuing-delegation/RESULTS.md) retains a CLI experiment, fixture tests, observations and author-reviewed scoring. It found no boundary-behavior benefit, with a ceiling and higher elapsed time. | That is not production outcome verification, a brownfield continuity experiment or an independently blinded study. Installation and method compliance establish no incremental value. |

The active tree has no plugin manifest or executable package. Its portable
deliverable is a method and canonical skill. The
[retired structured-state implementation](../experimental-v1/README.md) had
schemas and gates, but was removed from active use; Git history is not evidence
that those features remain in today's plugin.

## Actual installed plugin

The installed local OCTO Engineering plugin is version `0.1.0-preview.1`.
Its complete file inventory contained a manifest, README, provenance file,
engineering skill with method/template snapshots, and a separate architecture
skill with OCTO references. It contains no runtime scripts, hooks, custom agents,
MCP server, state persistence or telemetry. Its own README calls it a local
skills-only pilot, not a validated or published release.

For this experiment, the
[retained engineering skill](treatment/skills/engineering/SKILL.md),
[method](treatment/skills/engineering/references/golden-path/METHOD.md),
[template](treatment/skills/engineering/references/golden-path/templates/ENGINEERING.md)
and [manifest](treatment/plugin.json) were copied without content changes.
The unrelated architecture skill was excluded so it could not confound the
engineering comparison. This is an engineering-only extraction, not a test of
full-bundle adoption. [Provenance](source-provenance.json) verifies identical
source/copy hashes and that the bundled and active methods are equal after
normalizing CRLF/LF. Their byte hashes differ solely because of line endings.

This distinction matters: the user's proposed "plugin plus durable engineering
contract" is not an implemented condition. Making treatment agents create a
new contract would change the tested mechanism. The pilot therefore tests the
existing skill's total effect, while leaving the durable-contract hypothesis
explicitly untested.

## Harness support: observed versus plausible

| Harness/surface | Evidence | Scoped conclusion |
| --- | --- | --- |
| Copilot SDK in VS Code | The current investigator session loaded the repository skill and the installed local engineering plugin. | Discovery/loading worked in this session. This session is not a clean control and is NOT an experimental subject. No fresh VS Code handoff or outcome comparison was executed. |
| Copilot CLI 1.0.95 | Unscored clean-home preflight actually invoked `skill(engineering)`, read the method using a tool, and ran five HTTP tests. Control had only two unrelated built-in skills. Both reported `claude-sonnet-5.5`. | The engineering-only plugin extraction is demonstrably usable in this CLI. Native plugin discovery for the repository's differently located canonical skill was not separately tested. |
| Same-CLI fresh context | New UUID and new home per phase; only subject repository files transferred. | Tests conversation-loss recovery, not cross-harness handoff. |
| Native compaction | No compaction event was intentionally triggered or observed by this protocol. | Not tested. Fresh-context restart is a simulation of lost conversational context, not native compaction evidence. |
| Claude Code, Codex, other harnesses | Method documents can in principle be supplied explicitly, as the active README suggests. No second compatible authenticated CLI was located. | Portability of text is not verified plugin integration or cross-harness continuity. Do not claim these are genuinely tested/supported integrations. |

No authorization/disclosure experiment was introduced. Existing local test
identities remain unchanged. The scored operational outcome is reliable
application retry behavior after database/server restart.
