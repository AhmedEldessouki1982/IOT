import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as mqtt from "mqtt";
import { DeviceService, DeviceState } from "./device.service";
import { DeviceGateway } from "./device.gateway";

/**
 * Subscribes to the wildcard topic `devices/+/state` so that any device
 * publishing to `devices/<newId>/state` shows up with ZERO new backend code.
 *
 * Note: NestJS's microservice MQTT transport routes @EventPattern handlers by
 * exact topic match, so wildcard patterns never match incoming messages. We
 * therefore use a raw MQTT client here to get true single-level wildcard
 * subscription support.
 */
@Injectable()
export class DeviceMqttListener implements OnModuleDestroy {
  private readonly logger = new Logger(DeviceMqttListener.name);
  private readonly client: mqtt.MqttClient;

  constructor(
    private readonly deviceService: DeviceService,
    private readonly gateway: DeviceGateway,
    config: ConfigService,
  ) {
    const mqttUrl = config.get<string>("MQTT_URL") ?? "mqtt://localhost:1883";
    this.client = mqtt.connect(mqttUrl);

    // Attach handlers in the constructor (NOT onModuleInit): NestJS awaits
    // between provider construction and lifecycle hooks, and the broker on
    // localhost can emit `connect` before onModuleInit runs.
    this.client.on("connect", () => {
      this.client.subscribe("devices/+/state", (err) => {
        if (err) {
          this.logger.error(
            `Failed to subscribe to devices/+/state: ${err.message}`,
          );
          return;
        }
        this.logger.log("Subscribed to wildcard topic devices/+/state");
      });
    });
    this.client.on("message", (topic, buffer) =>
      this.handleState(topic, buffer),
    );
    this.client.on("error", (err) =>
      this.logger.error(`MQTT listener error: ${err.message}`),
    );
  }

  onModuleDestroy(): void {
    this.client.end();
  }

  private handleState(topic: string, buffer: Buffer): void {
    const deviceId = topic.split("/")[1];
    let payload: unknown;
    try {
      payload = JSON.parse(buffer.toString());
    } catch {
      this.logger.warn(`Ignoring non-JSON state on ${topic}`);
      return;
    }
    if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
      this.logger.warn(`Ignoring malformed state payload on ${topic}`);
      return;
    }

    this.deviceService.setState(deviceId, payload as Partial<DeviceState>);
    const state = this.deviceService.getState(deviceId);
    if (state) this.gateway.broadcast(state);
  }
}