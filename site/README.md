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

The verifier checks the single-page shape, six-step diagram order, static fallback,
required copy, local links, assets and anchors. Site tests also cover playback,
pause, repair and owner-feedback routes, reduced motion, custom-domain
URLs, invalid configuration, evidence integrity and stale output.
Repository acceptance tests under `tests/` are unchanged.

## Page acceptance and manual review

- Explain the benefit, installed components and domain-expert/engineer partnership
  before the illustrative walkthrough. The primary CTA opens the first-task section.
- Keep all six invoice steps and both loops readable without JavaScript. The
  walkthrough is labelled illustrative and distinct from recorded evidence.
- Playback starts only on request, highlights one step at a time, and stops after
  the owner approves the next increment. Pause, replay and next-scene buttons work.
  Select any step with Tab and Enter/Space, or use arrows, Home and End.
- Failed checks return work to implementation. Changing acceptance requires owner
  approval and a new implementation session. Acceptance and repository-control
  labels remain fixed while work moves.
- Reduced motion disables the moving pulse and timed playback, including when the
  preference changes mid-playback. Manual exploration still works. Backgrounding
  the page pauses playback; it does not resume without a user action.
- Recorded before/after details are SVG viewports of the original comparison, not
  newly generated output. Verbatim transcripts remain readable on narrow screens,
  and the full image, JSON records and trial limitations stay available.
- Check desktop and mobile for overflow, loaded images, visible focus, keyboard
  order, native controls, no console errors, reduced motion and script-disabled
  fallback. Screenshots in a PR complement, not replace, these behavior checks.
- At 1366 x 768 and 1440 x 900, the smaller AI headline and all six initial
  diagram cards must fit without scrolling. Wide screens put the introduction
  beside the diagram. Narrow screens stack them, with the longer partnership and
  adoption explanation following the walkthrough; the introduction still
  explains the partnership and benefit first. At 390 x 844 the headline
  and first invoice card must fit. Keep full step descriptions and tool glyphs.

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
it does not grant deployment or merge authority.

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
