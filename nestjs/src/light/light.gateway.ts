import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { LightState } from './light.service';

@WebSocketGateway({ cors: { origin: 'http://localhost:5173' } })
export class LightGateway {
  @WebSocketServer()
  server: Server;

  broadcast(state: LightState): void {
    this.server.emit('light:state', state);
  }
}