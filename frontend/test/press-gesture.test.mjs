import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolvePressGesture } from "../src/hooks/pressGesture.js";

describe("resolvePressGesture", () => {
  it("classifies short and long pointer gestures around the threshold", () => {
    assert.equal(resolvePressGesture(599, 600), "short");
    assert.equal(resolvePressGesture(600, 600), "long");
    assert.equal(resolvePressGesture(900, 600), "long");
  });
});
