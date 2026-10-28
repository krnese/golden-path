export const collectionContent = {
  requirements: {
    heading: "What matters", hint: "Requirements: what the work needs to address.",
    item: "Requirement", title: "Review what matters",
    statement: "What needs to be true?", statementHint: "Describe what matters in words the people affected would use.",
    rationale: "Why does it matter?", rationaleHint: "Explain the reason, including what is still uncertain.",
  },
  assumptions: {
    heading: "What we're assuming", hint: "Beliefs to question, not proven facts.",
    item: "Assumption", title: "Challenge the assumption",
    statement: "What are we assuming?", statementHint: "State the belief clearly enough that someone can challenge it.",
    rationale: "Why do we think this?", rationaleHint: "Name the evidence, or say what still needs to be tested. A reason is not proof.",
  },
};

export function connections(model, collection, item) {
  if (collection === "requirements") {
    return {
      linked: item.componentIds.map((id) => model.components.find((x) => x.id === id)),
      assumptions: model.assumptions.filter((x) => x.requirementIds.includes(item.id)),
    };
  }
  return {
    linked: item.requirementIds.map((id) => model.requirements.find((x) => x.id === id)),
    assumptions: [],
  };
}

export function conversationPrompt({ model, statePath }) {
  const sections = Object.entries(collectionContent).map(([collection, labels]) => [
    labels.heading.toUpperCase(),
    ...model[collection].map((item) => [
      `${item.id} (${item.status === "draft" ? "draft, not approved" : "locked example, not owner approval"}): ${item.text}`,
      `Reason: ${item.rationale}`,
      collection === "requirements" ?
        `Connected parts: ${item.componentIds.join(", ") || "none recorded"}` :
        `Connected requirements: ${item.requirementIds.join(", ") || "none recorded"}`,
    ].join("\n")),
    ...(model[collection].length ? [] : ["None recorded."]),
  ].join("\n\n"));
  return [
    `Let's continue reviewing "${model.title}".`,
    `This summary is saved example version ${model.revision}, from ${statePath}. It may have changed since this summary was prepared.`,
    "First call inspect_architecture to re-read the shared source. Use its current state, not this copied summary, for further reasoning. If it is unavailable, say so and do not claim you have checked it.",
    ...sections,
    "DISCUSS NEXT",
    "Explain how the draft serves the intended outcome and which assumptions or connections could change the decision. Identify missing context rather than inventing it.",
    "Ask the owner for examples of success where these are missing. Compare actual evidence with the expected result, and explicitly say what is still unproved. No outcome evidence or owner acceptance is recorded by this workspace.",
    "Keep locked examples and real acceptance unchanged. Saving a draft is not approval or permission to merge or deploy. Escalate a change to intent, boundary or acceptance to the person who owns that decision.",
  ].join("\n\n");
}
