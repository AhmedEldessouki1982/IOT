import { test } from "node:test";
import assert from "node:assert/strict";
import { timerFraction } from "../src/hooks/timerVisual.js";
test("timer ring clamps remaining duration and handles absent/invalid totals", () => {
  assert.equal(timerFraction(300, 600), 0.5);
  assert.equal(timerFraction(600, 600), 1);
  assert.equal(timerFraction(600, 300), 1);
  assert.equal(timerFraction(-1, 300), 0);
  assert.equal(timerFraction(10, 0), 0);
});
