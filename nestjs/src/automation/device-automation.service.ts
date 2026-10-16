import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { TimersService } from "../timers/timers.service";
import { DeviceService, DeviceState } from "../device/device.service";
import { DeviceGateway } from "../device/device.gateway";
import { GangTimerRule, TIMER_RULES } from "../timers/timer.config";
import { SonoffRegistryService } from "../sonoff/sonoff-registry.service";
import { MqttConnectionService } from "../mqtt/mqtt-connection.service";

@Injectable()
export class DeviceAutomationService implements OnModuleInit {
  private readonly logger = new Logger(DeviceAutomationService.name);

  constructor(
    private readonly timers: TimersService,
    private readonly deviceService: DeviceService,
    private readonly gateway: DeviceGateway,
    private readonly sonoffRegistry: SonoffRegistryService,
    private readonly mqtt: MqttConnectionService,
  ) {}

  onModuleInit(): void {
    this.mqtt.onConnect(() => {
      this.timers.restore((deviceId, gang) => this.turnOff(deviceId, gang));
    });
  }

  /** Timer rule for a gang, or null when the gang belongs to no routine. */
  private ruleFor(deviceId: string, gang: number): GangTimerRule | null {
    const roomType = this.sonoffRegistry.getRoomTypeForDevice(deviceId);
    return roomType ? (TIMER_RULES[roomType][gang] ?? null) : null;
  }

  /**
   * Advance one press stage for a gang (one click, from the dashboard or a
   * detached wall button). A single tap and a hold are the same click.
   *
   * Stage i -> arm minutes `stages[i]`; the click after the last stage turns
   * the gang off. The current stage is derived from the running timer's
   * duration, so it survives a restart.
   */
  handleButtonPress(deviceId: string, gang: number): void {
    const rule = this.ruleFor(deviceId, gang);
    if (!rule) return;

    // No stages (or explicitly no timer): a plain on/off toggle.
    if (rule.noTimer || rule.stages.length === 0) {
      this.timers.cancel(deviceId, gang);
      if (this.deviceService.getState(deviceId)?.state.on === true) {
        this.turnOff(deviceId, gang);
      } else {
        this.turnOn(deviceId, gang);
      }
      return;
    }

    const minutes = this.nextStageMinutes(rule.stages, deviceId, gang);
    if (minutes === null) {
      this.timers.cancel(deviceId, gang);
      this.turnOff(deviceId, gang);
      return;
    }
    this.turnOn(deviceId, gang);
    this.timers.start(deviceId, gang, minutes, () => {
      this.turnOff(deviceId, gang);
    });
  }

  /**
   * Minutes for the next click: the stage after the currently running one, or
   * null when the cycle is finished (the click should turn the gang off).
   */
  private nextStageMinutes(
    stages: number[],
    deviceId: string,
    gang: number,
  ): number | null {
    const activeSeconds = this.timers.getDurationSeconds(deviceId, gang);
    const on = this.deviceService.getState(deviceId)?.state.on === true;

    if (activeSeconds === null) {
      // No countdown running. Start the cycle — unless the relay is on with no
      // timer (e.g. set by a scene), in which case this click turns it off.
      return on ? null : stages[0];
    }

    const index = stages.findIndex(
      (minutes) => minutes * 60 === activeSeconds,
    );
    // Unknown/unremembered stage: fall back to restarting the cycle.
    if (index === -1) return stages[0];
    const next = index + 1;
    return next < stages.length ? stages[next] : null;
  }

  /**
   * Supervise a physical ON on a `local` wall switch: the relay has already
   * toggled on the device (that is what keeps it working offline), so the
   * backend only arms the gang's first stage as an auto-off. The OFF side is
   * covered by `onDeviceStateChanged`, which cancels the running timer.
   */
  handleLocalRelayOn(deviceId: string, gang: number): void {
    const rule = this.ruleFor(deviceId, gang);
    if (!rule || rule.noTimer || rule.stages.length === 0) return;
    // A stage already running belongs to the click cycle, not to us.
    if (this.timers.getDurationSeconds(deviceId, gang) !== null) return;

    this.timers.start(deviceId, gang, rule.stages[0], () => {
      this.turnOff(deviceId, gang);
    });
    this.logger.log(
      `Local wall ON ${deviceId} -> supervisor auto-off ${rule.stages[0]}m`,
    );
  }

  onManualOff(deviceId: string, gang: number): void {
    this.timers.cancel(deviceId, gang);
  }

  @OnEvent("device.state.changed")
  onDeviceStateChanged(state: DeviceState): void {
    const gang = this.sonoffRegistry.getGang(state.deviceId);
    if (!gang || state.state.on !== false) return;
    this.onManualOff(gang.deviceId, gang.gang);
  }

  /**
   * Command a relay AND record the intended state immediately. The device's
   * MQTT echo arrives ~150ms later; without this the cycle logic (and the
   * response of the press endpoint) reads a stale `on` for that window, which
   * made back-to-back presses take the wrong branch. The echo deep-equals the
   * optimistic entry, so it still dedupes to no history row and no broadcast.
   */
  private setRelay(deviceId: string, gang: number, on: boolean): void {
    this.deviceService.sendCommand(deviceId, { on });
    // Broadcast the intended state now: the echo deep-equals this entry, so
    // SonoffService.recordState dedupes it to a no-op and would skip the
    // WebSocket push the dashboard relies on.
    if (this.deviceService.setState(deviceId, { state: { on } })) {
      const state = this.deviceService.getState(deviceId);
      if (state) this.gateway.broadcast(state);
    }
  }

  private turnOn(deviceId: string, gang: number): void {
    this.setRelay(deviceId, gang, true);
  }

  private turnOff(deviceId: string, gang: number): void {
    this.setRelay(deviceId, gang, false);
  }
}
