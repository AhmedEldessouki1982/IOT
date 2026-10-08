import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DeviceService } from "../dist/device/device.service.js";

/** Builds a DeviceService with an in-memory persistence stub. */
function makeService() {
  const recorded = [];
  const persistence = {
    getSnapshot: () => [],
    record: (state) => recorded.push(state),
  };
  const mqtt = { publish: () => {} };
  const service = new DeviceService(mqtt, persistence);
  return { service, recorded };
}

describe("DeviceService.setState dedupe", () => {
  it("records history only when the state actually changes", () => {
    const { service, recorded } = makeService();

    assert.equal(
      service.setState("light1", { type: "switch", state: { on: true } }),
      true,
    );
    assert.equal(
      service.setState("light1", { type: "switch", state: { on: true } }),
      false,
      "identical replay must not append history",
    );
    assert.equal(
      service.setState("light1", { type: "switch", state: { on: false } }),
      true,
    );
    assert.equal(recorded.length, 2);
    assert.deepEqual(
      recorded.map((r) => r.state),
      [{ on: true }, { on: false }],
    );
  });

  it("treats a partial update that changes nothing as unchanged", () => {
    const { service, recorded } = makeService();

    service.setState("sonoff1", { type: "switch", state: { on: false } });
    assert.equal(
      service.setState("sonoff1", { type: "switch", state: { on: false } }),
      false,
    );
    assert.equal(recorded.length, 1);
  });

  it("treats a new field or new device as a change", () => {
    const { service, recorded } = makeService();

    service.setState("light1", { type: "switch", state: { on: true } });
    assert.equal(
      service.setState("light1", { type: "switch", state: { on: true, dim: 30 } }),
      true,
    );
    assert.equal(
      service.setState("light2", { type: "switch", state: { on: true } }),
      true,
      "first sighting of a device always records",
    );
    assert.equal(recorded.length, 3);
  });
});
