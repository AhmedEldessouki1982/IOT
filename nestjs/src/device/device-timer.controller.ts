import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  BadRequestException,
} from "@nestjs/common";
import { TimersService } from "../timers/timers.service";
import { PressType } from "../common/press.types";
import { DeviceAutomationService } from "../automation/device-automation.service";
import { SonoffRegistryService } from "../sonoff/sonoff-registry.service";

class ButtonDto {
  gang: number;
  pressType: PressType;
}

@Controller("api")
export class DeviceTimerController {
  constructor(
    private readonly timers: TimersService,
    private readonly automation: DeviceAutomationService,
    private readonly sonoffRegistry: SonoffRegistryService,
  ) {}

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
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new BadRequestException("Invalid body");
    }
    if (!Number.isInteger(body.gang) || body.gang < 1 || body.gang > 3) {
      throw new BadRequestException("gang must be an integer from 1 to 3");
    }
    if (body.pressType !== "single" && body.pressType !== "long") {
      throw new BadRequestException("pressType must be `single` or `long`");
    }

    const gang = this.sonoffRegistry.getGangForSwitch(id, body.gang);
    if (!gang) {
      throw new NotFoundException(
        `No Sonoff gang found for ${id}/${body.gang}`,
      );
    }

    this.automation.handleButtonPress(gang.deviceId, gang.gang);
    return {
      ok: true,
      id,
      deviceId: gang.deviceId,
      gang: gang.gang,
      pressType: body.pressType,
    };
  }
}
