import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  BadRequestException,
} from "@nestjs/common";
import { TimersService } from "../timers/timers.service";
import { PressType } from "../common/press.types";

class ButtonDto {
  gang: number;
  pressType: PressType;
}

@Controller("api")
export class DeviceTimerController {
  constructor(private readonly timers: TimersService) {}

  @Get("timers")
  getTimers() {
    return this.timers.getAll();
  }

  @Delete("timers/:deviceId/:gang")
  cancelTimer(
    @Param("deviceId") deviceId: string,
    @Param("gang") gang: string,
  ) {
    this.timers.cancel(deviceId, parseInt(gang));
    return { ok: true };
  }

  @Post("devices/:id/button")
  handleButton(@Param("id") id: string, @Body() body: ButtonDto) {
    if (
      !body ||
      typeof body.gang !== "number" ||
      (body.pressType !== "single" && body.pressType !== "long")
    ) {
      throw new BadRequestException("Invalid body");
    }
    return { ok: true, id, gang: body.gang, pressType: body.pressType };
  }
}
