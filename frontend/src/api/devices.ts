const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export interface DeviceState {
  deviceId: string;
  type: string;
  state: Record<string, unknown>;
  timestamp: string;
}

export async function getDevice(deviceId: string): Promise<DeviceState> {
  const res = await fetch(`${BASE_URL}/devices/${deviceId}`);
  if (!res.ok) throw new Error(`GET /devices/${deviceId} failed: ${res.status}`);
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
