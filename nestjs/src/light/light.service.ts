import { Injectable, Logger } from "@nestjs/common";
import * as mqtt from "mqtt";

export interface LightState {
  deviceId: string;
  state: "on" | "off";
  timestamp: string;
}

@Injectable()
export class LightService {
  private readonly logger = new Logger(LightService.name);
  private readonly client: mqtt.MqttClient;
  // Initial light state
  private state: LightState = {
    deviceId: "light1",
    state: "off",
    timestamp: new Date().toISOString(),
  };

  constructor() {
    this.client = mqtt.connect("mqtt://localhost:1883");
    this.client.on("connect", () =>
      this.logger.log("MQTT publisher connected"),
    );
  }

  getState(): LightState {
    return this.state;
  }

  setState(state: LightState): void {
    this.state = state;
  }

  async toggle(): Promise<{ state: "on" | "off" }> {
    const next: "on" | "off" = this.state.state === "on" ? "off" : "on";
    this.logger.log(`Publishing command "${next}" to devices/light1/cmd`);
    this.client.publish("devices/light1/cmd", next);
    return { state: next };
  }
}
