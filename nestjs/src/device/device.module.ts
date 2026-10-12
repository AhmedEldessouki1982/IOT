import { Module } from "@nestjs/common";
import { DeviceController } from "./device.controller";
import { DeviceService } from "./device.service";
import { DeviceGateway } from "./device.gateway";
import { DeviceMqttListener } from "./device.mqtt-listener";
import { MqttPublisherService } from "../mqtt/mqtt-publisher.service";
import { MqttModule } from "../mqtt/mqtt.module";
import { DevicePersistenceService } from "./device-persistence.service";
import { TimersModule } from "../timers/timers.module";

@Module({
  imports: [MqttModule, TimersModule],
  controllers: [DeviceController],
  providers: [
    DeviceService,
    DevicePersistenceService,
    DeviceGateway,
    DeviceMqttListener,
    MqttPublisherService,
  ],
  // Exported so other modules (e.g. SonoffModule) can reuse the shared device
  // registry (DeviceService), socket broadcast (DeviceGateway) and the single
  // MQTT connection (MqttConnectionService).
  exports: [
    DeviceService,
    DevicePersistenceService,
    DeviceGateway,
    MqttPublisherService,
    MqttModule,
  ],
})
export class DeviceModule {}
