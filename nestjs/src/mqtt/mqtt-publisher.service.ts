import { Injectable } from '@nestjs/common';
import { MqttConnectionService } from './mqtt-connection.service';

@Injectable()
export class MqttPublisherService {
  constructor(private readonly mqtt: MqttConnectionService) {}

  setPower(deviceBase: string, gang: number, state: 'ON' | 'OFF'): void {
    const topic = `cmnd/${deviceBase}/POWER${gang}`;
    this.mqtt.publish(topic, state);
  }
}
