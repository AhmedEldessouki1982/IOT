import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
} from "@nestjs/common";
import { DeviceService, DeviceState } from "../device/device.service";
import { SonoffService } from "./sonoff.service";

/**
 * REST surface for the Sonoff T3US3C 3-gang switch.
 *
 * GET  /sonoff                  -> current state of all three relays
 * POST /sonoff/:channel/command -> toggle/force a relay, body { "on": boolean }
 */
@Controller("sonoff")
export class SonoffController {
  private readonly logger = new Logger(SonoffController.name);

  constructor(
    private readonly sonoff: SonoffService,
    private readonly deviceService: DeviceService,
  ) {}

  @Get()
  getAll(): { enabled: boolean; channels: DeviceState[] } {
    const channels = [1, 2, 3]
      .map((n) => this.deviceService.getState(this.sonoff.deviceIdFor(n)))
      .filter((s): s is DeviceState => s !== undefined);
    return { enabled: this.sonoff.enabledState(), channels };
  }

  @Get(":channel")
  getOne(@Param("channel", ParseIntPipe) channel: number): DeviceState {
    const state = this.deviceService.getState(this.sonoff.deviceIdFor(channel));
    if (!state)
      throw new NotFoundException(`sonoff${channel} has no state yet`);
    return state;
  }

  @Post(":channel/command")
  setChannel(
    @Param("channel", ParseIntPipe) channel: number,
    @Body() command: Record<string, unknown>,
  ): { ok: boolean; channel: number; on: boolean } {
    if (!command || typeof command !== "object" || Array.isArray(command)) {
      throw new BadRequestException("Command body must be a JSON object");
    }
    if (typeof (command as { on?: unknown }).on !== "boolean") {
      throw new BadRequestException("Body must contain a boolean `on` field");
    }
    const on = (command as { on: boolean }).on;
    if (channel < 1 || channel > 3) {
      throw new BadRequestException("channel must be 1..3");
    }
    this.logger.log(`POST /sonoff/${channel}/command on=${on}`);
    this.sonoff.setOutput(channel, on);
    return { ok: true, channel, on };
  }
}
