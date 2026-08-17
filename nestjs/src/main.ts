import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: ['http://localhost:5173'] });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.MQTT,
    options: { url: 'mqtt://localhost:1883' },
  });

  await app.startAllMicroservices();
  await app.listen(3000);
  console.log('HTTP  -> http://localhost:3000');
  console.log('MQTT -> mqtt://localhost:1883');
}

void bootstrap();