import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as mqtt from "mqtt";
import TuyAPI from "tuyapi";

/** DPS index for the on/off switch state on a stock Tuya switch. */
const ON_OFF_DPS = 1;

/**
 * Bridges a local Tuya-protocol device (e.g. a Sonoff T3US3C wall switch
 * running stock firmware) directly into the app's generic MQTT device
 * contract — no Home Assistant involved.
 *
 * From the rest of the app's perspective this Tuya switch is
 * indistinguishable from any other MQTT-native device:
 *   - it PUBLISHES state to  `devices/<mappedId>/state`
 *   - it SUBSCRIBES to      `devices/<mappedId>/cmd`
 * which are exactly the topics the generic DeviceMqttListener / DeviceService
 * already watch, so zero changes are needed in the generic device layer.
 *
 * If TUYA_DEVICE_ID or TUYA_LOCAL_KEY are unset, the bridge logs a warning
 * and skips connecting entirely so the rest of the team can run normally.
 */
@Injectable()
export class TuyaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TuyaService.name);

  private readonly enabled: boolean;
  private readonly mappedId: string;
  private readonly mqtt: mqtt.MqttClient | null = null;
  private readonly device: TuyAPI | null = null;

  private connected = false;
  private retryTimer: NodeJS.Timeout | null = null;
  private readonly retryBaseMs = 2000;

  constructor(config: ConfigService) {
    this.mappedId =
      config.get<string>("TUYA_DEVICE_ID_MAPPING") ?? "switch1";

    const tuyaId = config.get<string>("TUYA_DEVICE_ID") ?? "";
    const localKey = config.get<string>("TUYA_LOCAL_KEY") ?? "";
    const ip = config.get<string>("TUYA_DEVICE_IP") ?? "";
    const version = config.get<string>("TUYA_PROTOCOL_VERSION") ?? "3.3";

    if (!tuyaId || !localKey) {
      this.enabled = false;
      this.logger.warn(
        "TUYA_DEVICE_ID / TUYA_LOCAL_KEY not set — Tuya bridge disabled. " +
          "The app will run without the local Tuya device.",
      );
      return;
    }

    this.enabled = true;

    this.device = new TuyAPI({
      id: tuyaId,
      key: localKey,
      ip: ip || undefined,
      version,
    });

    // Follow the established MQTT pattern: each service owns its own raw
    // client (see DeviceService). Only created when the bridge is enabled so
    // no redundant connection is held when Tuya is disabled.
    const mqttUrl = config.get<string>("MQTT_URL") ?? "mqtt://localhost:1883";
    this.mqtt = mqtt.connect(mqttUrl);
    this.mqtt.on("connect", () => {
      this.logger.log(`Tuya bridge MQTT connected to ${mqttUrl}`);
      this.subscribeToCommands();
    });
    this.mqtt.on("error", (err) =>
      this.logger.error(`Tuya bridge MQTT error: ${err.message}`),
    );

    this.device.on("connected", () => {
      this.connected = true;
      this.clearRetry();
      this.logger.log(
        `Tuya device ${this.mappedId} connected (id=${tuyaId})`,
      );
    });
    this.device.on("disconnected", () => {
      this.connected = false;
      this.logger.warn(`Tuya device ${this.mappedId} disconnected`);
      this.scheduleReconnect();
    });
    this.device.on("error", (err) =>
      this.logger.error(`Tuya device ${this.mappedId} error: ${err.message}`),
    );
    this.device.on("data", (data) => this.handleDeviceData(data));
  }

  async onModuleInit(): Promise<void> {
    if (!this.enabled) return;
    await this.connectWithRetry();
  }

  onModuleDestroy(): void {
    this.clearRetry();
    this.connected = false;
    if (this.device) {
      try {
        this.device.disconnect();
      } catch {
        // already disconnected
      }
    }
    if (this.mqtt) this.mqtt.end();
  }

  /**
   * Turns the Tuya switch on/off by writing the on/off DPS property.
   */
  async setState(on: boolean): Promise<void> {
    if (!this.enabled || !this.device) {
      this.logger.warn(
        `Ignoring setState(${on}) — Tuya bridge is disabled`,
      );
      return;
    }
    if (!this.connected) {
      this.logger.warn(
        `Ignoring setState(${on}) — Tuya device ${this.mappedId} is not connected`,
      );
      return;
    }
    await this.device.set({ dps: ON_OFF_DPS, set: on });
    this.logger.log(
      `Tuya ${this.mappedId}: set DPS${ON_OFF_DPS} -> ${on}`,
    );
  }

  private async connectWithRetry(attempt = 0): Promise<void> {
    if (!this.enabled || !this.device) return;
    try {
      this.logger.log(
        `Tuya: locating device ${this.mappedId} (attempt ${attempt + 1})`,
      );
      await this.device.find();
      await this.device.connect();
    } catch (err) {
      this.logger.error(
        `Tuya: connect attempt ${attempt + 1} failed: ` +
          `${(err as Error).message}`,
      );
      this.scheduleReconnect(attempt + 1);
    }
  }

  private scheduleReconnect(attempt = 0): void {
    if (!this.enabled || this.retryTimer) return;
    const delay = this.retryBaseMs * Math.pow(2, Math.min(attempt, 5));
    this.logger.warn(
      `Tuya device ${this.mappedId} reconnecting in ${delay}ms`,
    );
    this.retryTimer = setTimeout(async () => {
      this.retryTimer = null;
      await this.connectWithRetry(attempt);
    }, delay);
  }

  private clearRetry(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  private subscribeToCommands(): void {
    if (!this.mqtt) return;
    const topic = `devices/${this.mappedId}/cmd`;
    this.mqtt.subscribe(topic, (err) => {
      if (err) {
        this.logger.error(
          `Failed to subscribe to ${topic}: ${err.message}`,
        );
        return;
      }
      this.logger.log(`Tuya bridge subscribed to ${topic}`);
    });
    this.mqtt.on("message", (t, buffer) => {
      if (t !== topic) return;
      this.handleCommand(buffer);
    });
  }

  private handleCommand(buffer: Buffer): void {
    let payload: unknown;
    try {
      payload = JSON.parse(buffer.toString());
    } catch {
      this.logger.warn(
        `Tuya: ignoring non-JSON command on devices/${this.mappedId}/cmd`,
      );
      return;
    }
    if (
      typeof payload !== "object" ||
      payload === null ||
      Array.isArray(payload) ||
      typeof (payload as { on?: unknown }).on !== "boolean"
    ) {
      this.logger.warn(
        `Tuya: ignoring malformed command on devices/${this.mappedId}/cmd`,
      );
      return;
    }
    void this.setState((payload as { on: boolean }).on);
  }

  private handleDeviceData(data: { dps?: Record<string, unknown> }): void {
    if (!this.mqtt) return;
    const on = Boolean(data.dps?.[String(ON_OFF_DPS)]);
    const payload = {
      deviceId: this.mappedId,
      type: "switch",
      state: { on },
      timestamp: new Date().toISOString(),
    };
    const topic = `devices/${this.mappedId}/state`;
    this.mqtt.publish(topic, JSON.stringify(payload));
    this.logger.log(
      `Tuya ${this.mappedId} state -> ${topic}: ${JSON.stringify(payload)}`,
    );
  }
}
