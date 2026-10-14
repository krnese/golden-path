import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { build, canonicalUrl, escapeHtml, evidenceRoot, installationCommand, gateSummary, siteRoot } from "../scripts/build.mjs";
import { verify } from "../scripts/check-site.mjs";

function withBuild(env, callback) {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), "golden-path-site-test-"));
  try {
    build(output, env);
    callback(output, fs.readFileSync(path.join(output, "index.html"), "utf8"));
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
  }
}

test("GitHub Pages build has one page, six ordered steps, valid anchors and no framework", () => {
  withBuild({}, output => {
    const result = verify(output);
    assert.equal(result.canonical, "https://krnese.github.io/golden-path/");
    assert.ok(result.checked > 15);
    assert.deepEqual(fs.readdirSync(output).filter(name => name.endsWith(".html")), ["index.html"]);
    assert.ok(!fs.existsSync(path.join(output, "CNAME")));
  });
});
test("the page explains adoption before the story, and its CTA matches the guided destination", () => {
  withBuild({}, (_, html) => {
    assert.match(html, /<h1 id="promise">[^<]*<br>to AI-written code<br>/);
    assert.ok(html.indexOf("Already have tests and branch protection?") < html.indexOf('id="walkthrough"'));
    assert.match(html, /class="button primary" href="#quickstart">Try your first task/);
    assert.ok(!html.includes("five-minute"));
    assert.ok(!html.includes("Install in 5 minutes"));
    assert.ok(html.indexOf("Illustrative walkthrough") < html.indexOf("RECORDED TRIAL EVIDENCE"));
  });
});
test("the static page contains the whole invoice path, repair boundary and owner feedback loop", () => {
  withBuild({}, (_, html) => {
    assert.equal((html.match(/data-select="[0-5]" disabled/g) || []).length, 6);
    for (const example of ["Flag duplicate invoice lines.", "One line with quantity two does not.", "Changing acceptance requires the owner's approval.", "human review govern merge", "Also name every duplicated product.", "next acceptance increment"]) {
      assert.ok(html.includes(example), `Missing static example: ${example}`);
    }
    assert.ok(html.includes('class="story-controls" hidden'));
    assert.ok(html.includes("data-fixed-controls"));
  });
});
test("enlarged recorded details preserve full evidence and have accessible titles and readable transcripts", () => {
  withBuild({}, (_, html) => {
    assert.equal((html.match(/<svg role="img" aria-labelledby="(?:before|after)-detail-title"/g) || []).length, 2);
    assert.ok(html.includes("Review required for duplicate_line."));
    assert.ok(html.includes("Review required because products A appear more than once."));
    const image = fs.readFileSync(path.join(evidenceRoot, "round1-vs-round2.png"));
    for (const [, x, y, width, height] of html.matchAll(/viewBox="(\d+) (\d+) (\d+) (\d+)"/g)) {
      assert.ok(Number(x) + Number(width) <= image.readUInt32BE(16));
      assert.ok(Number(y) + Number(height) <= image.readUInt32BE(20));
    }
    assert.ok(html.includes("Inspect the full recorded comparison"));
  });
});
test("custom domain builds use root-relative resolution without a project prefix", () => {
  withBuild({ SITE_URL: "https://golden-path.io", SITE_BASE: "/", SITE_DOMAIN: "golden-path.io" }, (output, html) => {
    assert.equal(verify(output).canonical, "https://golden-path.io/");
    assert.ok(html.includes('href="./styles.css"'));
    assert.equal(fs.readFileSync(path.join(output, "CNAME"), "utf8"), "golden-path.io\n");
  });
});
test("invalid deployment URLs fail explicitly instead of silently choosing a default", () => {
  for (const origin of ["http://example.com", "https://user:pass@example.com", "https://example.com/path", "https://example.com/?query"]) {
    assert.throws(() => canonicalUrl(origin, "/"), /SITE_URL/);
  }
  for (const base of ["golden-path", "/../", "/path?query", "//example.com"]) assert.throws(() => canonicalUrl(undefined, base), /SITE_BASE/);
});
test("installation command is drawn from the canonical README, with placeholders intact", () => {
  const command = 'node plugin/install.mjs --target "<your-repo>" --acceptance-command "<acceptance-test-command>"';
  assert.equal(installationCommand(`# Intro\n## Quickstart\n${command}\n## Other\n`),
    `git clone https://github.com/krnese/golden-path.git\ncd golden-path\n${command}`);
  assert.throws(() => installationCommand("## Quickstart\nnode plugin/install.mjs --level 1"), /missing/);
});
test("gate summaries use the actual recorded outcomes, bases and test counts", () => {
  for (const [base, outcome, integrity] of [["65ef920", "FAILED", "FAIL"], ["921979e", "PASSED", "PASS"]]) {
    const record = JSON.parse(fs.readFileSync(path.join(evidenceRoot, `gate-check-base-${base}.json`), "utf8"));
    const summary = gateSummary(record);
    assert.ok(summary.startsWith(`base: ${base}`));
    assert.ok(summary.includes("PASS (14/14)"));
    assert.ok(summary.includes("PASS (26/26)"));
    assert.match(summary, new RegExp(`acceptance-integrity\\s+${integrity}`));
    assert.ok(summary.endsWith(`outcome: ${outcome}`));
  }
});
test("missing or inconsistent evidence is an error, never a fabricated pass", () => {
  assert.throws(() => gateSummary({ outcome: "PASSED", ok: false }), /Invalid/);
  assert.throws(() => gateSummary({ outcome: "PASSED", ok: true, base_sha: "a".repeat(40), results: [] }), /Missing/);
});
test("published evidence is copied byte for byte from repository sources", () => {
  withBuild({}, output => {
    for (const name of ["round1-vs-round2.png", "gate-verdict.png", "gate-check-base-65ef920.json", "gate-check-base-921979e.json"]) {
      assert.deepEqual(fs.readFileSync(path.join(output, "evidence", name)), fs.readFileSync(path.join(evidenceRoot, name)));
    }
  });
});
test("HTML escapes canonical commands and evidence without altering their meaning", () => {
  assert.equal(escapeHtml('<owner> & "test"'), "&lt;owner&gt; &amp; &quot;test&quot;");
  withBuild({}, (_, html) => {
    assert.ok(html.includes("&lt;your-repo&gt;"));
    assert.ok(!html.includes("<your-repo>"));
    assert.ok(html.includes("reproduced afterwards"));
    assert.ok(html.includes("No productivity gain measured"));
  });
});
test("the verifier rejects missing assets and missing anchor destinations", () => {
  withBuild({}, output => {
    fs.rmSync(path.join(output, "styles.css"));
    assert.throws(() => verify(output), /Missing asset/);
  });
  withBuild({}, (output, html) => {
    fs.writeFileSync(path.join(output, "index.html"), html.replace('id="quickstart"', 'id="wrong-anchor"'));
    assert.throws(() => verify(output), /Missing anchor/);
  });
});
test("build refuses stale artifacts and mismatched domain configuration", () => {
  withBuild({}, output => assert.throws(() => build(output, {}), /empty/));
  assert.throws(() => withBuild({ SITE_DOMAIN: "golden-path.io" }, () => {}), /SITE_DOMAIN/);
});
test("the playback module and licensed official glyphs are included unchanged in the build", () => {
  withBuild({}, output => {
    assert.deepEqual(fs.readFileSync(path.join(output, "story.js")), fs.readFileSync(path.join(siteRoot, "story.js")));
    for (const name of ["copilot.svg", "github.svg", "LICENSE"]) {
      assert.deepEqual(fs.readFileSync(path.join(output, "icons", name)), fs.readFileSync(path.join(siteRoot, "public", "icons", name)));
    }
    fs.rmSync(path.join(output, "story.js"));
    assert.throws(() => verify(output), /playback module must be published/);
  });
});
