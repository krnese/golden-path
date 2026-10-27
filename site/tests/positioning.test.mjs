import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { build } from "../scripts/build.mjs";

function withPage(callback) {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), "golden-path-positioning-test-"));
  try {
    build(output, {});
    callback(fs.readFileSync(path.join(output, "index.html"), "utf8"));
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
  }
}

test("page and social metadata share the engineering positioning shown above the hero", () => {
  withPage(html => {
    const title = "Golden Path | Connect intent to accountable engineering.";
    assert.ok(html.includes(`<title>${title}</title>`));
    assert.ok(html.includes(`<meta property="og:title" content="${title}">`));
    const description = /<meta name="description" content="([^"]+)">/.exec(html)[1];
    assert.match(description, /agree what matters, keep implementation within the agreement, and return evidence for a decision/);
    assert.ok(html.includes(`<meta property="og:description" content="${description}">`));
    assert.match(html, /<p class="eyebrow">Connect intent to accountable engineering\.<\/p>\s*<h1 id="promise">/);
  });
});

test("the engineering agreement preserves meaning, authority and evidence in existing records", () => {
  withPage(html => {
    const section = /<section id="agreement"[\s\S]*?<\/section>/.exec(html)[0];
    for (const text of [
      "lightweight engineering method with optional checks",
      "a developer change, a business outcome, an analytical task or an investigation",
      "Agree what matters",
      "authoritative context, permitted actions and decision owner",
      "uncertainty that could change the next step",
      "Work within the agreement",
      "return to the appropriate owner",
      "Return evidence for a decision",
      "the checked revision and remaining gaps",
      "Accountable owners judge whether the result meets the need",
      "existing tasks, policies, approved examples, tests and review records",
      "bounded investigation",
      "The person asking may not be authorised",
      "Merge and deployment still need their own permissions",
    ]) assert.ok(section.includes(text), `Missing agreement meaning: ${text}`);
    assert.ok(html.includes("enforcement depends on the host and configured controls"));
    assert.ok(html.includes("Incremental benefit over competent engineering is still unproved"));
  });
});
