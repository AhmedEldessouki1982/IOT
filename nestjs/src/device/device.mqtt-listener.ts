import { Injectable, Logger } from "@nestjs/common";
import { MqttConnectionService } from "../mqtt/mqtt-connection.service";
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
export class DeviceMqttListener {
  private readonly logger = new Logger(DeviceMqttListener.name);

  constructor(
    private readonly deviceService: DeviceService,
    private readonly gateway: DeviceGateway,
    mqtt: MqttConnectionService,
  ) {
    // Subcribe in the constructor (NOT onModuleInit): NestJS awaits between
    // provider construction and lifecycle hooks, and the broker on localhost
    // can emit `connect` before onModuleInit runs. MqttConnectionService
    // buffers this subscription until the shared client actually connects.
    mqtt.subscribe("devices/+/state", (topic, buffer) =>
      this.handleState(topic, buffer),
    );
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