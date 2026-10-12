import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { TimersService } from "../dist/timers/timers.service.js";
import { DeviceAutomationService } from "../dist/automation/device-automation.service.js";
import { SonoffRegistryService } from "../dist/sonoff/sonoff-registry.service.js";
import { DeviceService } from "../dist/device/device.service.js";

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

function configWithSwitches(switches) {
  return {
    get: (key) =>
      key === "SONOFF_SWITCHES_JSON" ? JSON.stringify(switches) : undefined,
  };
}

function makeEventEmitter() {
  const emitted = [];
  return {
    emitted,
    emit: (type, payload) => {
      emitted.push({ type, payload });
    },
  };
}

function makeTimerPersistence(snapshot = []) {
  return {
    saved: [],
    getSnapshot: () => snapshot,
    save(entries) {
      this.saved = entries;
    },
  };
}

function makeAutomation(switches, persistedTimers = []) {
  const registry = new SonoffRegistryService(configWithSwitches(switches));
  const eventEmitter = makeEventEmitter();
  const timerPersistence = makeTimerPersistence(persistedTimers);
  const timers = new TimersService(eventEmitter, timerPersistence);
  const mqtt = {
    published: [],
    publish(topic, payload) {
      this.published.push({ topic, payload });
    },
    onConnect(handler) {
      this.connectHandler = handler;
    },
  };
  const devicePersistence = { getSnapshot: () => [], record: () => {} };
  const deviceService = new DeviceService(
    mqtt,
    devicePersistence,
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
  return {
    automation,
    timers,
    mqtt,
    deviceService,
    timerPersistence,
    eventEmitter,
  };
}

describe("timer automation", () => {
  it("publishes ON for a toilet SINGLE press and OFF after the configured minutes", () => {
    const { automation, mqtt } = makeAutomation([
      {
        switchId: "toilet-main",
        base: "tasmota_TOILET",
        gangs: 3,
        roomType: "toilet",
        roomId: "toilet",
      },
    ]);

    automation.handleButtonPress("toilet-main-g1", 1, "single");

    assert.deepEqual(mqtt.published, [
      { topic: "devices/toilet-main-g1/cmd", payload: '{"on":true}' },
    ]);
    assert.equal(fakeTimeouts[0].delay, 10 * 60 * 1000);

    fakeTimeouts[0].fn();

    assert.deepEqual(mqtt.published, [
      { topic: "devices/toilet-main-g1/cmd", payload: '{"on":true}' },
      { topic: "devices/toilet-main-g1/cmd", payload: '{"on":false}' },
    ]);
  });

  it("uses the long duration for a LONG press", () => {
    const { automation } = makeAutomation([
      {
        switchId: "toilet-main",
        base: "tasmota_TOILET",
        gangs: 3,
        roomType: "toilet",
        roomId: "toilet",
      },
    ]);

    automation.handleButtonPress("toilet-main-g2", 2, "long");

    assert.equal(fakeTimeouts[0].delay, 20 * 60 * 1000);
  });

  it("manual OFF cancels that gang timer", () => {
    const { automation, deviceService, timerPersistence } = makeAutomation([
      {
        switchId: "toilet-main",
        base: "tasmota_TOILET",
        gangs: 3,
        roomType: "toilet",
        roomId: "toilet",
      },
    ]);

    automation.handleButtonPress("toilet-main-g1", 1, "single");
    deviceService.setState("toilet-main-g1", {
      type: "switch",
      state: { on: false },
    });
    automation.onDeviceStateChanged(deviceService.getState("toilet-main-g1"));

    assert.equal(fakeTimeouts[0].cleared, true);
    assert.deepEqual(timerPersistence.saved, []);
  });

  it("bedroom gang 1 stays on without creating a timer", () => {
    const { automation, mqtt } = makeAutomation([
      {
        switchId: "bedroom-main",
        base: "tasmota_BED",
        gangs: 2,
        roomType: "bedroom",
        roomId: "bedroom",
      },
    ]);

    automation.handleButtonPress("bedroom-main-g1", 1, "single");

    assert.deepEqual(mqtt.published, [
      { topic: "devices/bedroom-main-g1/cmd", payload: '{"on":true}' },
    ]);
    assert.equal(fakeTimeouts.length, 0);
  });

  it("restart with an expired persisted timer publishes OFF", () => {
    const { timers, mqtt, deviceService } = makeAutomation(
      [
        {
          switchId: "toilet-main",
          base: "tasmota_TOILET",
          gangs: 3,
          roomType: "toilet",
          roomId: "toilet",
        },
      ],
      [
        {
          deviceId: "toilet-main-g3",
          gang: 3,
          expiresAt: new Date(now - 1000).toISOString(),
        },
      ],
    );

    timers.restore((deviceId) =>
      deviceService.sendCommand(deviceId, { on: false }),
    );

    assert.deepEqual(mqtt.published, [
      { topic: "devices/toilet-main-g3/cmd", payload: '{"on":false}' },
    ]);
  });

  it("restart with a live persisted timer re-arms for the remainder", () => {
    const { timers, mqtt, deviceService } = makeAutomation(
      [
        {
          switchId: "toilet-main",
          base: "tasmota_TOILET",
          gangs: 3,
          roomType: "toilet",
          roomId: "toilet",
        },
      ],
      [
        {
          deviceId: "toilet-main-g2",
          gang: 2,
          expiresAt: new Date(now + 5000).toISOString(),
        },
      ],
    );

    timers.restore((deviceId) =>
      deviceService.sendCommand(deviceId, { on: false }),
    );

    assert.equal(fakeTimeouts[0].delay, 5000);
    assert.deepEqual(mqtt.published, []);
    fakeTimeouts[0].fn();
    assert.deepEqual(mqtt.published, [
      { topic: "devices/toilet-main-g2/cmd", payload: '{"on":false}' },
    ]);
  });
});
