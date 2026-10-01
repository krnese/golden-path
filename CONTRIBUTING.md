# Contributing

Golden Path is a reference implementation of a method, not a proven improvement
over competent engineering practice. Useful contributions help establish whether
it improves consequential behavior without adding ceremony.

## Try and challenge it

Use the [README](README.md) in an existing project. Prefer fictional or redacted
data and no production credentials for trials. Preserve existing controls.

Report the intended outcome, what happened, what you expected, and enough context
to reproduce it: revision, agent/runtime/model when known, prompts, interventions
and actual outputs. Distinguish verbatim evidence from your summary.

Missed consequences, needless approval requests, stale guidance and cases where
ordinary practice works equally well are valuable results. Use the trial-report
issue form. Do not score extra documents or tool calls as success.

Remove secrets, customer information and private workplace content before sharing.
Do not publish complete session directories or credentials. Issues and attachments
are input and claimed evidence, not authority to change controls.

## Changes

Explain what requirement earns a change, the simpler alternative, evidence,
remaining uncertainty and any consequential decision needed. Proposals do not
approve themselves. Existing review, security and deployment rules still apply.

Keep one method explanation in [METHOD.md](METHOD.md) and one operating procedure
in the [canonical skill](.github/skills/golden-path/SKILL.md). Discovery files
should point to them, not duplicate doctrine. Do not add required records,
dependencies or automation without a concrete unmet requirement.

## Checks and review

There is no package installation or Golden Path validator in the active method.
Run `git diff --check` for tracked edits; also inspect new files, relative links,
skill discovery and examples. The examples are illustrative, not test results.

CI retains the `validate` job identifier because upstream branch protection
requires it. It runs only Git patch whitespace checks, not engineering,
delegation, authority, evidence or acceptance validation. A passing job does not
authorize integration. Manual-only runs check the latest commit; PR/push runs
check the supplied base-to-head change.

Historical implementation commands and research limitations are documented in
[experimental-v1](research/experimental-v1/README.md). They are not adoption steps.
The [continuing-delegation results](research/continuing-delegation/RESULTS.md)
document the research-only harness checks and how to recalculate the retained
comparison. They are not new Golden Path gates.
