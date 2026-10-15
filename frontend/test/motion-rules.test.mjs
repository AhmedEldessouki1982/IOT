import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
const root = new URL("../src/styles/", import.meta.url);
const allowed = new Set(["transform", "opacity", "background-color", "border-color", "color", "fill", "stroke", "stroke-dashoffset", "grid-template-rows"]);
function files(dir) { return readdirSync(dir, {withFileTypes:true}).flatMap(f => f.isDirectory() ? files(new URL(f.name + "/",dir)) : [new URL(f.name,dir)]); }
test("CSS motion uses inexpensive explicit properties and allowlisted loops", () => {
  for (const file of files(root)) {
    const css = readFileSync(file,"utf8");
    for (const [, declaration] of css.matchAll(/(?:transition|transition-property|will-change):\s*([^;]+);/g)) {
      const withoutFunctions = declaration.replace(/(?:var|cubic-bezier)\([^)]*\)/g, "token");
      for (const part of withoutFunctions.split(",")) assert.ok(allowed.has(part.trim().split(/\s+/)[0]), `${file}: ${declaration}`);
    }
    for (const [, selector, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (/animation(?:-iteration-count)?:[^;]*\binfinite\b/.test(body))
        assert.match(selector.trim(), /^(?:\.reconnecting-dot|\.timer-badge--low \.timer-numerals|\.kiosk-clock)$/);
    }
  }
  assert.match(readFileSync(new URL("base.css",root),"utf8"), /prefers-reduced-motion:\s*reduce/);
});
