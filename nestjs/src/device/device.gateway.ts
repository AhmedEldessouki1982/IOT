import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "socket.io";
import { DeviceState } from "./device.service";

@WebSocketGateway()
export class DeviceGateway {
  @WebSocketServer()
  server: Server;

  broadcast(state: DeviceState): void {
    this.server.emit("device:state", state);
  }
}