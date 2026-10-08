import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { DeviceState } from "./device.service";

export interface DeviceHistoryEntry extends DeviceState {
  recordedAt: string;
}

@Injectable()
export class DevicePersistenceService implements OnModuleInit {
  private readonly logger = new Logger(DevicePersistenceService.name);
  private readonly dataDir: string;
  private readonly statePath: string;
  private readonly historyPath: string;
  private states = new Map<string, DeviceState>();
  private history = new Map<string, DeviceHistoryEntry[]>();
  private pendingWrite: Promise<void> = Promise.resolve();

  constructor(config: ConfigService) {
    this.dataDir = resolve(config.get<string>("DATA_DIR") ?? ".data");
    this.statePath = join(this.dataDir, "device-states.json");
    this.historyPath = join(this.dataDir, "device-history.json");
  }

  async onModuleInit(): Promise<void> {
    await mkdir(this.dataDir, { recursive: true });
    this.states = await this.readMap<DeviceState>(this.statePath);
    this.history = await this.readMap<DeviceHistoryEntry[]>(this.historyPath);
    // Sanitize legacy files: earlier builds appended a row per MQTT message,
    // so reconnect replays left runs of identical consecutive entries.
    let dropped = 0;
    for (const [deviceId, list] of this.history) {
      const clean = list.filter(
        (entry, i) =>
          i === 0 ||
          JSON.stringify(entry.state) !== JSON.stringify(list[i - 1].state) ||
          entry.type !== list[i - 1].type,
      );
      dropped += list.length - clean.length;
      this.history.set(deviceId, clean);
    }
    if (dropped > 0) {
      this.logger.log(`Dropped ${dropped} duplicate history entries`);
      this.queueWrite();
    }
    this.logger.log(
      `Device persistence ready: ${this.states.size} states loaded from ${this.dataDir}`,
    );
  }

  getSnapshot(): DeviceState[] {
    return [...this.states.values()];
  }

  getHistory(deviceId: string, limit = 50): DeviceHistoryEntry[] {
    return (this.history.get(deviceId) ?? []).slice(-limit);
  }

  record(state: DeviceState): void {
    this.states.set(state.deviceId, state);
    const list = this.history.get(state.deviceId) ?? [];
    list.push({ ...state, recordedAt: new Date().toISOString() });
    this.history.set(state.deviceId, list.slice(-250));
    this.queueWrite();
  }

  private queueWrite(): void {
    this.pendingWrite = this.pendingWrite
      .then(() =>
        Promise.all([
          this.writeMap(this.statePath, this.states),
          this.writeMap(this.historyPath, this.history),
        ]).then(() => undefined),
      )
      .catch((err: Error) =>
        this.logger.error(`Failed to persist device state: ${err.message}`),
      );
  }

  private async readMap<T>(filePath: string): Promise<Map<string, T>> {
    try {
      const raw = await readFile(filePath, "utf8");
      const parsed = JSON.parse(raw) as Record<string, T>;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return new Map();
      }
      return new Map(Object.entries(parsed));
    } catch {
      return new Map();
    }
  }

  private async writeMap<T>(filePath: string, map: Map<string, T>): Promise<void> {
    await writeFile(
      filePath,
      `${JSON.stringify(Object.fromEntries(map), null, 2)}\n`,
      "utf8",
    );
  }
}
