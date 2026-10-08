import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { MqttConnectionService } from "../mqtt/mqtt-connection.service";
import { DevicePersistenceService } from "./device-persistence.service";

export type DeviceType = "switch" | "sensor" | "lock";

/** Order-insensitive deep compare of flat JSON state payloads. */
function deepEqual(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every(
    (k) =>
      Object.prototype.hasOwnProperty.call(b, k) &&
      JSON.stringify(a[k]) === JSON.stringify(b[k]),
  );
}

export interface DeviceState {
  deviceId: string;
  type: DeviceType;
  state: Record<string, unknown>; // e.g. {on: true} or {tempC: 24.5} or {locked: true}
  timestamp: string;
}

@Injectable()
export class DeviceService implements OnModuleInit {
  private readonly logger = new Logger(DeviceService.name);
  private readonly states = new Map<string, DeviceState>();

  constructor(
    private readonly mqtt: MqttConnectionService,
    private readonly persistence: DevicePersistenceService,
  ) {}

  onModuleInit(): void {
    for (const state of this.persistence.getSnapshot()) {
      this.states.set(state.deviceId, state);
    }
  }

  getState(deviceId: string): DeviceState | undefined {
    return this.states.get(deviceId);
  }

  getAllStates(): DeviceState[] {
    return [...this.states.values()];
  }

  /**
   * Merges a partial state into the registry. Returns true only when the
   * meaningful state changed — duplicate MQTT messages (retained replays,
   * reconnect heartbeats, command echoes) must NOT append history entries
   * or re-broadcast, or the activity feed fills with identical rows.
   */
  setState(deviceId: string, partial: Partial<DeviceState>): boolean {
    const existing = this.states.get(deviceId);
    const next = {
      deviceId,
      type: partial.type ?? existing?.type ?? "switch",
      state: { ...(existing?.state ?? {}), ...(partial.state ?? {}) },
      timestamp: partial.timestamp ?? new Date().toISOString(),
    };
    const changed =
      !existing ||
      existing.type !== next.type ||
      !deepEqual(existing.state, next.state);
    this.states.set(deviceId, next);
    if (changed) this.persistence.record(next);
    return changed;
  }

  sendCommand(deviceId: string, command: Record<string, unknown>): void {
    const topic = `devices/${deviceId}/cmd`;
    const payload = JSON.stringify(command);
    this.logger.log(`Publishing command to ${topic}: ${payload}`);
    this.mqtt.publish(topic, payload);
  }
}
