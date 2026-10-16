import { ALL_ROOMS } from "../dashboard/rooms";
import { liveDeviceId } from "../features/devices/deviceRuntime";

export interface GangConfig {
  id: string;
  gang: number;
  label: string;
}

export interface RoomConfig {
  id: string;
  name: string;
  gangs: GangConfig[];
}

function gangForDeviceId(deviceId: string, fallback: number): number {
  const registryMatch = /-g([1-3])$/.exec(deviceId);
  if (registryMatch) return Number(registryMatch[1]);
  const legacyMatch = /^sonoff([1-3])$/.exec(deviceId);
  if (legacyMatch) return Number(legacyMatch[1]);
  return fallback;
}

export const ROOMS_CONFIG: RoomConfig[] = ALL_ROOMS.map((room) => ({
  id: room.id,
  name: room.name,
  gangs: [...room.devices, ...(room.switches ?? [])]
    .map((device, index) => {
      const deviceId = liveDeviceId(device);
      if (!deviceId) return null;
      return {
        id: deviceId,
        gang: gangForDeviceId(deviceId, index + 1),
        label: device.label,
      };
    })
    .filter((gang): gang is GangConfig => gang !== null),
}));
