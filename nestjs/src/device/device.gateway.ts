import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { OnEvent } from "@nestjs/event-emitter";
import { Server } from "socket.io";
import { DeviceState } from "./device.service";
import { TimerEntry } from "../timers/timers.service";

@WebSocketGateway()
export class DeviceGateway {
  @WebSocketServer()
  server: Server;

  broadcast(state: DeviceState): void {
    this.server.emit("device:state", state);
  }

  @OnEvent("timer.update")
  broadcastTimers(timers: TimerEntry[]): void {
    this.server.emit("timer:update", timers);
  }
}
