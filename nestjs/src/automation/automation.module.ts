import { Module } from "@nestjs/common";
import { DeviceAutomationService } from "./device-automation.service";
import { TimersModule } from "../timers/timers.module";
import { DeviceModule } from "../device/device.module";
import { SonoffRegistryModule } from "../sonoff/sonoff-registry.module";

@Module({
  imports: [TimersModule, DeviceModule, SonoffRegistryModule],
  providers: [DeviceAutomationService],
  exports: [DeviceAutomationService],
})
export class AutomationModule {}
