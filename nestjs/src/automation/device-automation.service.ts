import { Injectable } from '@nestjs/common';
import { TimersService } from '../timers/timers.service';
import { DeviceService } from '../device/device.service';
import { DeviceGateway } from '../device/device.gateway';
import { TIMER_RULES, RoomType, PressType } from '../timers/timer.config';

@Injectable()
export class DeviceAutomationService {
  constructor(
    private readonly timers: TimersService,
    private readonly deviceService: DeviceService,
    private readonly gateway: DeviceGateway,
  ) {}

  getRoomTypeFor(deviceId: string): RoomType | null {
    if (deviceId.startsWith('sonoff')) return 'toilet';
    if (deviceId.startsWith('bedroom')) return 'bedroom';
    return null;
  }

  handleButtonPress(deviceId: string, gang: number, pressType: PressType): void {
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
    this.timers.start(deviceId, gang, duration, () => {
      this.turnOff(deviceId, gang);
    });
  }

  onManualOff(deviceId: string, gang: number): void {
    this.timers.cancel(deviceId, gang);
  }

  private turnOn(deviceId: string, gang: number): void {
    const base = deviceId;
    this.deviceService.setState(deviceId + ':' + gang, {
      type: 'switch',
      state: { on: true },
    });
  }

  private turnOff(deviceId: string, gang: number): void {
    const base = deviceId;
    this.deviceService.setState(deviceId + ':' + gang, {
      type: 'switch',
      state: { on: false },
    });
  }
}
