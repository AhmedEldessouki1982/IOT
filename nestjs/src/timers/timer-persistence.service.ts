import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

export interface PersistedTimerEntry {
  deviceId: string;
  gang: number;
  expiresAt: string;
}

function isPersistedTimerEntry(value: unknown): value is PersistedTimerEntry {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entry = value as PersistedTimerEntry;
  return (
    typeof entry.deviceId === "string" &&
    Number.isInteger(entry.gang) &&
    typeof entry.expiresAt === "string"
  );
}

@Injectable()
export class TimerPersistenceService implements OnModuleInit {
  private readonly logger = new Logger(TimerPersistenceService.name);
  private readonly dataDir: string;
  private readonly timersPath: string;
  private timers: PersistedTimerEntry[] = [];
  private pendingWrite: Promise<void> = Promise.resolve();

  constructor(config: ConfigService) {
    this.dataDir = resolve(config.get<string>("DATA_DIR") ?? ".data");
    this.timersPath = join(this.dataDir, "timers.json");
  }

  async onModuleInit(): Promise<void> {
    await mkdir(this.dataDir, { recursive: true });
    this.timers = await this.readTimers();
    this.logger.log(
      `Timer persistence ready: ${this.timers.length} timers loaded`,
    );
  }

  getSnapshot(): PersistedTimerEntry[] {
    return [...this.timers];
  }

  save(entries: PersistedTimerEntry[]): void {
    this.timers = [...entries];
    this.pendingWrite = this.pendingWrite
      .then(() => this.writeTimers(this.timers))
      .catch((err: Error) =>
        this.logger.error(`Failed to persist timers: ${err.message}`),
      );
  }

  private async readTimers(): Promise<PersistedTimerEntry[]> {
    try {
      const raw = await readFile(this.timersPath, "utf8");
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isPersistedTimerEntry);
    } catch {
      return [];
    }
  }

  private async writeTimers(entries: PersistedTimerEntry[]): Promise<void> {
    await mkdir(this.dataDir, { recursive: true });
    const tmpPath = `${this.timersPath}.tmp`;
    await writeFile(tmpPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
    await rename(tmpPath, this.timersPath);
  }
}
