import { test } from "node:test";
import assert from "node:assert/strict";
import { valueChanged, isExternalChange, animatedInteger, staggerDelay } from "../src/hooks/motionRules.js";
test("initial data and unchanged values never flash", () => {
  assert.equal(valueChanged(undefined, true), false);
  assert.equal(valueChanged(false, false), false);
  assert.equal(valueChanged(false, true), true);
});
test("external changes exclude the local action window", () => {
  assert.equal(isExternalChange(false, true, 1000, 2500), false);
  assert.equal(isExternalChange(false, true, 1000, 2501), true);
  assert.equal(isExternalChange(false, true, undefined, 2000), true);
  assert.equal(isExternalChange(undefined, true, undefined, 2000), false);
});
test("numbers round, finish exactly, handle decreases and reduced motion", () => {
  assert.equal(animatedInteger(0, 8, 200, 400), 7);
  assert.equal(animatedInteger(8, 0, 400, 400), 0);
  assert.equal(animatedInteger(0, 8, 1, 400, true), 8);
  assert.equal(animatedInteger(0, 8, 0, 0), 8);
  assert.equal(animatedInteger(0, 8, -1, 400), 0);
});
test("stagger caps at eight steps and disappears with reduced motion", () => {
  assert.equal(staggerDelay(20, 90), 630);
  assert.equal(staggerDelay(4, 90, true), 0);
});
