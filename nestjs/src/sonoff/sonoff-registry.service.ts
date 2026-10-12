import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { readFileSync } from "node:fs";
import { RoomType } from "../common/press.types";

export type SonoffRoomType = RoomType | "none";

export interface SonoffSwitchConfig {
  switchId: string;
  base: string;
  gangs: 1 | 2 | 3;
  roomType: SonoffRoomType;
  roomId: string;
}

export interface SonoffGang {
  switchId: string;
  base: string;
  gang: number;
  deviceId: string;
  roomType: SonoffRoomType;
  roomId: string;
}

interface RawSonoffSwitchConfig {
  switchId?: unknown;
  base?: unknown;
  gangs?: unknown;
  roomType?: unknown;
  roomId?: unknown;
}

const LEGACY_SWITCH_ID = "reception";
const LEGACY_ROOM_ID = "reception";
const VALID_ROOM_TYPES = new Set<SonoffRoomType>(["toilet", "bedroom", "none"]);

export function deviceIdForGang(switchId: string, gang: number): string {
  if (switchId === LEGACY_SWITCH_ID) return `sonoff${gang}`;
  return `${switchId}-g${gang}`;
}

function isGangCount(value: number): value is 1 | 2 | 3 {
  return Number.isInteger(value) && value >= 1 && value <= 3;
}

function normalizeSwitchConfig(
  raw: RawSonoffSwitchConfig,
): SonoffSwitchConfig | null {
  const switchId = typeof raw.switchId === "string" ? raw.switchId.trim() : "";
  const base = typeof raw.base === "string" ? raw.base.trim() : "";
  const gangs = Number(raw.gangs);
  const roomType = typeof raw.roomType === "string" ? raw.roomType.trim() : "";
  const roomId = typeof raw.roomId === "string" ? raw.roomId.trim() : "";

  if (!switchId || !/^[a-zA-Z0-9_-]+$/.test(switchId)) return null;
  if (!base) return null;
  if (!isGangCount(gangs)) return null;
  if (!VALID_ROOM_TYPES.has(roomType as SonoffRoomType)) return null;

  return {
    switchId,
    base,
    gangs,
    roomType: roomType as SonoffRoomType,
    roomId: roomId || switchId,
  };
}

export function expandSwitchConfig(config: SonoffSwitchConfig): SonoffGang[] {
  return Array.from({ length: config.gangs }, (_, index) => {
    const gang = index + 1;
    return {
      switchId: config.switchId,
      base: config.base,
      gang,
      deviceId: deviceIdForGang(config.switchId, gang),
      roomType: config.roomType,
      roomId: config.roomId,
    };
  });
}

export function parseSonoffSwitchesJson(value: string): SonoffSwitchConfig[] {
  const parsed = JSON.parse(value) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("SONOFF_SWITCHES_JSON must be a JSON array");
  }
  return parsed
    .map((entry) => normalizeSwitchConfig(entry as RawSonoffSwitchConfig))
    .filter((entry): entry is SonoffSwitchConfig => entry !== null);
}

@Injectable()
export class SonoffRegistryService {
  private readonly logger = new Logger(SonoffRegistryService.name);
  private readonly switches: SonoffSwitchConfig[];
  private readonly gangs: SonoffGang[];
  private readonly byDeviceId: Map<string, SonoffGang>;
  private readonly byBase: Map<string, SonoffSwitchConfig>;

  constructor(config: ConfigService) {
    this.switches = this.loadSwitches(config);
    this.gangs = this.switches.flatMap(expandSwitchConfig);
    this.byDeviceId = new Map(this.gangs.map((gang) => [gang.deviceId, gang]));
    this.byBase = new Map(this.switches.map((entry) => [entry.base, entry]));

    if (this.switches.length === 0) {
      this.logger.warn(
        "No Sonoff switches configured — Tasmota bridge disabled.",
      );
    }
  }

  getSwitches(): SonoffSwitchConfig[] {
    return this.switches;
  }

  getGangs(): SonoffGang[] {
    return this.gangs;
  }

  getGang(deviceId: string): SonoffGang | undefined {
    return this.byDeviceId.get(deviceId);
  }

  getGangForButton(
    deviceOrSwitchId: string,
    gang: number,
  ): SonoffGang | undefined {
    const byDeviceId = this.byDeviceId.get(deviceOrSwitchId);
    if (byDeviceId) {
      return byDeviceId.gang === gang ? byDeviceId : undefined;
    }
    return this.gangs.find(
      (entry) => entry.switchId === deviceOrSwitchId && entry.gang === gang,
    );
  }

  getSwitchByBase(base: string): SonoffSwitchConfig | undefined {
    return this.byBase.get(base);
  }

  getRoomTypeForDevice(deviceId: string): RoomType | null {
    const roomType = this.byDeviceId.get(deviceId)?.roomType;
    return roomType === "toilet" || roomType === "bedroom" ? roomType : null;
  }

  private loadSwitches(config: ConfigService): SonoffSwitchConfig[] {
    const json = config.get<string>("SONOFF_SWITCHES_JSON")?.trim();
    if (json) return parseSonoffSwitchesJson(json);

    const file = config.get<string>("SONOFF_SWITCHES_FILE")?.trim();
    if (file) return parseSonoffSwitchesJson(readFileSync(file, "utf8"));

    const legacyBase = config.get<string>("SONOFF_BASE")?.trim();
    if (!legacyBase) return [];

    return [
      {
        switchId: LEGACY_SWITCH_ID,
        base: legacyBase,
        gangs: 3,
        roomType: "none",
        roomId: LEGACY_ROOM_ID,
      },
    ];
  }
}
