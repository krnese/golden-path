import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";

const css = fs.readFileSync(new URL("../theme.css", import.meta.url), "utf8");
const tokens = [...css.matchAll(/--([\w-]+): light-dark\((#[\da-f]{6}), (#[\da-f]{6})\);/g)];
function luminance(hex) {
  const [r, g, b] = hex.slice(1).match(/../g).map((part) => {
    const channel = parseInt(part, 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return r * 0.2126 + g * 0.7152 + b * 0.0722;
}
function contrast(a, b) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

for (const [theme, index] of [["light", 2], ["dark", 3]]) {
  test(`${theme} palette keeps text, accents, control boundaries and focus legible`, () => {
    const palette = Object.fromEntries(tokens.map((match) => [match[1], match[index]]));
    const check = (foreground, background, minimum) => {
      assert.ok(palette[foreground] && palette[background], `Missing ${foreground} or ${background} token`);
      const ratio = contrast(palette[foreground], palette[background]);
      assert.ok(ratio >= minimum, `${foreground} on ${background}: ${ratio.toFixed(2)}:1 < ${minimum}:1`);
    };
    for (const surface of ["paper", "surface", "raised", "soft", "violet-soft"]) {
      check("ink", surface, 4.5);
      check("muted", surface, 4.5);
      check("focus", surface, 3);
    }
    for (const [foreground, background] of [
      ["accent", "soft"], ["accent", "surface"], ["violet", "violet-soft"],
      ["gold", "gold-soft"], ["danger", "danger-soft"],
      ["on-accent", "accent"], ["on-accent", "accent-hover"],
    ]) check(foreground, background, 4.5);
    check("control-line", "surface", 3);
    check("control-line", "paper", 3);
  });
}

test("all built views embed the same theme without an external stylesheet dependency", () => {
  assert.match(css, /color-scheme: dark;/);
  for (const name of ["architecture", "app", "host"]) {
    const html = fs.readFileSync(new URL(`../dist/${name}.html`, import.meta.url), "utf8");
    assert.ok(html.includes(`<style>${css}</style>`), `${name} is missing the shared theme`);
    assert.doesNotMatch(html, /<!-- THEME -->|<link\b[^>]*rel=["']stylesheet/);
  }
});
