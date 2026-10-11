import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DeviceModule } from './device/device.module';
import { SonoffModule } from './sonoff/sonoff.module';
import { TimersModule } from './timers/timers.module';
import { AutomationModule } from './automation/automation.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DeviceModule,
    SonoffModule,
    TimersModule,
    AutomationModule,
  ],
})
export class AppModule {}