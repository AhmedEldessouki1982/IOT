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

  /** Resolved once the on-disk snapshot has been merged into memory. */
  private readonly ready: Promise<void>;

  constructor(config: ConfigService) {
    this.dataDir = resolve(config.get<string>("DATA_DIR") ?? ".data");
    this.statePath = join(this.dataDir, "device-states.json");
    this.historyPath = join(this.dataDir, "device-history.json");
    // Start loading at construction time: Nest runs providers' onModuleInit
    // hooks in registration order, so a consumer (DeviceService) would read an
    // empty snapshot if loading only started here. Awaiting `whenReady()` makes
    // the read order independent of hook order.
    this.ready = this.load();
  }

  async onModuleInit(): Promise<void> {
    await this.ready;
  }

  /** Await the disk snapshot; safe to call from any onModuleInit hook. */
  async whenReady(): Promise<void> {
    await this.ready;
  }

  private async load(): Promise<void> {
    await mkdir(this.dataDir, { recursive: true });
    // Anything recorded while the read was in flight is newer than the file,
    // so it is laid over the loaded entries rather than replaced by them.
    const states = await this.readMap<DeviceState>(this.statePath);
    for (const [deviceId, state] of this.states) states.set(deviceId, state);
    this.states = states;

    const history = await this.readMap<DeviceHistoryEntry[]>(this.historyPath);
    for (const [deviceId, entries] of this.history) {
      history.set(deviceId, [...(history.get(deviceId) ?? []), ...entries]);
    }
    this.history = history;
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
