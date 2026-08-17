import { Module } from '@nestjs/common';
import { LightController } from './light.controller';
import { LightService } from './light.service';
import { LightGateway } from './light.gateway';

@Module({
  controllers: [LightController],
  providers: [LightService, LightGateway],
})
export class LightModule {}