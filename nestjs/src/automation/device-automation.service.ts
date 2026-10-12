import { Injectable, OnModuleInit } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { TimersService } from "../timers/timers.service";
import { DeviceService, DeviceState } from "../device/device.service";
import { DeviceGateway } from "../device/device.gateway";
import { TIMER_RULES } from "../timers/timer.config";
import { PressType, RoomType } from "../common/press.types";
import { SonoffRegistryService } from "../sonoff/sonoff-registry.service";
import { MqttConnectionService } from "../mqtt/mqtt-connection.service";

export function shouldRestartTimerOnPress(): boolean {
  return true;
}

@Injectable()
export class DeviceAutomationService implements OnModuleInit {
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

  getRoomTypeFor(deviceId: string): RoomType | null {
    return this.sonoffRegistry.getRoomTypeForDevice(deviceId);
  }

  handleButtonPress(
    deviceId: string,
    gang: number,
    pressType: PressType,
  ): void {
    const roomType = this.getRoomTypeFor(deviceId);
    if (!roomType) return;
    const rules = TIMER_RULES[roomType];
    const rule = rules[gang];
    if (!rule) return;
    if (rule.noTimer) {
      this.timers.cancel(deviceId, gang);
      this.turnOn(deviceId, gang);
      return;
    }
    const duration = rule.durations[pressType] ?? rule.durations.single;
    if (duration === undefined || duration <= 0) {
      this.timers.cancel(deviceId, gang);
      this.turnOn(deviceId, gang);
      return;
    }
    this.turnOn(deviceId, gang);
    if (shouldRestartTimerOnPress()) {
      this.timers.start(deviceId, gang, duration, () => {
        this.turnOff(deviceId, gang);
      });
    }
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

  private turnOn(deviceId: string, gang: number): void {
    this.deviceService.sendCommand(deviceId, { on: true });
  }

  private turnOff(deviceId: string, gang: number): void {
    this.deviceService.sendCommand(deviceId, { on: false });
  }
}
