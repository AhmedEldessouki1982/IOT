import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import {
  PersistedTimerEntry,
  TimerPersistenceService,
} from "./timer-persistence.service";

export interface TimerEntry {
  deviceId: string;
  gang: number;
  expiresAt: Date;
  remainingSeconds: number;
  durationSeconds?: number;
}

export interface TimerEvent {
  deviceId: string;
  gang: number;
  minutes: number;
  expiresAt: Date;
}

interface RuntimeTimer {
  durationSeconds?: number;
  deviceId: string;
  gang: number;
  handle: NodeJS.Timeout;
  expiresAt: Date;
}

@Injectable()
export class TimersService implements OnModuleDestroy {
  private readonly logger = new Logger(TimersService.name);
  private readonly timers = new Map<string, RuntimeTimer>();

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly persistence: TimerPersistenceService,
  ) {}

  private getKey(deviceId: string, gang: number): string {
    return `${deviceId}:${gang}`;
  }

  start(
    deviceId: string,
    gang: number,
    minutes: number,
    onExpire: () => void,
  ): void {
    if (minutes <= 0) return;
    const expiresAt = new Date(Date.now() + minutes * 60000);
    this.arm(deviceId, gang, expiresAt, onExpire, minutes * 60);
    this.emitTimerEvent("timer.started", {
      deviceId,
      gang,
      minutes,
      expiresAt,
    });
    this.persistAndBroadcast();
  }

  restore(onExpire: (deviceId: string, gang: number) => void): void {
    let changed = false;
    for (const entry of this.persistence.getSnapshot()) {
      const expiresAt = new Date(entry.expiresAt);
      if (Number.isNaN(expiresAt.getTime())) {
        changed = true;
        continue;
      }
      if (expiresAt.getTime() <= Date.now()) {
        onExpire(entry.deviceId, entry.gang);
        changed = true;
        continue;
      }
      this.arm(entry.deviceId, entry.gang, expiresAt, () =>
        onExpire(entry.deviceId, entry.gang), entry.durationSeconds,
      );
    }
    if (changed) this.persist();
    this.broadcastUpdate();
  }

  private arm(
    deviceId: string,
    gang: number,
    expiresAt: Date,
    onExpire: () => void,
    durationSeconds?: number,
  ): void {
    const key = this.getKey(deviceId, gang);
    const existing = this.timers.get(key);
    if (existing) clearTimeout(existing.handle);
    const delay = Math.max(0, expiresAt.getTime() - Date.now());
    const handle = setTimeout(() => {
      this.timers.delete(key);
      try {
        onExpire();
        this.emitTimerEvent("timer.expired", {
          deviceId,
          gang,
          minutes: 0,
          expiresAt,
        });
        this.persistAndBroadcast();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Timer expired handler error: ${msg}`);
      }
    }, delay);
    this.timers.set(key, { deviceId, gang, handle, expiresAt, durationSeconds });
  }

  cancel(deviceId: string, gang: number): void {
    const key = this.getKey(deviceId, gang);
    const existing = this.timers.get(key);
    if (existing) {
      clearTimeout(existing.handle);
      this.timers.delete(key);
      this.emitTimerEvent("timer.cancelled", {
        deviceId,
        gang,
        minutes: 0,
        expiresAt: existing.expiresAt,
      });
      this.persistAndBroadcast();
    }
  }

  cancelForDevice(deviceId: string): void {
    for (const timer of [...this.timers.values()]) {
      if (timer.deviceId === deviceId) {
        this.cancel(timer.deviceId, timer.gang);
      }
    }
  }

  getRemaining(deviceId: string, gang: number): number | null {
    const key = this.getKey(deviceId, gang);
    const existing = this.timers.get(key);
    if (!existing) return null;
    const remaining = Math.max(
      0,
      Math.ceil((existing.expiresAt.getTime() - Date.now()) / 1000),
    );
    if (remaining === 0) return null;
    return remaining;
  }

  /**
   * Full duration (seconds) of the RUNNING timer for a gang, or null when idle.
   * Used to derive which press stage a gang is currently in, so the stage
   * survives a backend restart (persisted timers keep `durationSeconds`).
   */
  getDurationSeconds(deviceId: string, gang: number): number | null {
    const existing = this.timers.get(this.getKey(deviceId, gang));
    return existing?.durationSeconds ?? null;
  }

  getAll(): TimerEntry[] {
    const result: TimerEntry[] = [];
    for (const { deviceId, gang, expiresAt, durationSeconds } of this.timers.values()) {
      const remaining = this.getRemaining(deviceId, gang);
      if (remaining === null) continue;
      result.push({
        deviceId,
        gang,
        expiresAt,
        remainingSeconds: remaining,
        ...(durationSeconds !== undefined ? { durationSeconds } : {}),
      });
    }
    return result;
  }

  onModuleDestroy(): void {
    for (const { handle } of this.timers.values()) {
      clearTimeout(handle);
    }
    this.timers.clear();
  }

  private emitTimerEvent(type: string, event: TimerEvent): void {
    this.eventEmitter.emit(type, event);
  }

  private persistAndBroadcast(): void {
    this.persist();
    this.broadcastUpdate();
  }

  private persist(): void {
    const entries: PersistedTimerEntry[] = [...this.timers.values()].map(
      ({ deviceId, gang, expiresAt, durationSeconds }) => ({
        deviceId,
        gang,
        expiresAt: expiresAt.toISOString(),
        ...(durationSeconds !== undefined ? { durationSeconds } : {}),
      }),
    );
    this.persistence.save(entries);
  }

  private broadcastUpdate(): void {
    this.eventEmitter.emit("timer.update", this.getAll());
  }
}
