# Your first task with Golden Path

**Tell Copilot what you want. Agree what a good result looks like. Let it do the
work, then look at the result.** That is the everyday experience.

You do not need to learn a new agent, write a formal specification or start by
running this project's tests. Golden Path works with Copilot's normal agent in
VS Code. You bring the goal and your knowledge of what matters.

[Back to the documentation index](../README.md#documentation)

## 1. Add Golden Path to your project

Open **your own project** in VS Code, open Copilot Chat, and select Agent mode.
For a new project, [use the Golden Path starter template](https://github.com/krnese/golden-path-starter/generate)
to create a fresh repository, clone it and open it in VS Code. The method is
already installed there; continue with your first task below. You still need to
agree real examples and configure any stronger checks and review settings.
For an existing project, stay in its current repository; do not migrate it into
the template.

If Golden Path is not installed, you can ask Copilot to help with setup:

> Help me add Golden Path to this project using the instructions at
> https://github.com/krnese/golden-path.
> Check the prerequisites and any existing Golden Path setup first.
> Explain the files you plan to change and ask before installing.
> Start with the method-only option (Level 1).
> Do not replace existing configuration or change my project's tests.
> Tell me what is installed and what is not enforced.

This is a request to your assistant, not a one-click installer. It needs access
to the public repository and permission to use the relevant tools. If something
is missing, it should explain what you need instead of claiming setup succeeded.
The installer needs Node.js 22+ and git.

Already installed? Say:

> Help me use Golden Path for this task. Inspect what is already configured,
> reuse our existing checks and review process, and explain what is missing or
> unverified before proposing setup changes. Do not change settings or run
> discovered project commands just to inspect setup.

The skill includes guided adoption for both new and existing projects. Its
[read-only report](ADOPTION.md#read-only-adoption-report) can inspect configuration;
it cannot approve your examples or prove the client invokes its controls.
For a new project, work in your application repository or a small application
template, not this kit's development tree. Existing projects stay where they are;
there is no migration to a Golden Path template.

**The simple starting option adds the skill and project instructions. It does
not automatically run checks or protect acceptance.** Start a new Copilot chat
after setup so the project instructions can be picked up. If your team already
has a checked setup, use it; do not downgrade it.

Prefer doing setup yourself? From a clone of Golden Path, run:

```bash
node plugin/install.mjs --target "<your-project-folder>" --level 1
```

Replace the folder placeholder with your own project's location. The
[adoption checklist](ADOPTION.md) is for you or a teammate who wants to add
automatic checks and protected acceptance later.

## 2. Say what you want, in ordinary words

Choose a small, useful improvement. For example:

> Use Golden Path for this task.
>
> Our invoice screen is hard to understand. I want someone to see immediately
> whether an invoice is ready to approve or needs review, and why.
>
> Keep the existing tax and discount calculations unchanged. First restate the
> goal and propose a few examples we can agree on before you change the code.

That is enough to start the conversation. You can link an existing issue,
document or screenshot instead of repeating it. No special form is required.

**What you should see:** Copilot explains the outcome it understood, identifies
what must stay unchanged, and asks about decisions that actually affect the work.

## 3. Agree a few examples

Examples are easier to approve than a long technical plan. For the invoice task:

| When this happens | I expect this |
| --- | --- |
| The invoice has no issues | It clearly says it is ready to approve |
| A product appears twice | It needs review and names the duplicated product |
| The invoice exceeds our agreed limit | It needs review and explains the reason in plain words |

These are illustrative expectations, not ready-made rules for your business.
Agree the actual limit and who owns its meaning before implementation.

You can reply:

> Those examples look right. Use our current approval limit from the linked
> policy. Show me how you will check each example, then implement the change.
> If meeting it would require changing an agreed rule, bring that decision back
> to me rather than changing the target.

For a protected setup, your developer or Copilot can propose automated tests;
the person responsible for the rule approves their meaning through the team's
normal review process **before the implementation session begins**. You do not
have to author the test code yourself. Ask for a table you can approve without
reading code:

> Turn these examples into acceptance tests as a separate change for me to
> approve. Start each test name with its example's ID, and give me a table:
> example, test, what it checks.

Method-only instructions cannot enforce
that boundary; protected acceptance and required CI provide the stronger control.

## 4. Let Copilot work, then ask to see it

Stay with your usual Copilot agent. When it finishes, ask:

> Show me the actual result for each example we agreed on, next to what I
> expected. List cases the examples don't cover and what you chose for them.
> Tell me what changed, which checks passed on the pull request, and anything
> that is still uncertain.

Look at the output, not just the word "done". A screenshot, preview or example
response often tells you more than a test count.

In a configured checked setup, the local gate runs your project's checks and
returns feedback. Required CI checks the pull request independently. In the
method-only starting option, neither happens automatically just because you
installed Golden Path.

Your normal review and merge rules still apply.

### Record your judgment

On a Golden Loop issue, comment with one of these exact phrases, then explain
your reasons:

- `Owner judgment: meets the need`
- `Owner judgment: needs revision`
- `Owner judgment: cannot yet judge`

This repository's Golden Loop automation can reopen a labelled issue automatically
closed by a merged change before owner judgment. That automation is not included
in the normal kit installation; do not assume your repository has it. Without it,
record your judgment through your existing issue or PR process. After recording
your judgment, close the issue yourself when appropriate.

## 5. Give the next useful piece of feedback

You do not have to get every detail right on the first attempt:

> The screen is clearer, but "over_threshold" isn't useful wording for our
> reviewers. Please use a plain sentence explaining why it needs review.

If that changes approved acceptance, the owner approves the revised examples
first; start a new agent session afterwards. Otherwise Copilot can improve the
implementation within the existing agreement.

This is the loop: **your goal → agreed examples → implementation → real evidence
→ your next decision**.

[See this happen in the real two-round invoice trial](examples/golden-loop/README.md).

## When something doesn't go smoothly

| What you see | What to do |
| --- | --- |
| Copilot misunderstood the goal | Correct its restatement and give one concrete example |
| A check fails | Ask it to explain the failure and fix the implementation, not weaken the agreed test |
| It says a rule must change | Decide whether the rule should change; involve its owner |
| It says FAILED or UNVERIFIED | Ask what remains unresolved. Stopping is not the same as passing |
| Tests pass but the result feels wrong | Show the gap in the actual output; improve the examples with the owner |
| You want to undo setup | Use the documented uninstall, rather than manually removing shared instructions |

Uninstall from your Golden Path clone with:

```bash
node plugin/install.mjs --target "<your-project-folder>" --uninstall
```

Do not add force flags to bypass modified-file warnings. Your project still
belongs to you.

## Where to go next

- [Quickstart](../README.md#quickstart): installation choices and the optional local demo.
- [Adoption checklist](ADOPTION.md): a teammate's setup guide for automatic checks and protected acceptance.
- [Background](background.md): why the approach evolved this way.
- [Evidence and limits](evidence.md): what is demonstrated and what remains unproved.

**Start with one real task, not with running our test suite.** Golden Path is
there to help you get a result you can understand and decide about.
