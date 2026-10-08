import { Module } from "@nestjs/common";
import { DeviceController } from "./device.controller";
import { DeviceService } from "./device.service";
import { DeviceGateway } from "./device.gateway";
import { DeviceMqttListener } from "./device.mqtt-listener";
import { MqttConnectionService } from "../mqtt/mqtt-connection.service";
import { DevicePersistenceService } from "./device-persistence.service";

@Module({
  controllers: [DeviceController],
  providers: [
    DeviceService,
    DevicePersistenceService,
    DeviceGateway,
    DeviceMqttListener,
    // The single shared MQTT client — also used by SonoffService (SonoffModule
    // imports DeviceModule), so exported like DeviceService/DeviceGateway.
    MqttConnectionService,
  ],
  // Exported so other modules (e.g. SonoffModule) can reuse the shared device
  // registry (DeviceService), socket broadcast (DeviceGateway) and the single
  // MQTT connection (MqttConnectionService).
  exports: [
    DeviceService,
    DevicePersistenceService,
    DeviceGateway,
    MqttConnectionService,
  ],
})
export class DeviceModule {}
