import kitchenGlb from "./resources/2026-09-15/v3.2026-09-15.glb?url";

/**
 * Per-room 3D asset manifest. A room only gains a working "3D" button once
 * it has an entry here — currently that's the Kitchen (`r02`) only. Adding a
 * second room later is just one entry here plus an additional mapping in
 * ROOM_3D_ID; no Kitchen-specific components exist.
 *
 * Values are Vite `?url` imports so the GLB is hashed/copied at build time
 * instead of requiring a hardcoded public path.
 */
export const ROOM_ASSETS: Record<string, { glb: string }> = {
  r02: { glb: kitchenGlb },
};

/**
 * Bridge between the dashboard's room id (`RoomCard.id`, e.g. "kitchen") and
 * the 3D manifest key (a Blender-style room id like `r02`). Only rooms listed
 * here can ever have a working 3D button.
 */
export const ROOM_3D_ID: Record<string, string> = {
  kitchen: "r02",
};

/** Friendly popup title keyed by the 3D manifest key. */
const ROOM_TITLES: Record<string, string> = {
  r02: "Kitchen",
};

/** True when the dashboard room id has a GLB asset registered. */
export function hasRoomAsset(dashboardRoomId: string): boolean {
  const assetId = ROOM_3D_ID[dashboardRoomId];
  return !!assetId && !!ROOM_ASSETS[assetId];
}

/** Display title for a 3D room id, falling back to the id itself. */
export function roomTitle(assetRoomId: string): string {
  return ROOM_TITLES[assetRoomId] ?? assetRoomId;
}