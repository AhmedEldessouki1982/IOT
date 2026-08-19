import { INestApplicationContext } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { ServerOptions } from "socket.io";

/**
 * Socket.IO adapter that injects the CORS origin from env config instead of
 * hardcoding it in the @WebSocketGateway decorator.
 */
export class SocketIoAdapter extends IoAdapter {
  constructor(
    app: INestApplicationContext,
    private readonly config: ConfigService,
  ) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const corsOrigin =
      this.config.get<string>("CORS_ORIGIN") ?? "http://localhost:5173";
    return super.createIOServer(port, {
      ...options,
      cors: { origin: corsOrigin },
    });
  }
}