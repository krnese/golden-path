---
description: 'Run a task on the Golden Path (golden-path skill).'
---

Use the golden-path skill for this task: ${input:task:Describe the task or give a task file path}

Ground this change's outcome, boundaries, accountable owner and acceptance in the existing issue/PR and reviewed artifacts, not private chat or a new contract database. Distinguish business judgment from technical review; keep ordinary implementation autonomous within the agreed boundary and existing mandatory controls.

Keep the few "must stay true" statements with their owner and accepted source revision. Before consequential changes, assess whether the proposed effects preserve, modify or contradict them, or remain uncertain; re-read them after resume/context loss and include them in delegated work. Reconcile the cumulative diff afterward. Pause only affected work and its dependents for a material conflict or unresolved uncertainty; explain the impact and seek the owner's decision. Rewriting documents or tests does not authorize a changed architecture.

For setup or first use, follow guided adoption. For a new application, propose the smallest useful slice and real build/test/CI setup after the relevant decisions and acceptance baseline are approved; report "build not configured" until real checks exist. For brownfield work, inspect read-only first, reuse existing commands/CI/ownership and pilot one additive change without migrating or replacing the application. Keep known baseline failures explicit.

Keep team evidence tied to the actual PR revision and owner-approved acceptance baseline. Preview repository-wide protection changes for an authorized maintainer, apply only with explicit permission, then verify effective settings; do not infer enforcement from files or local results.

Prove the result with the repository's checks. Do not weaken tests, and do not change acceptance tests owned by the business-context expert.
