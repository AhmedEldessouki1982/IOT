import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
test("every DeviceKind has an icon and appliance rows receive it", () => {
  const source = readFileSync(new URL("../src/features/devices/deviceKinds.ts", import.meta.url), "utf8");
  const kinds = [...source.split("export type DeviceKind =")[1].split(";")[0].matchAll(/"([^"]+)"/g)].map(m => m[1]);
  const icons = source.split("const ICONS:")[1];
  for (const kind of kinds) assert.match(icons, new RegExp(`(?:"${kind}"|${kind}):\\s*\\{\\s*icon:`));
  const card = readFileSync(new URL("../src/features/devices/CardDevice.tsx", import.meta.url), "utf8");
  assert.match(card, /kind: "appliance",\s*icon,/);
  assert.doesNotMatch(card, /badge:.*"demo"/);
});
