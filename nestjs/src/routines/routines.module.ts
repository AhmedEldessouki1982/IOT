import { Module } from "@nestjs/common";
import { AutomationModule } from "../automation/automation.module";
import { DeviceModule } from "../device/device.module";
import { TimersModule } from "../timers/timers.module";
import { SonoffRegistryModule } from "../sonoff/sonoff-registry.module";
import { RoutinesController } from "./routines.controller";
import { RoutinesService } from "./routines.service";

/**
 * Room routines: the reusable, data-driven layer that turns a switch registry
 * entry + a routine preset into a room the dashboard can render and control.
 * Shared by every routine-based room (main toilet today, master toilet next).
 */
@Module({
  imports: [SonoffRegistryModule, DeviceModule, TimersModule, AutomationModule],
  controllers: [RoutinesController],
  providers: [RoutinesService],
  exports: [RoutinesService],
})
export class RoutinesModule {}
