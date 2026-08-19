import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from "@nestjs/common";
import { DeviceService, DeviceState } from "./device.service";

@Controller("devices")
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Get()
  getAll(): DeviceState[] {
    return this.deviceService.getAllStates();
  }

  @Get(":id")
  getOne(@Param("id") id: string): DeviceState {
    const state = this.deviceService.getState(id);
    if (!state) throw new NotFoundException(`Device "${id}" not found`);
    return state;
  }

  @Post(":id/command")
  sendCommand(
    @Param("id") id: string,
    @Body() command: Record<string, unknown>,
  ): { ok: boolean } {
    if (!command || typeof command !== "object" || Array.isArray(command)) {
      throw new BadRequestException("Command body must be a JSON object");
    }
    this.deviceService.sendCommand(id, command);
    return { ok: true };
  }
}