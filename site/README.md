# Golden Path landing page

One plain-static HTML page, CSS and optional interaction scripts. No framework,
backend, tracking, external fonts or npm dependencies. The canonical user
documentation stays in the repository; the page links to it rather than copying it.

This file is for **website maintainers**, not first-time users. For everyday use,
read [Your first task with Golden Path](../docs/USER-GUIDE.md).

## Build and verify

Needs Node.js 22+ and git. From the repository root:

```sh
node --test "site/tests/*.test.mjs"
node site/scripts/build.mjs
node site/scripts/check-site.mjs
node site/scripts/preview.mjs
```

Open <http://127.0.0.1:4327/golden-path/>. Stop the preview with Ctrl+C.
Equivalent npm scripts are available from this directory, without `npm install`.

The build extracts the owner-controlled acceptance install command from
[the README](../README.md#quickstart), renders counts and outcomes from
[the two recorded gate checks](../docs/examples/golden-loop/README.md), and copies
the actual trial images and JSON records byte for byte. Missing evidence fails
the build. The records are reproduced local checks, not live CI output.

The verifier checks the single-page shape, six-stage diagram order, static fallback,
required copy, local links, assets and anchors. Site tests also cover playback,
pause, repair and owner-feedback routes, reduced motion, custom-domain
URLs, invalid configuration, evidence integrity and stale output.
Repository acceptance tests under `tests/` are unchanged.

The visual direction matches the MCP App: navy surfaces, cyan actions, violet
selection/focus and gold ownership/feedback accents, with a system Segoe UI stack
and upright headings. Coral failures and cyan successes retain both text and
symbols. Palette tests check matching App colors and text/control contrast.
Recorded evidence images and original vendor glyphs remain unchanged; the
glyphs retain light backplates so their original dark shapes stay legible.
This is Golden Path's own design, not Microsoft branding or endorsement.
No external fonts, Fluent runtime, new vendor assets or dependencies are loaded.

## Page acceptance and manual review

- Keep the positioning aligned with the repository: "Connect intent to accountable
  engineering." appears above the short promise and in page/social titles.
  Explain the engineering agreement through agreeing what matters, working within
  it and returning evidence for judgement. Existing records hold the agreement;
  the requester and decision owner can differ. The invoice is one concrete
  walkthrough, not a claim that every experience or runtime has been verified.
- The hero has one AI-led promise, two short sentences and one visible
  "Try your first task" action. Installation and partnership details belong in
  setup, after the enlarged real before/after evidence.
- Show changing artifacts, not paragraph-filled cards: the invoice has two
  product-A lines; the two approved examples distinguish them from quantity two;
  implementation changes from approve to review; the check fails, repairs and
  passes; a person reviews; the owner inspects the result and asks for names.
- Six visible stages have exactly six captions. Failure, repair and pass are
  moments within the checks stage, not additional numbered stages. Owner feedback
  and the next approved increment likewise stay within the result stage.
- A paper request/evidence token moves between artifacts. The prominent gold
  return arrow is labelled "Owner feedback -> next approved examples"; the smaller
  coral repair route returns evidence to implementation, never weaker acceptance.
  The approved examples must remain unchanged through all repair moments.
- Keep one short caption and one persistent ownership statement. Put detailed
  mechanics in an expandable explanation. Required CI and human review still
  govern merge; owner revisions require approval and a new implementation session.
- Playback starts only on request and stops after the next owner-approved
  increment. Pause freezes both the token and pulse. Replay and Next work;
  select any stage with Tab and Enter/Space, or arrows, Home and End.
- Reduced motion disables moving tokens, pulses and timed playback, including when the
  preference changes mid-playback. Manual exploration still works. Backgrounding
  the page pauses playback; it does not resume without a user action.
- Keep the entire static story readable without JavaScript; controls stay hidden
  and stage buttons disabled. The illustrative walkthrough is distinct from trial
  evidence. "Verified with GitHub Copilot in VS Code" is a support label; the main
  story says "coding agent" and claims no verification of other integrations.
- Recorded before/after details are SVG viewports of the original comparison, not
  newly generated output. Verbatim transcripts remain readable on narrow screens,
  and "Inspect the evidence" reveals technical verdicts and full images. Trial
  limitations remain visible when that disclosure is closed.
- Check desktop and mobile for overflow, loaded images, visible focus, keyboard
  order, native controls, no console errors, reduced motion and script-disabled
  fallback. Screenshots in a PR complement, not replace, these behavior checks.
- At 1366 x 768 and 1440 x 900, the headline, primary action and all six enhanced
  visual artifacts fit without scrolling. Mobile uses readable rows in DOM order;
  at 390 x 844 the headline, action and first enhanced artifact fit. The expanded
  static fallback may need scrolling; do not truncate its explanation to fit.

Official tool glyphs and their license are documented in
[the icon attribution](public/icons/README.md). They do not imply vendor endorsement.
New source iterations require human review; updating a PR does not publish or merge
the site.

Review captures from the local build: [desktop](../docs/assets/landing-loop-desktop.png),
[mobile](../docs/assets/landing-loop-mobile.png), and
[recorded evidence detail](../docs/assets/landing-loop-evidence.png).
These screenshots show the proposed page, not a newly published version.
First-screen review captures: [1366 x 768 desktop](../docs/assets/landing-first-viewport-desktop.png)
and [390 x 844 mobile](../docs/assets/landing-first-viewport-mobile.png).
Story-frame captures show [code repair with unchanged examples](../docs/assets/landing-loop-repair.png)
and [the next owner-approved increment](../docs/assets/landing-loop-next-approved.png).

## Publish on GitHub Pages

Default public URL: <https://krnese.github.io/golden-path/>.

Source changes use a normal pull request. The initial temporary publication was
separately authorized before source review; it is not approval to merge the source.
Do not automatically merge the website PR or the positioning PR.

For an authorized publication, first run the checks above and commit the source.
Then, from this directory:

```sh
npm run deploy
```

The dependency-free publisher re-verifies the build and pushes the output to
`gh-pages`, with its source commit in the message. Its isolated git repository
disables text normalization so published artifacts retain their exact build bytes,
including recorded evidence on Windows. It does not force-push or
change Pages settings. On first publication an administrator must select
`gh-pages` and `/` as the GitHub Pages source. Wait for the Pages deployment,
then verify the public page, stylesheet, script, image and gate JSON. A successful
push alone does not prove the site is online.

While the source PR is unmerged, build with `SITE_SOURCE_REF` set to the published
source branch so the new user-guide link resolves. Once merged, rebuild using
the default `main` reference. This does not change the GitHub Pages URL.

[The site workflow](../.github/workflows/site.yml) checks PRs and source pushes;
it does not grant deployment or merge authority. See the
[repository maintainer inventory](../README.md#how-we-maintain-this-repository)
for its triggers, required-check status and relationship to the kit's CI.

## Move to golden-path.io

Do not set a custom domain before its registration and GitHub ownership
verification are complete. Keep the temporary URL until then.

1. Verify the domain in the GitHub account's Pages settings using GitHub's
   supplied TXT record. Do not share registrar credentials.
2. At Porkbun configure the apex DNS records according to
   [GitHub's current instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).
   Remove conflicting parking records; DNS does not transfer content to Porkbun.
3. Build with `SITE_URL=https://golden-path.io`, `SITE_BASE=/` and
   `SITE_DOMAIN=golden-path.io`. The last value adds a matching `CNAME`.
4. Run the verifier, publish, and configure the matching custom domain in Pages.
5. Wait for DNS and certificate provisioning, enable HTTPS enforcement when
   available, and verify the root URL, assets, links and GitHub URL redirect.

PowerShell build example:

```powershell
$env:SITE_URL = 'https://golden-path.io'
$env:SITE_BASE = '/'
$env:SITE_DOMAIN = 'golden-path.io'
node site\scripts\build.mjs
node site\scripts\check-site.mjs
```

Local assets use relative URLs, so the same page supports the GitHub project
path and the domain root. Canonical and social URLs are generated for the target.
Building without domain variables removes stale `CNAME` output.

## Demo boundary

The page links to the existing local invoice demo. A Codespaces button is not
advertised yet: opening this source repository is not the configured invoice
workspace. Add a cloud demo only after workspace preparation and Copilot hook
behavior have been verified, with sign-in, Copilot access and cost caveats.
