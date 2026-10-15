import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const stylesRoot = join(frontendRoot, "src", "styles");
const sourceRoot = join(frontendRoot, "src");

function cssFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory()
      ? cssFiles(path)
      : path.endsWith(".css")
        ? [path]
        : [];
  });
}

function contrast(hexA, hexB) {
  const luminance = (hex) => {
    const channels = hex.match(/[\da-f]{2}/gi).map((channel) => {
      const value = parseInt(channel, 16) / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const values = [luminance(hexA), luminance(hexB)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

function themeTokens(css, selector) {
  const start = css.indexOf(selector);
  assert.notEqual(start, -1, "Missing theme selector " + selector);
  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);
  return Object.fromEntries(
    [...css.slice(open + 1, close).matchAll(/(--[\w-]+):\s*(#[\da-fA-F]{6})\s*;/g)].map(
      (match) => [match[1], match[2]],
    ),
  );
}

describe("design tokens", () => {
  it("keeps hex and rgba color literals inside tokens.css", () => {
    for (const path of cssFiles(sourceRoot)) {
      if (path.endsWith("tokens.css")) continue;
      const css = readFileSync(path, "utf8");
      assert.doesNotMatch(css, /#[\da-fA-F]{3,8}\b|rgba\s*\(/, path);
    }
  });

  it("uses no more than the six type scale values in declarations", () => {
    const declarations = cssFiles(sourceRoot)
      .filter((path) => !path.endsWith("tokens.css"))
      .flatMap((path) => [
        ...readFileSync(path, "utf8").matchAll(/font-size:\s*([^;]+);/g),
      ])
      .map((match) => match[1].trim());
    assert.ok(
      declarations.every((value) =>
        /^var\(--font-size-(?:xs|sm|md|lg|xl|2xl)\)$/.test(value),
      ),
    );
    assert.ok(new Set(declarations).size <= 6);
  });

  it("keeps text and UI boundaries above contrast thresholds in both themes", () => {
    const tokens = readFileSync(join(stylesRoot, "tokens.css"), "utf8");
    const themes = [
      themeTokens(tokens, ":root {"),
      themeTokens(tokens, ':root[data-theme="light"]'),
    ];
    for (const [index, theme] of themes.entries()) {
      const label = index === 0 ? "dark" : "light";
      assert.ok(
        contrast(theme["--color-text-primary"], theme["--color-surface"]) >= 4.5,
        label + " primary text",
      );
      assert.ok(
        contrast(theme["--color-text-secondary"], theme["--color-surface"]) >=
          4.5,
        label + " secondary text",
      );
      assert.ok(
        contrast(theme["--color-boundary"], theme["--color-surface"]) >= 3,
        label + " boundary",
      );
    }
  });
});
