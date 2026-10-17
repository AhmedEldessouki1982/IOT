import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

describe("dashboard feature boundaries", () => {
  it("keeps the dormant 3D viewer isolated from the dashboard", () => {
    const app = read("src/App.tsx");
    const roomCard = read("src/dashboard/RoomCard.tsx");

    assert.equal(app.includes("./3d/"), false);
    assert.equal(roomCard.includes("../3d/"), false);
    assert.equal(roomCard.includes("room-card-3d"), false);
  });

  it("keeps scene actions aligned with declared room devices", () => {
    const rooms = read("src/dashboard/rooms.ts");
    const scenes = read("src/dashboard/scenes.ts");
    const knownIds = new Set(
      [...rooms.matchAll(/\bid:\s*"([^"]+)"/g)].map((match) => match[1]),
    );
    const sceneIds = [...scenes.matchAll(/\bid:\s*"([^"]+)"/g)]
      .map((match) => match[1])
      .filter((id) => !["evening", "cooking", "away"].includes(id));

    assert.deepEqual(
      sceneIds.filter((id) => !knownIds.has(id)),
      [],
    );
  });

  it("keeps the business framework shell sections wired", () => {
    const app = read("src/App.tsx");
    for (const section of [
      "home",
      "rooms",
      "scenes",
      "security",
      "devices",
      "activity",
      "settings",
    ]) {
      assert.equal(app.includes(`id: "${section}"`), true);
    }
    assert.equal(app.includes("SecurityView"), true);
    assert.equal(app.includes("DevicesView"), true);
    assert.equal(app.includes("SettingsView"), true);
  });

  it("keeps the full room grid exclusive to Rooms", () => {
    const home = read("src/views/HomeView.tsx");
    const rooms = read("src/views/RoomGrid.tsx");
    const roomStyles = read("src/styles/components/rooms.css");
    assert.equal(home.includes("RoomGrid"), false);
    assert.equal(rooms.includes("ROOMS.map"), true);
    assert.equal(roomStyles.includes("room-card--wide"), false);
    assert.equal(roomStyles.includes("room-card--narrow"), false);
  });

  it("nests the master toilet inside the master suite", () => {
    const rooms = read("src/dashboard/rooms.ts");
    const roomCard = read("src/dashboard/RoomCard.tsx");
    const roomDetail = read("src/dashboard/RoomDetail.tsx");
    const roomGrid = read("src/views/RoomGrid.tsx");

    // the nested room is an ordinary Room config bound to its own routine room
    assert.equal(rooms.includes('routineId: "toilet-master"'), true);
    assert.equal(rooms.includes("toilet-master-g1"), true);
    assert.equal(rooms.includes("export const ALL_ROOMS"), true);

    // rendered by reusing the same card / detail components, one level in
    assert.equal(roomCard.includes("nested.map"), true);
    assert.equal(roomGrid.includes("nested={room.nested}"), true);
    assert.equal(roomDetail.includes('className="room-detail-nested"'), true);
  });

  it("wires the master bedroom switch as a plain, routine-less room", () => {
    const rooms = read("src/dashboard/rooms.ts");
    const roomPanel = read("src/features/routines/RoutinePanel.tsx");
    const switchCard = read("src/components/SwitchCard.tsx");

    // three real gangs on the master card, and the old dummy light is gone
    assert.equal(rooms.includes('id: "masterRoom-g1"'), true);
    assert.equal(rooms.includes('id: "masterRoom-g3"'), true);
    assert.equal(rooms.includes('id: "light7"'), false);

    // a routine-less room toggles plainly; only routine rooms advance a stage,
    // even though both id shapes end in "-g<n>"
    assert.equal(roomPanel.includes("routine={Boolean(roomId)}"), true);
    assert.equal(switchCard.includes("routine ?? timerGang !== null"), true);
  });

  it("adds the Girl Room as a second manual room and drops the placeholders", () => {
    const rooms = read("src/dashboard/rooms.ts");
    const roomCard = read("src/dashboard/RoomCard.tsx");
    const scenes = read("src/dashboard/scenes.ts");

    // three real gangs, same plain-room shape as the master bedroom switch
    assert.equal(rooms.includes('id: "girlRoom-g1"'), true);
    assert.equal(rooms.includes('id: "girlRoom-g3"'), true);
    assert.equal(rooms.includes('id: "bed1"'), false);
    assert.equal(rooms.includes('id: "bed2"'), false);

    // lucide ships no "Girl" glyph, so the card uses the Venus symbol (♀)
    assert.equal(roomCard.includes("girlRoom: Venus"), true);

    // the Away scene tracks the room list — dropped rooms leave the scene,
    // and the new gangs join it
    assert.equal(scenes.includes('id: "light5"'), false);
    assert.equal(scenes.includes('id: "light6"'), false);
    assert.equal(scenes.includes('id: "girlRoom-g2"'), true);
  });

  it("keeps device registry operations available for business deployments", () => {
    const app = read("src/views/DevicesView.tsx");
    const css = read("src/styles/components/panels.css");

    assert.equal(app.includes("filteredDeviceRecords"), true);
    assert.equal(app.includes("deviceHealthFilter"), true);
    assert.equal(app.includes("deviceSourceFilter"), true);
    assert.equal(app.includes("KpiRail"), true);
    assert.equal(css.includes(".device-toolbar"), true);
    assert.equal(css.includes(".empty-state"), true);
  });

  it("keeps timers socket-driven and room config derived from dashboard rooms", () => {
    const timers = read("src/hooks/useTimers.ts");
    const roomsConfig = read("src/config/rooms.ts");
    const switchCard = read("src/components/SwitchCard.tsx");

    assert.equal(timers.includes("timer:update"), true);
    assert.equal(timers.includes("setInterval(fetchTimers, 500)"), false);
    assert.equal(roomsConfig.includes("../dashboard/rooms"), true);
    assert.equal(switchCard.includes("/api/devices/${deviceId}/button"), true);
  });

  it("keeps App as shell while dashboard data lives in hooks and views", () => {
    const app = read("src/App.tsx");
    const historyHook = read("src/hooks/useDeviceHistory.ts");

    assert.equal(app.includes("useDeviceHistory"), true);
    assert.equal(app.includes("useSceneRunner"), true);
    assert.equal(app.includes("const renderScenes"), false);
    assert.equal(historyHook.includes("liveIdsKey"), true);
    assert.equal(historyHook.includes("setTimeout"), true);
  });
});
