import { Module } from "@nestjs/common";
import { TimerPersistenceService } from "./timer-persistence.service";
import { TimersService } from "./timers.service";

@Module({
  providers: [TimersService, TimerPersistenceService],
  exports: [TimersService, TimerPersistenceService],
})
export class TimersModule {}
