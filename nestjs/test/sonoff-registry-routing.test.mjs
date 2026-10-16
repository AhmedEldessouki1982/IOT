import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  deviceIdForGang,
  expandSwitchConfig,
  SonoffRegistryService,
} from "../dist/sonoff/sonoff-registry.service.js";
import { SonoffService } from "../dist/sonoff/sonoff.service.js";
import { DeviceService } from "../dist/device/device.service.js";
import { topicMatches } from "../dist/mqtt/mqtt-connection.service.js";

function configWith(value) {
  return {
    get: (key) => (key === "SONOFF_SWITCHES_JSON" ? value : undefined),
  };
}

function makeMqtt() {
  const subscriptions = [];
  const published = [];
  return {
    published,
    subscribe: (pattern, handler) => {
      subscriptions.push({ pattern, handler });
    },
    publish: (topic, payload) => {
      published.push({ topic, payload });
    },
    deliver: (topic, payload) => {
      for (const { pattern, handler } of subscriptions) {
        if (topicMatches(pattern, topic)) handler(topic, Buffer.from(payload));
      }
    },
  };
}

function makeService(switches) {
  const registry = new SonoffRegistryService(
    configWith(JSON.stringify(switches)),
  );
  const mqtt = makeMqtt();
  const persistence = { getSnapshot: () => [], record: () => {} };
  const deviceService = new DeviceService(mqtt, persistence);
  const broadcasts = [];
  const gateway = { broadcast: (state) => broadcasts.push(state) };
  const buttonPresses = [];
  const localRelayOns = [];
  const automation = {
    handleButtonPress: (deviceId, gang) =>
      buttonPresses.push({ deviceId, gang }),
    handleLocalRelayOn: (deviceId) => localRelayOns.push(deviceId),
  };
  const service = new SonoffService(
    mqtt,
    deviceService,
    gateway,
    registry,
    automation,
  );
  return {
    service,
    mqtt,
    deviceService,
    broadcasts,
    registry,
    buttonPresses,
    localRelayOns,
  };
}

describe("Sonoff registry", () => {
  it("keeps legacy reception gangs on sonoff1..3 and new switches on <switchId>-g<n>", () => {
    assert.equal(deviceIdForGang("reception", 1), "sonoff1");
    assert.equal(deviceIdForGang("reception", 3), "sonoff3");
    assert.equal(deviceIdForGang("toilet-main", 2), "toilet-main-g2");

    assert.deepEqual(
      expandSwitchConfig({
        switchId: "bedroom-east",
        base: "tasmota_BED",
        gangs: 2,
        roomType: "bedroom",
        roomId: "bedroom-east",
      }).map((gang) => gang.deviceId),
      ["bedroom-east-g1", "bedroom-east-g2"],
    );
  });
});

describe("SonoffService registry routing", () => {
  it("routes commands to the matching switch base and gang", () => {
    const { mqtt } = makeService([
      {
        switchId: "reception",
        base: "tasmota_REC",
        gangs: 3,
        roomType: "none",
        roomId: "reception",
      },
      {
        switchId: "toilet-main",
        base: "tasmota_TOILET",
        gangs: 3,
        roomType: "toilet",
        roomId: "toilet",
      },
    ]);

    mqtt.deliver("devices/sonoff2/cmd", '{"on":true}');
    mqtt.deliver("devices/toilet-main-g3/cmd", '{"on":false}');

    assert.deepEqual(mqtt.published, [
      { topic: "cmnd/tasmota_REC/POWER2", payload: "ON" },
      { topic: "cmnd/tasmota_TOILET/POWER3", payload: "OFF" },
    ]);
  });

  it("keeps state messages isolated to their own switch", () => {
    const { mqtt, deviceService, broadcasts, localRelayOns } = makeService([
      {
        switchId: "switch-a",
        base: "tasmota_A",
        gangs: 2,
        roomType: "toilet",
        roomId: "toilet-a",
      },
      {
        switchId: "switch-b",
        base: "tasmota_B",
        gangs: 2,
        roomType: "bedroom",
        roomId: "bedroom-b",
      },
    ]);

    mqtt.deliver("stat/tasmota_A/POWER1", "ON");

    assert.equal(deviceService.getState("switch-a-g1")?.state.on, true);
    assert.equal(deviceService.getState("switch-b-g1"), undefined);
    assert.deepEqual(
      broadcasts.map((state) => state.deviceId),
      ["switch-a-g1"],
    );
    // detached switches are driven by button actions, never supervised
    assert.deepEqual(localRelayOns, []);
  });

  it("ignores a device echo that a newer command has superseded", () => {
    const { mqtt, deviceService, broadcasts } = makeService([
      {
        switchId: "toilet-main",
        base: "tasmota_TOILET",
        gangs: 3,
        roomType: "toilet",
        roomId: "toilet",
      },
    ]);

    // Two commands issued within one device round-trip: OFF then ON.
    mqtt.deliver("devices/toilet-main-g1/cmd", '{"on":false}');
    mqtt.deliver("devices/toilet-main-g1/cmd", '{"on":true}');

    // The device echoes them in order; the stale OFF must not win.
    mqtt.deliver("stat/tasmota_TOILET/POWER1", "OFF");
    assert.equal(deviceService.getState("toilet-main-g1"), undefined);

    mqtt.deliver("stat/tasmota_TOILET/POWER1", "ON");
    assert.equal(deviceService.getState("toilet-main-g1")?.state.on, true);
    assert.deepEqual(
      broadcasts.map((state) => state.state.on),
      [true],
    );
  });

  it("maps Tasmota RESULT button actions to the matching gang", () => {
    const { mqtt, buttonPresses } = makeService([
      {
        switchId: "toilet-main",
        base: "tasmota_TOILET",
        gangs: 3,
        roomType: "toilet",
        roomId: "toilet",
      },
    ]);

    mqtt.deliver("stat/tasmota_TOILET/RESULT", '{"Button2":{"Action":"HOLD"}}');

    assert.deepEqual(buttonPresses, [
      { deviceId: "toilet-main-g2", gang: 2 },
    ]);
  });
});
