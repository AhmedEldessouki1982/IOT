import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { SonoffRegistryService } from "../dist/sonoff/sonoff-registry.service.js";
import { SonoffService } from "../dist/sonoff/sonoff.service.js";
import { DeviceService } from "../dist/device/device.service.js";
import { TimersService } from "../dist/timers/timers.service.js";
import { DeviceAutomationService } from "../dist/automation/device-automation.service.js";
import { topicMatches } from "../dist/mqtt/mqtt-connection.service.js";

let originalSetTimeout;
let originalClearTimeout;
let originalDateNow;
let fakeTimeouts;
let now;

beforeEach(() => {
  originalSetTimeout = global.setTimeout;
  originalClearTimeout = global.clearTimeout;
  originalDateNow = Date.now;
  fakeTimeouts = [];
  now = new Date("2026-01-01T00:00:00.000Z").getTime();
  Date.now = () => now;
  global.setTimeout = (fn, delay) => {
    const handle = { fn, delay, cleared: false };
    fakeTimeouts.push(handle);
    return handle;
  };
  global.clearTimeout = (handle) => {
    if (handle) handle.cleared = true;
  };
});

afterEach(() => {
  global.setTimeout = originalSetTimeout;
  global.clearTimeout = originalClearTimeout;
  Date.now = originalDateNow;
});

const LOCAL_TOILET = {
  switchId: "toilet-main",
  base: "mainToilet",
  gangs: 3,
  roomType: "toilet",
  roomId: "toilet",
  buttonMode: "local",
};

/**
 * Wires the same objects the DI container wires in production: one MQTT broker
 * (subscribe/publish/deliver), a state store whose events reach the
 * automation's `device.state.changed` listener, and the Sonoff bridge.
 */
function makeRig(switches) {
  const registry = new SonoffRegistryService({
    get: (key) =>
      key === "SONOFF_SWITCHES_JSON" ? JSON.stringify(switches) : undefined,
  });

  const subscriptions = [];
  const published = [];
  const listeners = {};
  const eventEmitter = {
    emit: (type, payload) => {
      for (const handler of listeners[type] ?? []) handler(payload);
    },
    on: (type, handler) => {
      (listeners[type] ??= []).push(handler);
    },
  };
  const mqtt = {
    published,
    subscribe: (pattern, handler) => subscriptions.push({ pattern, handler }),
    publish: (topic, payload) => published.push({ topic, payload }),
    onConnect: () => {},
    deliver: (topic, payload) => {
      for (const { pattern, handler } of subscriptions) {
        if (topicMatches(pattern, topic)) handler(topic, Buffer.from(payload));
      }
    },
  };

  const timers = new TimersService(eventEmitter, {
    getSnapshot: () => [],
    save: () => {},
  });
  const deviceService = new DeviceService(
    mqtt,
    { getSnapshot: () => [], record: () => {} },
    eventEmitter,
  );
  const gateway = { broadcast: () => {} };
  const automation = new DeviceAutomationService(
    timers,
    deviceService,
    gateway,
    registry,
    mqtt,
  );
  eventEmitter.on("device.state.changed", (state) =>
    automation.onDeviceStateChanged(state),
  );

  new SonoffService(mqtt, deviceService, gateway, registry, automation);
  return { mqtt, timers, deviceService, automation, registry };
}

describe("buttonMode registry config", () => {
  it("reads `local` and defaults everything else to `detached`", () => {
    const { registry } = makeRig([
      LOCAL_TOILET,
      {
        switchId: "bedroom-east",
        base: "tasmota_BED",
        gangs: 2,
        roomType: "bedroom",
        roomId: "bedroom-east",
      },
      {
        switchId: "typo-switch",
        base: "tasmota_TYPO",
        gangs: 1,
        roomType: "toilet",
        roomId: "typo",
        buttonMode: "nope",
      },
    ]);

    assert.equal(registry.getGang("toilet-main-g2").buttonMode, "local");
    assert.equal(registry.getGang("bedroom-east-g1").buttonMode, "detached");
    assert.equal(registry.getGang("typo-switch-g1").buttonMode, "detached");
  });
});

describe("local wall switches (offline-capable buttons)", () => {
  it("supervises a physical ON with the gang's first stage", () => {
    const { mqtt, timers } = makeRig([LOCAL_TOILET]);

    mqtt.deliver("stat/mainToilet/POWER1", "ON");

    assert.equal(timers.getDurationSeconds("toilet-main-g1", 1), 10 * 60);
    assert.equal(fakeTimeouts[0].delay, 10 * 60 * 1000);

    // the supervisor switch itself off when the stage runs out
    fakeTimeouts[0].fn();

    assert.deepEqual(mqtt.published, [
      { topic: "devices/toilet-main-g1/cmd", payload: '{"on":false}' },
    ]);
    assert.equal(timers.getDurationSeconds("toilet-main-g1", 1), null);
  });

  it("cancels the supervisor when the relay goes off locally", () => {
    const { mqtt, timers } = makeRig([LOCAL_TOILET]);

    mqtt.deliver("stat/mainToilet/POWER1", "ON");
    mqtt.deliver("stat/mainToilet/POWER1", "OFF");

    assert.equal(timers.getDurationSeconds("toilet-main-g1", 1), null);
    assert.equal(fakeTimeouts[0].cleared, true);
    // the device already did the work, so nothing is published back
    assert.deepEqual(mqtt.published, []);
  });

  it("treats a repeated state report as the same press", () => {
    const { mqtt } = makeRig([LOCAL_TOILET]);

    mqtt.deliver("stat/mainToilet/POWER1", "ON");
    mqtt.deliver("stat/mainToilet/POWER1", "ON");

    assert.equal(fakeTimeouts.length, 1);
  });

  it("keeps the stage of a dashboard click when its echo arrives", () => {
    const { mqtt, timers, automation } = makeRig([LOCAL_TOILET]);

    automation.handleButtonPress("toilet-main-g1", 1);
    automation.handleButtonPress("toilet-main-g1", 1);
    assert.equal(timers.getDurationSeconds("toilet-main-g1", 1), 30 * 60);

    mqtt.deliver("stat/mainToilet/POWER1", "ON"); // echo of our own command

    assert.equal(timers.getDurationSeconds("toilet-main-g1", 1), 30 * 60);
    assert.equal(fakeTimeouts.length, 2); // two cycle stages, no supervisor
  });

  it("does not supervise a detached switch", () => {
    const { mqtt, timers, deviceService } = makeRig([
      {
        switchId: "bedroom-east",
        base: "tasmota_BED",
        gangs: 2,
        roomType: "bedroom",
        roomId: "bedroom-east",
      },
    ]);

    mqtt.deliver("stat/tasmota_BED/POWER2", "ON");

    assert.equal(deviceService.getState("bedroom-east-g2")?.state.on, true);
    assert.equal(timers.getDurationSeconds("bedroom-east-g2", 2), null);
    assert.equal(fakeTimeouts.length, 0);
  });

  it("never supervises a gang that has no timer", () => {
    const { mqtt } = makeRig([
      {
        switchId: "bedroom-main",
        base: "tasmota_BED2",
        gangs: 2,
        roomType: "bedroom",
        roomId: "bedroom",
        buttonMode: "local",
      },
    ]);

    mqtt.deliver("stat/tasmota_BED2/POWER1", "ON");

    assert.equal(fakeTimeouts.length, 0);
  });

  it("keeps a stage the click cycle already armed", () => {
    const { automation, timers, mqtt } = makeRig([LOCAL_TOILET]);

    automation.handleButtonPress("toilet-main-g1", 1);
    automation.handleButtonPress("toilet-main-g1", 1);
    const publishes = mqtt.published.length;

    automation.handleLocalRelayOn("toilet-main-g1", 1);

    assert.equal(timers.getDurationSeconds("toilet-main-g1", 1), 30 * 60);
    assert.equal(fakeTimeouts.length, 2);
    assert.equal(mqtt.published.length, publishes);
  });

  it("ignores button actions a local switch still publishes", () => {
    const { mqtt } = makeRig([LOCAL_TOILET]);

    mqtt.deliver("stat/mainToilet/RESULT", '{"Button2":{"Action":"SINGLE"}}');

    assert.deepEqual(mqtt.published, []);
    assert.equal(fakeTimeouts.length, 0);
  });
});

const MASTER_TOILET = {
  switchId: "toilet-master",
  base: "MasterRoomToilet",
  gangs: 3,
  roomType: "toilet",
  roomId: "toilet-master",
  buttonMode: "local",
};

describe("a second toilet on the shared routine", () => {
  it("maps each switch base to its own gang ids", () => {
    const { registry } = makeRig([LOCAL_TOILET, MASTER_TOILET]);

    assert.deepEqual(
      registry.getSwitches().map((sw) => sw.base),
      ["mainToilet", "MasterRoomToilet"],
    );
    assert.deepEqual(
      registry.getGangs().map((gang) => gang.deviceId),
      [
        "toilet-main-g1",
        "toilet-main-g2",
        "toilet-main-g3",
        "toilet-master-g1",
        "toilet-master-g2",
        "toilet-master-g3",
      ],
    );
  });

  it("supervises each wall touch from its own base, with no cross-talk", () => {
    const { mqtt, timers, deviceService } = makeRig([
      LOCAL_TOILET,
      MASTER_TOILET,
    ]);

    mqtt.deliver("stat/mainToilet/POWER1", "ON");
    mqtt.deliver("stat/MasterRoomToilet/POWER2", "ON");

    assert.equal(deviceService.getState("toilet-main-g1")?.state.on, true);
    assert.equal(deviceService.getState("toilet-master-g2")?.state.on, true);
    assert.equal(deviceService.getState("toilet-master-g1"), undefined);
    assert.equal(deviceService.getState("toilet-main-g2"), undefined);

    // the same routine: both touches arm the gang's first stage (10 min)
    assert.equal(timers.getDurationSeconds("toilet-main-g1", 1), 10 * 60);
    assert.equal(timers.getDurationSeconds("toilet-master-g2", 2), 10 * 60);
  });

  it("routes a dashboard command to the master toilet base", () => {
    const { mqtt } = makeRig([LOCAL_TOILET, MASTER_TOILET]);

    mqtt.deliver("devices/toilet-master-g3/cmd", '{"on":true}');

    assert.deepEqual(mqtt.published, [
      { topic: "cmnd/MasterRoomToilet/POWER3", payload: "ON" },
    ]);
  });
});
