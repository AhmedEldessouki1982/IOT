import { Module } from "@nestjs/common";
import { SonoffController } from "./sonoff.controller";
import { SonoffService } from "./sonoff.service";
import { DeviceModule } from "../device/device.module";
import { SonoffRegistryModule } from "./sonoff-registry.module";
import { AutomationModule } from "../automation/automation.module";

/**
 * Wires the Sonoff Tasmota 3-gang switch into the app. Depends on DeviceModule
 * so SonoffService can reuse the shared DeviceService registry + DeviceGateway
 * socket broadcast (exactly how the live `light1` surfaces to the frontend).
 */
@Module({
  imports: [DeviceModule, SonoffRegistryModule, AutomationModule],
  controllers: [SonoffController],
  providers: [SonoffService],
  exports: [SonoffService, SonoffRegistryModule],
})
export class SonoffModule {}
