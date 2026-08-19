import { Module } from "@nestjs/common";
import { DeviceController } from "./device.controller";
import { DeviceService } from "./device.service";
import { DeviceGateway } from "./device.gateway";
import { DeviceMqttListener } from "./device.mqtt-listener";

@Module({
  controllers: [DeviceController],
  providers: [DeviceService, DeviceGateway, DeviceMqttListener],
})
export class DeviceModule {}