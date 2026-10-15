import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
const root = new URL("../", import.meta.url);
test("font tokens match registered self-hosted families", () => {
  const tokens = readFileSync(new URL("src/styles/tokens.css", root), "utf8");
  for (const [pkg, token] of [["ubuntu", "ui"], ["ubuntu-mono", "mono"]]) {
    const css = readFileSync(new URL(`node_modules/@fontsource/${pkg}/400.css`, root), "utf8");
    const family = /font-family:\s*['"]([^'"]+)['"]/.exec(css)[1];
    assert.equal(new RegExp(`--font-${token}:\\s*["']([^"']+)["']`).exec(tokens)[1], family);
  }
});
test("only real Ubuntu font weights are requested", () => {
  function visit(url) {
    for (const file of readdirSync(url, { withFileTypes: true })) {
      const child = new URL(file.name + (file.isDirectory() ? "/" : ""), url);
      if (file.isDirectory()) visit(child);
      else if (file.name.endsWith(".css")) {
        for (const [, weight] of readFileSync(child, "utf8").matchAll(/font-weight:\s*([^;]+);/g))
          assert.ok(["400", "500", "700"].includes(weight.trim()), `${child}: ${weight}`);
      }
    }
  }
  visit(new URL("src/styles/", root));
});
