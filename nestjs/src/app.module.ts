import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DeviceModule } from './device/device.module';
import { SonoffModule } from './sonoff/sonoff.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DeviceModule,
    SonoffModule,
  ],
})
export class AppModule {}