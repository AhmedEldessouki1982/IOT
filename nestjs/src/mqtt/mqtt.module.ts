import { Module } from '@nestjs/common';
import { MqttConnectionService } from './mqtt-connection.service';
import { MqttPublisherService } from './mqtt-publisher.service';

@Module({
  providers: [MqttConnectionService, MqttPublisherService],
  exports: [MqttConnectionService, MqttPublisherService],
})
export class MqttModule {}
