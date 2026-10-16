import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ROUTINE_PRESETS,
  getRoutineForRoomType,
  routineGangsFor,
  routineHint,
} from "../dist/routines/routine.config.js";
import { TIMER_RULES } from "../dist/timers/timer.config.js";
import { RoutinesService } from "../dist/routines/routines.service.js";

/** Minimal registry/gang double mirroring SonoffRegistryService.getGangs(). */
function gangList(switches) {
  return switches.flatMap((sw) =>
    Array.from({ length: sw.gangs }, (_, index) => {
      const gang = index + 1;
      return {
        switchId: sw.switchId,
        base: sw.base,
        gang,
        deviceId: sw.switchId === "reception" ? `sonoff${gang}` : `${sw.switchId}-g${gang}`,
        roomType: sw.roomType,
        roomId: sw.roomId,
      };
    }),
  );
}

function makeRoutines({ switches = [], states = {}, timers = [] } = {}) {
  const registry = { getGangs: () => gangList(switches), getSwitches: () => switches };
  const deviceService = { getState: (id) => states[id] };
  const cancelled = [];
  const timersService = {
    getAll: () => timers,
    cancel: (deviceId, gang) => cancelled.push({ deviceId, gang }),
  };
  const pressed = [];
  const automation = {
    handleButtonPress: (deviceId, gang) => pressed.push({ deviceId, gang }),
  };
  const service = new RoutinesService(registry, deviceService, timersService, automation);
  return { service, pressed, cancelled };
}

const TOILET_SWITCH = {
  switchId: "toilet-main",
  base: "mainToilet",
  gangs: 3,
  roomType: "toilet",
  roomId: "toilet",
};

describe("routine presets", () => {
  it("encodes the agreed click cycle (stages + labels)", () => {
    const toilet = ROUTINE_PRESETS.toilet;
    assert.deepEqual(
      toilet.gangs.map((g) => ({ gang: g.gang, label: g.label, stages: g.stages })),
      [
        { gang: 1, label: "LED profile", stages: [10, 30] },
        { gang: 2, label: "Spotlights", stages: [10, 30] },
        { gang: 3, label: "Exhaust fan", stages: [10] },
      ],
    );
  });

  it("is the single source of truth for TIMER_RULES (no duplicate table)", () => {
    assert.deepEqual(TIMER_RULES.toilet[1], {
      role: "LED profile",
      stages: [10, 30],
    });
    assert.deepEqual(TIMER_RULES.toilet[3].stages, [10]);
    assert.equal(TIMER_RULES.bedroom[1].noTimer, true);
    assert.deepEqual(TIMER_RULES.bedroom[2].stages, [20, 30]);
  });

  it("builds hints per stage list", () => {
    assert.equal(routineHint(ROUTINE_PRESETS.toilet.gangs[0]), "10m → 30m → off");
    assert.equal(routineHint(ROUTINE_PRESETS.toilet.gangs[1]), "10m → 30m → off");
    // the exhaust exception is just a one-stage list
    assert.equal(routineHint(ROUTINE_PRESETS.toilet.gangs[2]), "10m → off");
    assert.equal(routineHint(ROUTINE_PRESETS.bedroom.gangs[1]), "20m → 30m → off");
    assert.equal(routineHint(ROUTINE_PRESETS.bedroom.gangs[0]), "On / off");
  });

  it("resolves routines by room type and clamps gangs to the switch size", () => {
    assert.equal(getRoutineForRoomType("toilet")?.id, "toilet");
    assert.equal(getRoutineForRoomType("none"), undefined);
    assert.deepEqual(
      routineGangsFor("toilet", 2).map((g) => g.gang),
      [1, 2],
    );
  });
});

describe("RoutinesService", () => {
  it("builds a room view with labels, stages, live state and timers", () => {
    const { service } = makeRoutines({
      switches: [TOILET_SWITCH],
      states: { "toilet-main-g1": { deviceId: "toilet-main-g1", state: { on: true } } },
      timers: [
        {
          deviceId: "toilet-main-g2",
          gang: 2,
          remainingSeconds: 1500,
          expiresAt: new Date("2026-01-01T00:25:00Z"),
          durationSeconds: 1800,
        },
      ],
    });

    const rooms = service.listRooms();
    assert.equal(rooms.length, 1);
    const room = rooms[0];
    assert.equal(room.roomId, "toilet");
    assert.equal(room.routineId, "toilet");
    assert.equal(room.routineLabel, "Toilet");
    assert.deepEqual(
      room.gangs.map((g) => g.label),
      ["LED profile", "Spotlights", "Exhaust fan"],
    );
    assert.deepEqual(
      room.gangs.map((g) => g.stages),
      [[10, 30], [10, 30], [10]],
    );
    assert.deepEqual(
      room.gangs.map((g) => g.hint),
      ["10m → 30m → off", "10m → 30m → off", "10m → off"],
    );
    assert.equal(room.gangs[0].on, true);
    assert.equal(room.gangs[0].timer, null);
    // a running 30 min timer means stage 2 is armed
    assert.equal(room.gangs[1].stage, 2);
    assert.equal(room.gangs[1].timer.remainingSeconds, 1500);
    assert.equal(room.gangs[1].timer.durationSeconds, 1800);
    assert.equal(room.gangs[1].timer.expiresAt, "2026-01-01T00:25:00.000Z");
    assert.equal(room.gangs[2].stage, null);
  });

  it("maps an unrecognized running duration to no stage", () => {
    const { service } = makeRoutines({
      switches: [TOILET_SWITCH],
      timers: [
        {
          deviceId: "toilet-main-g1",
          gang: 1,
          remainingSeconds: 60,
          expiresAt: new Date("2026-01-01T00:01:00Z"),
          durationSeconds: 90,
        },
      ],
    });
    assert.equal(service.listRooms()[0].gangs[0].stage, null);
  });

  it("excludes switches without a routine (roomType none)", () => {
    const { service } = makeRoutines({
      switches: [
        { switchId: "reception", base: "tasmota_REC", gangs: 3, roomType: "none", roomId: "reception" },
      ],
    });
    assert.deepEqual(service.listRooms(), []);
  });

  it("reuses one routine across a second toilet with no extra code", () => {
    const { service } = makeRoutines({
      switches: [
        TOILET_SWITCH,
        { switchId: "toilet-master", base: "masterToilet", gangs: 3, roomType: "toilet", roomId: "toilet-master" },
      ],
    });
    const rooms = service.listRooms();
    assert.deepEqual(
      rooms.map((r) => r.roomId).sort(),
      ["toilet", "toilet-master"],
    );
    assert.deepEqual(
      rooms[0].gangs.map((g) => g.hint),
      rooms[1].gangs.map((g) => g.hint),
    );
    assert.deepEqual(
      rooms[0].gangs.map((g) => g.deviceId),
      ["toilet-main-g1", "toilet-main-g2", "toilet-main-g3"],
    );
  });

  it("delegates a press (one cycle advance) to automation", () => {
    const { service, pressed } = makeRoutines({ switches: [TOILET_SWITCH] });
    service.press("toilet", 2);
    assert.deepEqual(pressed, [{ deviceId: "toilet-main-g2", gang: 2 }]);
  });

  it("delegates timer cancellation and reports the room back", () => {
    const { service, cancelled } = makeRoutines({ switches: [TOILET_SWITCH] });
    const room = service.cancelTimer("toilet", 3);
    assert.deepEqual(cancelled, [{ deviceId: "toilet-main-g3", gang: 3 }]);
    assert.equal(room.roomId, "toilet");
  });

  it("throws for an unknown room or gang", () => {
    const { service } = makeRoutines({ switches: [TOILET_SWITCH] });
    assert.throws(() => service.getRoom("nope"), /not found/);
    assert.throws(() => service.press("toilet", 9), /no gang 9/);
  });
});
