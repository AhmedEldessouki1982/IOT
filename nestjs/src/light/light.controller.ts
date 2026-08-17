import { Controller, Get, Post } from "@nestjs/common";
import { EventPattern } from "@nestjs/microservices";
import { LightService, LightState } from "./light.service";
import { LightGateway } from "./light.gateway";

@Controller("light")
export class LightController {
  constructor(
    private readonly lightService: LightService,
    private readonly gateway: LightGateway,
  ) {}

  @Get("state")
  getState(): LightState {
    return this.lightService.getState();
  }

  @Post("toggle")
  toggle(): Promise<{ state: "on" | "off" }> {
    return this.lightService.toggle();
  }

  @EventPattern("devices/light1/state")
  handleState(payload: LightState): void {
    this.lightService.setState(payload);
    this.gateway.broadcast(payload);
  }
}
