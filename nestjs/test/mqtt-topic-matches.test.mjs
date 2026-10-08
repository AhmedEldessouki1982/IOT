import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { topicMatches } from "../dist/mqtt/mqtt-connection.service.js";

describe("topicMatches", () => {
  it("matches a single-level wildcard", () => {
    assert.equal(topicMatches("devices/+/state", "devices/light1/state"), true);
    assert.equal(topicMatches("devices/+/state", "devices/light1/cmd"), false);
    assert.equal(topicMatches("devices/+/state", "devices/a/b/state"), false);
  });

  it("matches a trailing multi-level wildcard", () => {
    assert.equal(topicMatches("stat/tasmota_A3AECD/#", "stat/tasmota_A3AECD/POWER1"), true);
    assert.equal(topicMatches("stat/tasmota_A3AECD/#", "stat/tasmota_A3AECD/SENSOR/TEMP"), true);
    assert.equal(topicMatches("stat/tasmota_A3AECD/#", "stat/other/POWER1"), false);
  });
});
