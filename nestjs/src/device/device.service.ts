import { Injectable, Logger, OnModuleInit, Optional } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { MqttConnectionService } from "../mqtt/mqtt-connection.service";
import { DevicePersistenceService } from "./device-persistence.service";

export type DeviceType = "switch" | "sensor" | "lock";

/** Order-insensitive deep compare of flat JSON state payloads. */
function deepEqual(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
): boolean {
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

  /** Longest a commanded relay state may take to echo before we stop pairing it. */
  private static readonly ECHO_WINDOW_MS = 5000;
  /** Last relay state we commanded per device, paired against its echo. */
  private readonly expectedRelay = new Map<string, { on: boolean; at: number }>();

  constructor(
    private readonly mqtt: MqttConnectionService,
    private readonly persistence: DevicePersistenceService,
    @Optional() private readonly eventEmitter?: EventEmitter2,
  ) {}

  /**
   * Await the persistence snapshot before reading it — otherwise the first
   * GET /devices after a restart reports nothing while the relays are on.
   */
  async onModuleInit(): Promise<void> {
    await this.persistence.whenReady();
    for (const state of this.persistence.getSnapshot()) {
      this.states.set(state.deviceId, state);
    }
    if (this.states.size > 0) {
      this.logger.log(`Restored ${this.states.size} device state(s) from disk`);
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
    if (changed) {
      this.persistence.record(next);
      this.eventEmitter?.emit("device.state.changed", next);
    }
    return changed;
  }

  sendCommand(deviceId: string, command: Record<string, unknown>): void {
    if (typeof command.on === "boolean") {
      this.noteRelayCommand(deviceId, command.on);
    }
    const topic = `devices/${deviceId}/cmd`;
    const payload = JSON.stringify(command);
    this.logger.log(`Publishing command to ${topic}: ${payload}`);
    this.mqtt.publish(topic, payload);
  }

  /**
   * Note the relay state being commanded, paired with the device's echo. Must
   * be called at *issue* time, not when the command is forwarded: commands
   * issued within one device round-trip would otherwise pair the wrong echo.
   */
  noteRelayCommand(deviceId: string, on: boolean): void {
    this.expectedRelay.set(deviceId, { on, at: Date.now() });
  }

  /**
   * Classify a device-reported relay state against the last command we sent.
   * "stale" means a newer command has already superseded this echo — applying
   * it would flip the relay back and cancel a timer the newer command armed.
   * The pairing is kept until the window expires, not consumed by the first
   * echo: one command can make the device emit several state messages.
   */
  resolveRelayEcho(
    deviceId: string,
    on: boolean,
  ): "match" | "stale" | "unsolicited" {
    const expected = this.expectedRelay.get(deviceId);
    if (!expected) return "unsolicited";
    if (Date.now() - expected.at > DeviceService.ECHO_WINDOW_MS) {
      this.expectedRelay.delete(deviceId);
      return "unsolicited";
    }
    return expected.on === on ? "match" : "stale";
  }
}
