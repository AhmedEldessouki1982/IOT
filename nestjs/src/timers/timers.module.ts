import { Module } from '@nestjs/common';
import { TimersService } from './timers.service';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [TimersService],
  exports: [TimersService],
})
export class TimersModule {}
