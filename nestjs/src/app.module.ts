import { Module } from '@nestjs/common';
import { LightModule } from './light/light.module';

@Module({
  imports: [LightModule],
})
export class AppModule {}