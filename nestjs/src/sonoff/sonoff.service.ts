import {
  Injectable,
  Logger,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MqttConnectionService } from "../mqtt/mqtt-connection.service";
import { DeviceService } from "../device/device.service";
import { DeviceGateway } from "../device/device.gateway";

/**
 * Bridges the physical Sonoff T3US3C 3-gang wall switch (flashed Tasmota)
 * into the app's generic MQTT device contract — no cloud, direct MQTT.
 *
 * The switch speaks Tasmota MQTT topics (topic base `tasmota_A3AECD`):
 *   - publishes state on   `stat/<base>/POWER{1,2,3}`  (payload ON/OFF)
 *   - accepts commands on  `cmnd/<base>/POWER{1,2,3}`  (payload ON/OFF)
 *
 * Each of the three POWER relays is surfaced as a normal device with id
 * `sonoff{1|2|3}`, so they round-trip through the existing DeviceService
 * registry and DeviceGateway socket broadcast exactly like the live `light1`
 * — meaning physical button presses reach the frontend in real time.
 *
 * CONFIG (see .env.example welcome):
 *   - MQTT_URL   -> already the broker host/port the whole app uses
 *   - SONOFF_BASE -> Tasmota topic base, e.g. `tasmota_A3AECD`
 *   - SONOFF_IP  -> device IP, informational only (traffic goes via broker)
 *
 * If SONOFF_BASE is unset we log a warning and skip connecting so the rest of
 * the team runs normally without the hardware attached (same convention the
 * local-device bridges used before).
 */
@Injectable()
export class SonoffService implements OnModuleInit {
  private readonly logger = new Logger(SonoffService.name);

  private readonly base: string;
  private readonly channelCount = 3;
  private readonly enabled: boolean;

  constructor(
    config: ConfigService,
    private readonly mqtt: MqttConnectionService,
    private readonly deviceService: DeviceService,
    private readonly gateway: DeviceGateway,
  ) {
    this.base = (config.get<string>("SONOFF_BASE") ?? "").trim();

    if (!this.base) {
      this.enabled = false;
      this.logger.warn(
        "SONOFF_BASE not set — Sonoff Tasmota bridge disabled. " +
          "The app will run without the physical 3-gang switch.",
      );
      return;
    }

    this.enabled = true;
    this.subscribe();
  }

  onModuleInit(): void {
    if (this.enabled) {
      const ip = process.env["SONOFF_IP"] ?? "unknown";
      this.logger.log(
        `Sonoff bridge enabled: base=${this.base} ip=${ip} channels=${this.channelCount}`,
      );
    }
  }

  /**
   * All MQTT traffic flows through the shared MqttConnectionService so the
   * broker gets exactly one connection from this app. Subscriptions are
   * registered in the constructor (not onModuleInit) — the localhost broker
   * can emit `connect` before lifecycle hooks run, and MqttConnectionService
   * buffers them until the shared client is actually connected.
   */
  private subscribe(): void {
    // Every state topic under the switch's base, e.g. `stat/tasmota_A3AECD/#`.
    // (A bare `POWER#` suffix is invalid MQTT — `#` must be its own level — so
    // we subscribe to the whole base and let handleState narrow to the
    // `POWER{1,2,3}` topics via its regex.)
    this.mqtt.subscribe(`stat/${this.base}/#`, (t, buf) =>
      this.handleState(t, buf),
    );
    // The generic app command topics the frontend already talks to
    // (`devices/sonoff1/cmd`, ... via POST /devices/sonoffN/command).
    for (let ch = 1; ch <= this.channelCount; ch++) {
      const topic = `devices/sonoff${ch}/cmd`;
      this.mqtt.subscribe(topic, (t, buf) => this.handleCommand(t, buf));
    }
  }

  /** Translates a generic `{on}` JSON command into a Tasmota cmnd publish. */
  private handleCommand(topic: string, buffer: Buffer): void {
    const match = /^devices\/sonoff(\d+)\/cmd$/.exec(topic);
    if (!match) return;
    const channel = Number(match[1]);
    let payload: unknown;
    try {
      payload = JSON.parse(buffer.toString());
    } catch {
      this.logger.warn(`Sonoff: ignoring non-JSON command on ${topic}`);
      return;
    }
    if (
      typeof payload !== "object" ||
      payload === null ||
      Array.isArray(payload) ||
      typeof (payload as { on?: unknown }).on !== "boolean"
    ) {
      this.logger.warn(`Sonoff: ignoring malformed command on ${topic}`);
      return;
    }
    this.setOutput(channel, (payload as { on: boolean }).on);
  }

  /** Parses a `stat/<base>/POWER<n>` message and mirrors it into the app. */
  private handleState(topic: string, buffer: Buffer): void {
    // Topic should match `stat/<base>/POWER<1|2|3>`.
    const match = /^stat\/(.+)\/POWER(\d+)$/.exec(topic);
    if (!match || match[1] !== this.base) return;

    const channel = Number(match[2]);
    if (
      !Number.isInteger(channel) ||
      channel < 1 ||
      channel > this.channelCount
    ) {
      return;
    }

    const text = buffer.toString().trim().toUpperCase();
    if (text !== "ON" && text !== "OFF") return;

    const on = text === "ON";
    const deviceId = this.deviceIdFor(channel);

    // Record in the generic registry and push to every connected client.
    this.deviceService.setState(deviceId, {
      type: "switch",
      state: { on },
    });
    this.gateway.broadcast({
      deviceId,
      type: "switch",
      state: { on },
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`Sonoff ${deviceId} state -> ${on ? "ON" : "OFF"}`);
  }

  /**
   * Publishes an ON/OFF command to a specific relay, e.g.
   * `cmnd/tasmota_A3AECD/POWER1`. The device echoes state back on `stat/...`
   * which we pick up in handleState, so the UI converges to the truth.
   */
  setOutput(channel: number, on: boolean): void {
    if (!this.enabled) return;
    if (channel < 1 || channel > this.channelCount) {
      this.logger.warn(`setOutput: invalid channel ${channel}`);
      return;
    }
    const topic = `cmnd/${this.base}/POWER${channel}`;
    const payload = on ? "ON" : "OFF";
    this.mqtt.publish(topic, payload);
    this.logger.log(`Sonoff publish ${topic} -> ${payload}`);
  }

  /** Maps a POWER channel to its public device id (`sonoff1`...`sonoff3`). */
  deviceIdFor(channel: number): string {
    return `sonoff${channel}`;
  }

  enabledState(): boolean {
    return this.enabled;
  }
}
