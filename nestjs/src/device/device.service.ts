import { Injectable, Logger } from "@nestjs/common";
import { MqttConnectionService } from "../mqtt/mqtt-connection.service";

export type DeviceType = "switch" | "sensor" | "lock";

export interface DeviceState {
  deviceId: string;
  type: DeviceType;
  state: Record<string, unknown>; // e.g. {on: true} or {tempC: 24.5} or {locked: true}
  timestamp: string;
}

@Injectable()
export class DeviceService {
  private readonly logger = new Logger(DeviceService.name);
  private readonly states = new Map<string, DeviceState>();

  constructor(private readonly mqtt: MqttConnectionService) {}

  getState(deviceId: string): DeviceState | undefined {
    return this.states.get(deviceId);
  }

  getAllStates(): DeviceState[] {
    return [...this.states.values()];
  }

  setState(deviceId: string, partial: Partial<DeviceState>): void {
    const existing = this.states.get(deviceId);
    this.states.set(deviceId, {
      deviceId,
      type: partial.type ?? existing?.type ?? "switch",
      state: { ...(existing?.state ?? {}), ...(partial.state ?? {}) },
      timestamp: partial.timestamp ?? new Date().toISOString(),
    });
  }

  sendCommand(deviceId: string, command: Record<string, unknown>): void {
    const topic = `devices/${deviceId}/cmd`;
    const payload = JSON.stringify(command);
    this.logger.log(`Publishing command to ${topic}: ${payload}`);
    this.mqtt.publish(topic, payload);
  }
}
