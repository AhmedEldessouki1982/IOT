import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as mqtt from "mqtt";

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
  private readonly client: mqtt.MqttClient;

  constructor(config: ConfigService) {
    const mqttUrl = config.get<string>("MQTT_URL") ?? "mqtt://localhost:1883";
    this.client = mqtt.connect(mqttUrl);
    this.client.on("connect", () =>
      this.logger.log(`MQTT publisher connected to ${mqttUrl}`),
    );
  }

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
    this.client.publish(topic, payload);
  }
}
