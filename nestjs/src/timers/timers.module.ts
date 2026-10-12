import { Module } from "@nestjs/common";
import { TimersService } from "./timers.service";

@Module({
  providers: [TimersService],
  exports: [TimersService],
})
export class TimersModule {}
