import { Module } from "@nestjs/common";
import { SonoffController } from "./sonoff.controller";
import { SonoffService } from "./sonoff.service";
import { DeviceModule } from "../device/device.module";

/**
 * Wires the Sonoff Tasmota 3-gang switch into the app. Depends on DeviceModule
 * so SonoffService can reuse the shared DeviceService registry + DeviceGateway
 * socket broadcast (exactly how the live `light1` surfaces to the frontend).
 */
@Module({
  imports: [DeviceModule],
  controllers: [SonoffController],
  providers: [SonoffService],
})
export class SonoffModule {}
