const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export interface DeviceState {
  deviceId: string;
  type: string;
  state: Record<string, unknown>;
  timestamp: string;
}

export interface DeviceHistoryEntry extends DeviceState {
  recordedAt: string;
}

/** All known device states — empty list (never 404) if nothing reported yet. */
export async function getDevices(): Promise<DeviceState[]> {
  const res = await fetch(`${BASE_URL}/devices`);
  if (!res.ok)
    throw new Error(`GET /devices failed: ${res.status}`);
  return res.json();
}

export async function getDeviceHistory(
  deviceId: string,
): Promise<DeviceHistoryEntry[]> {
  const res = await fetch(`${BASE_URL}/devices/${deviceId}/history`);
  if (!res.ok)
    throw new Error(`GET /devices/${deviceId}/history failed: ${res.status}`);
  return res.json();
}

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
