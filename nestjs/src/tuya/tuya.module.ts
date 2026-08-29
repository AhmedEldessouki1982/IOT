import { Module } from "@nestjs/common";
import { TuyaService } from "./tuya.service";

/**
 * Bridges a local Tuya-protocol device (e.g. a Sonoff wall switch running
 * stock firmware) into the app's generic MQTT device contract. The rest of
 * the app treats it as an ordinary device on `devices/<id>/state` and
 * `devices/<id>/cmd` MQTT topics — it never knows the device speaks Tuya.
 */
@Module({
  providers: [TuyaService],
  exports: [TuyaService],
})
export class TuyaModule {}
