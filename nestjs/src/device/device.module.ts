import { Module } from "@nestjs/common";
import { DeviceController } from "./device.controller";
import { DeviceService } from "./device.service";
import { DeviceGateway } from "./device.gateway";
import { DeviceMqttListener } from "./device.mqtt-listener";

@Module({
  controllers: [DeviceController],
  providers: [DeviceService, DeviceGateway, DeviceMqttListener],
  // Exported so other modules (e.g. SonoffModule) can reuse the shared device
  // registry (DeviceService) and socket broadcast (DeviceGateway).
  exports: [DeviceService, DeviceGateway],
})
export class DeviceModule {}