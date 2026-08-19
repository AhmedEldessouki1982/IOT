import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DeviceModule } from './device/device.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), DeviceModule],
})
export class AppModule {}