import { Module } from "@nestjs/common";
import { SonoffRegistryService } from "./sonoff-registry.service";

@Module({
  providers: [SonoffRegistryService],
  exports: [SonoffRegistryService],
})
export class SonoffRegistryModule {}
