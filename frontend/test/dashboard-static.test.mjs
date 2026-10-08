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
});
