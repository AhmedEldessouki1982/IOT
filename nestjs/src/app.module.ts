import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DeviceModule } from './device/device.module';
import { TuyaModule } from './tuya/tuya.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DeviceModule,
    TuyaModule,
  ],
})
export class AppModule {}