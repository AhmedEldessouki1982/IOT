import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";

export interface TimerEntry {
  deviceId: string;
  gang: number;
  expiresAt: Date;
  remainingSeconds: number;
}

export interface TimerEvent {
  deviceId: string;
  gang: number;
  minutes: number;
  expiresAt: Date;
}

@Injectable()
export class TimersService implements OnModuleDestroy {
  private readonly logger = new Logger(TimersService.name);
  private readonly timers = new Map<
    string,
    { handle: NodeJS.Timeout; expiresAt: Date }
  >();
  private readonly eventEmitter: EventEmitter2;

  constructor(eventEmitter: EventEmitter2) {
    this.eventEmitter = eventEmitter;
  }

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
    const key = this.getKey(deviceId, gang);
    const expiresAt = new Date(Date.now() + minutes * 60000);
    const existing = this.timers.get(key);
    if (existing) {
      clearTimeout(existing.handle);
      this.timers.delete(key);
    }
    const handle = setTimeout(() => {
      this.timers.delete(key);
      try {
        onExpire();
        this.eventEmitter.emit("timer.expired", {
          deviceId,
          gang,
          minutes,
          expiresAt,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Timer expired handler error: ${msg}`);
      }
    }, minutes * 60000);
    this.timers.set(key, { handle, expiresAt });
    this.eventEmitter.emit("timer.started", {
      deviceId,
      gang,
      minutes,
      expiresAt,
    });
  }

  cancel(deviceId: string, gang: number): void {
    const key = this.getKey(deviceId, gang);
    const existing = this.timers.get(key);
    if (existing) {
      clearTimeout(existing.handle);
      this.timers.delete(key);
      this.eventEmitter.emit("timer.cancelled", {
        deviceId,
        gang,
        minutes: 0,
        expiresAt: existing.expiresAt,
      });
    }
  }

  cancelForDevice(deviceId: string): void {
    for (const [key] of this.timers) {
      const [id] = key.split(":");
      if (id === deviceId) {
        const [d, g] = key.split(":");
        this.cancel(d, parseInt(g));
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

  getAll(): TimerEntry[] {
    const result: TimerEntry[] = [];
    for (const [key, { expiresAt }] of this.timers) {
      const [deviceId, gangStr] = key.split(":");
      const remaining = this.getRemaining(deviceId, parseInt(gangStr));
      if (remaining === null) continue;
      result.push({
        deviceId,
        gang: parseInt(gangStr),
        expiresAt,
        remainingSeconds: remaining,
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
}
