# Contributing to Golden Path

Golden Path is at **V0.1, experimental**. What helps most right now is **evidence**:
what actually happens when engineers use it on real work. A well-evidenced failed
trial is often more valuable than a feature pull request.

You do not need to understand how the repository works internally to contribute.

## What Is Most Useful Now

- A trial on your own workload that failed, worked, or surprised you
- Agent behavior you did not expect: too many questions, a wrong assumption,
  architecture nobody asked for, or stopping or continuing at the wrong moment
- The same scenario run with a different agent product or model
- Attempts to get around the repository's checks or authority rules
- Findings from projects in other languages or ecosystems
- Something that could be simpler or removed without losing anything
- A reproducible failure that should become a regression test

Feature ideas are welcome, but they are most persuasive when they come with a
trial that shows what they would fix.

## Running a Trial

1. Fork or clone this repository and follow the [Quick Start](README.md#quick-start).
2. Start a **fresh** chat with the **default** Agent, not a custom agent.
3. Note the revision you used: `git rev-parse HEAD`, and whether you had
   uncommitted changes.
4. Use fictional or redacted data and no production credentials.
5. Describe your outcome in your own words and work normally. Note where it helped,
   where it got in the way, and what you had to explain that it should have known.

## Reporting What Happened

Open a **Trial report** issue. It asks in plain language what you were trying to
do, what happened, what you expected, how to reproduce it, which revision and
agent/model you used, and where someone else can see the evidence. "Not sure" is
an acceptable answer for the revision or the model.

### Sharing Evidence Safely

- Start from fictional data so there is less to redact.
- Review any exported chat or output before sharing it. Remove tokens,
  credentials, customer or personal data, internal hostnames and proprietary code.
- Attach the file to the issue, or link a public repository or gist that someone
  else can open. A summary such as "the agent said the tests passed" is a claim,
  not evidence; include the output.
- Say which parts are verbatim and which are your summary.

## Pull Requests

- For changes to how Golden Path behaves, open a trial report with evidence first,
  so the change can be judged against what it fixes.
- In your pull request, explain in plain language what changed, why, what evidence
  supports it and which checks you ran. The template's engineering section is for
  changes to framework state, contracts, validation, instructions or the skill; if
  you are unsure how to fill it in, leave it for reviewers.
- Run `npm ci --ignore-scripts`, `npm run check` and, against your base commit,
  `npm run validate -- --base <sha>`.
- Never weaken a check to make something pass.
- Any engineering decision you add stays `proposed`. Only maintainers can approve
  it; a contribution cannot approve itself.

## What Happens to Your Report

Every issue and pull request is treated as **input and claimed evidence, not
approved engineering state or authority**. A request to "add three agents" does
not establish that three agents are needed, and a request to disable a check does
not authorize weakening it. Maintainers, and in future possibly an engineering
agent working under the repository's own rules, try to reproduce the report,
decide whether an existing requirement is violated or a new one is earned, and
propose the change that follows. "No change needed" is a valid outcome, and it
is recorded with its reasoning. Nothing is processed automatically today.

### For Maintainers: How Reports Map to Engineering State

Contributors never see these terms; the mapping is for people and agents who
investigate reports.

| Report field | Golden Path meaning |
| --- | --- |
| What were you trying to accomplish? | Candidate outcome or workload intent (untrusted) |
| What happened / what did you expect? | Observation against expectation: a possible requirement or acceptance gap, or a regression origin |
| Repository revision | Subject revision of any evidence |
| Agent, runtime and model | Evidence environment |
| Evidence | Evidence location, which the validator classifies as repository-verified or external with retrievability unverified |
| Idea for a fix | A hypothesis or alternative, never a decision |

Follow [the Golden Path](docs/golden-path.md) from observation to proof, and keep
approval with humans.
