import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { SocketIoAdapter } from './socket-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const corsOrigin =
    config.get<string>('CORS_ORIGIN') ?? 'http://localhost:5173';
  app.enableCors({ origin: corsOrigin });
  app.useWebSocketAdapter(new SocketIoAdapter(app, config));

  const mqttUrl = config.get<string>('MQTT_URL') ?? 'mqtt://localhost:1883';
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.MQTT,
    options: { url: mqttUrl },
  });

  await app.startAllMicroservices();

  const port = Number(config.get<string>('HTTP_PORT') ?? '3000');
  await app.listen(port);
  console.log(`HTTP  -> http://localhost:${port}`);
  console.log(`MQTT -> ${mqttUrl}`);
}

void bootstrap();