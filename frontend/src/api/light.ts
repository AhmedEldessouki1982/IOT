const BASE_URL = 'http://localhost:3000';

export interface LightState {
  deviceId: string;
  state: 'on' | 'off';
  timestamp: string;
}

export async function getState(): Promise<LightState> {
  const res = await fetch(`${BASE_URL}/light/state`);
  return res.json();
}

export async function toggle(): Promise<{ state: 'on' | 'off' }> {
  const res = await fetch(`${BASE_URL}/light/toggle`, { method: 'POST' });
  return res.json();
}