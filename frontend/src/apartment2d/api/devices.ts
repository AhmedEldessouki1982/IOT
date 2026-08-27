import type { DeviceState } from "../types";

const BASE_URL = "http://localhost:3000";

/** All devices the backend currently knows (wildcard-discovered over MQTT). */
export async function getAllDevices(): Promise<DeviceState[]> {
  const res = await fetch(`${BASE_URL}/devices`);
  if (!res.ok) throw new Error(`GET /devices failed: ${res.status}`);
  return res.json();
}

export async function getDevice(id: string): Promise<DeviceState> {
  const res = await fetch(`${BASE_URL}/devices/${id}`);
  if (!res.ok) throw new Error(`GET /devices/${id} failed: ${res.status}`);
  return res.json();
}

/**
 * Sends a JSON command object through the EXISTING generic command endpoint.
 * The backend relays it verbatim to `devices/<id>/cmd` — no new API created.
 */
export async function sendCommand(
  deviceId: string,
  command: Record<string, unknown>,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/devices/${deviceId}/command`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
  if (!res.ok) throw new Error(`command failed: ${res.status}`);
}
