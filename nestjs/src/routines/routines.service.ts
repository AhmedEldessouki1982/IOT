import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { RoomType } from "../common/press.types";
import { DeviceService } from "../device/device.service";
import {
  SonoffGang,
  SonoffRegistryService,
} from "../sonoff/sonoff-registry.service";
import { TimersService } from "../timers/timers.service";
import { DeviceAutomationService } from "../automation/device-automation.service";
import {
  getRoutineForRoomType,
  routineGangsFor,
  routineHint,
} from "./routine.config";

export interface GangTimerView {
  remainingSeconds: number;
  expiresAt: string;
  durationSeconds?: number;
}

export interface GangView {
  gang: number;
  deviceId: string;
  role: string;
  label: string;
  /** Ordered press stages in minutes; empty = plain on/off toggle. */
  stages: number[];
  /** Card hint, e.g. "10m → 30m → off". Owned by the backend. */
  hint: string;
  /** 1-based stage currently armed by a running timer, or null when idle. */
  stage: number | null;
  /** Live relay state, echoed from the physical switch over MQTT. */
  on: boolean;
  /** Running auto-off countdown, or null when idle. */
  timer: GangTimerView | null;
}

export interface RoomView {
  roomId: string;
  roomType: RoomType;
  routineId: string;
  routineLabel: string;
  switchId: string;
  base: string;
  gangs: GangView[];
}

@Injectable()
export class RoutinesService {
  private readonly logger = new Logger(RoutinesService.name);

  constructor(
    private readonly registry: SonoffRegistryService,
    private readonly deviceService: DeviceService,
    private readonly timers: TimersService,
    private readonly automation: DeviceAutomationService,
  ) {}

  /** Every configured room that has a reusable routine attached. */
  listRooms(): RoomView[] {
    const byRoom = new Map<string, SonoffGang[]>();
    for (const gang of this.registry.getGangs()) {
      if (!getRoutineForRoomType(gang.roomType)) continue;
      const key = gang.roomId || gang.switchId;
      const bucket = byRoom.get(key);
      if (bucket) bucket.push(gang);
      else byRoom.set(key, [gang]);
    }

    return [...byRoom.entries()].map(([roomId, gangs]) =>
      this.buildRoom(roomId, gangs),
    );
  }

  getRoom(roomId: string): RoomView {
    const gangs = this.registry
      .getGangs()
      .filter((gang) => (gang.roomId || gang.switchId) === roomId);
    if (gangs.length === 0 || !getRoutineForRoomType(gangs[0].roomType)) {
      throw new NotFoundException(`Room "${roomId}" not found`);
    }
    return this.buildRoom(roomId, gangs);
  }

  /**
   * Advance one press stage for a gang (the next click). Whether the click
   * starts a stage or switches the gang off is decided by the automation layer
   * from the gang's stage list and the running timer.
   */
  press(roomId: string, gang: number): RoomView {
    const room = this.getRoom(roomId);
    const target = room.gangs.find((entry) => entry.gang === gang);
    if (!target) {
      throw new NotFoundException(`Room "${roomId}" has no gang ${gang}`);
    }
    this.automation.handleButtonPress(target.deviceId, gang);
    this.logger.log(
      `Routine click room=${roomId} gang=${gang} -> ${target.deviceId}`,
    );
    return this.getRoom(roomId);
  }

  /** Cancel a gang's auto-off countdown (leaves the relay where it is). */
  cancelTimer(roomId: string, gang: number): RoomView {
    const room = this.getRoom(roomId);
    const target = room.gangs.find((entry) => entry.gang === gang);
    if (!target) {
      throw new NotFoundException(`Room "${roomId}" has no gang ${gang}`);
    }
    this.timers.cancel(target.deviceId, gang);
    return this.getRoom(roomId);
  }

  private buildRoom(roomId: string, gangs: SonoffGang[]): RoomView {
    const first = gangs[0];
    const routine = getRoutineForRoomType(first.roomType);
    const rules = routineGangsFor(first.roomType, 3);
    const timerByKey = new Map(
      this.timers
        .getAll()
        .map((entry) => [`${entry.deviceId}:${entry.gang}`, entry]),
    );

    const gangViews: GangView[] = gangs
      .slice()
      .sort((a, b) => a.gang - b.gang)
      .map((gang) => {
        const rule = rules.find((candidate) => candidate.gang === gang.gang);
        const timer = timerByKey.get(`${gang.deviceId}:${gang.gang}`);
        const stages = rule?.stages ?? [];
        const state = this.deviceService.getState(gang.deviceId);
        return {
          gang: gang.gang,
          deviceId: gang.deviceId,
          role: rule?.role ?? `gang${gang.gang}`,
          label: rule?.label ?? `Gang ${gang.gang}`,
          stages,
          hint: rule ? routineHint(rule) : `Gang ${gang.gang}`,
          stage: this.currentStage(stages, timer),
          on: state?.state.on === true,
          timer: timer
            ? {
                remainingSeconds: timer.remainingSeconds,
                expiresAt: timer.expiresAt.toISOString(),
                ...(timer.durationSeconds !== undefined
                  ? { durationSeconds: timer.durationSeconds }
                  : {}),
              }
            : null,
        };
      });

    return {
      roomId,
      roomType: first.roomType as RoomType,
      routineId: routine?.id ?? first.roomType,
      routineLabel: routine?.label ?? first.roomType,
      switchId: first.switchId,
      base: first.base,
      gangs: gangViews,
    };
  }

  /** 1-based stage for a running timer, or null when no stage is armed. */
  private currentStage(
    stages: number[],
    timer: { durationSeconds?: number } | undefined,
  ): number | null {
    const durationSeconds = timer?.durationSeconds;
    if (durationSeconds === undefined) return null;
    const index = stages.findIndex(
      (minutes) => minutes * 60 === durationSeconds,
    );
    return index === -1 ? null : index + 1;
  }
}
