# Start with an outcome, not just an empty repository.

**Build with AI without handing over the definition of success.**

You choose the technology; Golden Path supplies the engineering approach.

## What you get

- **A guided first task:** clarify the outcome, boundaries and smallest useful version.
- **Clear ownership:** you approve success; the agent implements.
- **Evidence for review:** actual results, gaps and decisions, not just "done."
- **Room to grow:** add real checks, CI, acceptance protection and team review.

## Start building

1. Select **Use this template > Create a new repository**.
2. Clone your new repository and open it in VS Code with Copilot.
3. Open a new chat in Agent mode and say:

   > Help me use Golden Path to build [outcome]. Recommend the smallest useful
   > first version, clarify boundaries and decisions, and help me agree examples
   > before implementation. Set up real build and test checks. Don't change repository
   > protections without my approval.

Have executable acceptance drafted and approved as a separate change first.
Review actual results and gaps after implementation. Passing tests is evidence,
not approval to merge or deploy.

Keep project-specific **"must stay true"** decisions with their owner/revision in
existing records. Copilot should re-read them when resuming/delegating and escalate
conflicts instead of rewriting agreements. Guidance is not enforcement.

## Open the visual App

![Golden Path guided App preview](https://raw.githubusercontent.com/krnese/golden-path/main/docs/assets/mcp-app-guided.png)

**Guided:** shape your brief and continue in Copilot chat.
**Engineering:** return to inspect changes, checks and evidence.
To enable the [optional visual App](https://github.com/krnese/golden-path/blob/main/docs/MCP-APP-SETUP.md),
ask the same agent:

> Help me start this project with Golden Path and enable its visual App. Check
> prerequisites, explain and perform setup with my permission, then help me open
> it. Start with my intended outcome; don't invent acceptance or passing checks.

Review setup permissions and host trust prompts.
**You do not need it to start.** Image: local guided preview, not approved acceptance.

For version warnings, follow the setup guide. For unconfirmed delivery,
check chat before resending.

## Lightweight on purpose

This is **method-only guidance**. No application stack, dependencies or
placeholder-green workflows are bundled. Add real checks as your project needs
them; maintainers approve repository-wide changes.
It is not an automatic scaffolding or repository-hardening service.

## Working with a team

Keep the agreement and evidence in your shared issue or PR. Business owners
judge intended behavior; technical owners review design and controls.

## Already have an application?

Use [Golden Path in your existing repository](https://github.com/krnese/golden-path/blob/main/docs/ADOPTION.md)
instead of moving it into this template. Start with one bounded change and keep
your existing checks.

<details>
<summary>Updates and licensing</summary>

Template repositories have a fresh history; later template changes do not automatically update
your application. Review upgrades with your agent. No automatic owner notification
or approval service is included.
Template updates do not upgrade the separate App kit.

This template does not select a license for your application. Choose one and
retain the [Golden Path license notice](.github/GOLDEN-PATH-LICENSE).
Replace this README as your project takes shape.

</details>
