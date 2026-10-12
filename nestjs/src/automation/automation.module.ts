import { Module } from "@nestjs/common";
import { DeviceAutomationService } from "./device-automation.service";
import { TimersModule } from "../timers/timers.module";
import { DeviceModule } from "../device/device.module";
import { SonoffRegistryModule } from "../sonoff/sonoff-registry.module";
import { MqttModule } from "../mqtt/mqtt.module";
import { DeviceTimerController } from "../device/device-timer.controller";

@Module({
  imports: [TimersModule, DeviceModule, SonoffRegistryModule, MqttModule],
  controllers: [DeviceTimerController],
  providers: [DeviceAutomationService],
  exports: [DeviceAutomationService],
})
export class AutomationModule {}
