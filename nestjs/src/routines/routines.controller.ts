import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from "@nestjs/common";
import { RoutinesService, RoomView } from "./routines.service";

/**
 * Room routine surface — the reusable, data-driven API the dashboard reads.
 *
 * GET    /api/rooms                                  -> every room with a routine
 * GET    /api/rooms/:roomId                          -> one room + live state/timers
 * POST   /api/rooms/:roomId/gangs/:gang/press        -> advance one press stage
 * DELETE /api/rooms/:roomId/gangs/:gang/timer        -> cancel the auto-off countdown
 *
 * A press advances the gang's cycle (10m -> 30m -> off; the exhaust fan is a
 * single 10m stage). Rooms are derived from the Sonoff registry, so a second
 * toilet with the same routine needs no new endpoint or component.
 */
@Controller("api/rooms")
export class RoutinesController {
  constructor(private readonly routines: RoutinesService) {}

  @Get()
  list(): RoomView[] {
    return this.routines.listRooms();
  }

  @Get(":roomId")
  getOne(@Param("roomId") roomId: string): RoomView {
    return this.routines.getRoom(roomId);
  }

  @Post(":roomId/gangs/:gang/press")
  press(
    @Param("roomId") roomId: string,
    @Param("gang", ParseIntPipe) gang: number,
  ): RoomView {
    return this.routines.press(roomId, gang);
  }

  @Delete(":roomId/gangs/:gang/timer")
  cancel(
    @Param("roomId") roomId: string,
    @Param("gang", ParseIntPipe) gang: number,
  ): RoomView {
    return this.routines.cancelTimer(roomId, gang);
  }
}
