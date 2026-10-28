import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { collectionContent, connections, conversationPrompt } from "../review-content.mjs";
import { modelSchema, updateSchema } from "../architecture-model.mjs";

const example = () => modelSchema.parse(JSON.parse(fs.readFileSync(new URL("../example-model.json", import.meta.url), "utf8")));

test("review saves do not require native form submissions forbidden by the Apps sandbox", () => {
  const html = fs.readFileSync(new URL("../architecture.html", import.meta.url), "utf8");
  assert.doesNotMatch(html, /<form\b|type="submit"/);
  assert.match(html, /id="save"[^>]+type="button"/);
  assert.match(html, /id="draft-form" role="group" aria-label="Draft wording and reason"/);
  assert.doesNotMatch(html, /\bautofocus\b/);
});

test("review language distinguishes requirements from beliefs rather than claiming evidence", () => {
  assert.equal(collectionContent.requirements.heading, "What matters");
  assert.equal(collectionContent.assumptions.heading, "What we're assuming");
  assert.match(collectionContent.assumptions.hint, /not proven facts/);
  assert.match(collectionContent.assumptions.rationaleHint, /reason is not proof/);
});

test("requirement review exposes connected parts and reverse-linked assumptions from the same model", () => {
  const model = example();
  const before = structuredClone(model);
  const linked = connections(model, "requirements", model.requirements[0]);
  assert.deepEqual(linked.linked, model.components);
  assert.deepEqual(linked.assumptions, model.assumptions);
  assert.equal(linked.assumptions[0], model.assumptions[0]);
  assert.deepEqual(model, before);
  const assumption = connections(model, "assumptions", model.assumptions[1]);
  assert.deepEqual(assumption.linked, model.requirements);
  assert.deepEqual(assumption.assumptions, []);
});

test("missing connections and assumptions are represented without inventing context", () => {
  const model = example();
  model.requirements[0].componentIds = [];
  model.assumptions = [];
  const linked = connections(model, "requirements", model.requirements[0]);
  assert.deepEqual(linked, { linked: [], assumptions: [] });
  assert.match(conversationPrompt({ model, statePath: "example.json" }), /WHAT WE'RE ASSUMING\n\nNone recorded/);
  assert.match(conversationPrompt({ model, statePath: "example.json" }), /Connected parts: none recorded/);
});

test("handoff includes exact saved content and version, requires rereading and grants no approval", () => {
  const model = example();
  model.revision = 7;
  model.requirements[0].text = "Help a coordinator understand a customer's request without asking for it twice.";
  model.assumptions[0].rationale = "No customer observations collected yet.";
  const before = structuredClone(model);
  const prompt = conversationPrompt({ model, statePath: "C:\\example\\shared.json" });
  for (const collection of ["requirements", "assumptions"]) {
    for (const item of model[collection]) {
      assert.ok(prompt.includes(item.text));
      assert.ok(prompt.includes(item.rationale));
    }
  }
  assert.match(prompt, /saved example version 7/);
  assert.ok(prompt.includes("C:\\example\\shared.json"));
  assert.match(prompt, /First call inspect_architecture/);
  assert.match(prompt, /not this copied summary/);
  assert.match(prompt, /If it is unavailable, say so/);
  assert.match(prompt, /locked example, not owner approval/);
  assert.match(prompt, /No outcome evidence or owner acceptance is recorded/);
  assert.match(prompt, /Escalate a change to intent, boundary or acceptance/);
  assert.deepEqual(model, before);
});

test("draft form uses the same whitespace and length constraints as persistence", () => {
  const draft = { collection: "requirements", id: "R1", expectedRevision: 0, text: "  ", rationale: "Because" };
  assert.equal(updateSchema.safeParse(draft).success, false);
  assert.equal(updateSchema.safeParse({ ...draft, text: "a".repeat(4001) }).success, false);
  assert.equal(updateSchema.safeParse({ ...draft, text: "A draft", rationale: " " }).success, false);
  const valid = updateSchema.parse({ ...draft, text: " A draft ", rationale: " A reason " });
  assert.equal(valid.text, "A draft");
  assert.equal(valid.rationale, "A reason");
});
