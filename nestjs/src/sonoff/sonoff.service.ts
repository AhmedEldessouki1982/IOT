import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { MqttConnectionService } from "../mqtt/mqtt-connection.service";
import { DeviceService } from "../device/device.service";
import { DeviceGateway } from "../device/device.gateway";
import {
  SonoffGang,
  SonoffRegistryService,
  SonoffSwitchConfig,
} from "./sonoff-registry.service";
import { DeviceAutomationService } from "../automation/device-automation.service";

@Injectable()
export class SonoffService implements OnModuleInit {
  private readonly logger = new Logger(SonoffService.name);
  private readonly switches: SonoffSwitchConfig[];

  constructor(
    private readonly mqtt: MqttConnectionService,
    private readonly deviceService: DeviceService,
    private readonly gateway: DeviceGateway,
    private readonly registry: SonoffRegistryService,
    private readonly automation: DeviceAutomationService,
  ) {
    this.switches = this.registry.getSwitches();
    if (this.switches.length > 0) this.subscribe();
  }

  onModuleInit(): void {
    if (!this.enabledState()) {
      this.logger.warn(
        "No Sonoff switches configured — Tasmota bridge disabled. " +
          "The app will run without physical Sonoff wall switches.",
      );
      return;
    }

    const summary = this.switches
      .map((entry) => `${entry.switchId}:${entry.base}:${entry.gangs}`)
      .join(", ");
    this.logger.log(`Sonoff bridge enabled: ${summary}`);
  }

  private subscribe(): void {
    for (const entry of this.switches) {
      this.mqtt.subscribe(`stat/${entry.base}/#`, (topic, buffer) =>
        this.handleState(topic, buffer),
      );
    }

    for (const gang of this.registry.getGangs()) {
      this.mqtt.subscribe(`devices/${gang.deviceId}/cmd`, (topic, buffer) =>
        this.handleCommand(topic, buffer),
      );
    }
  }

  private handleCommand(topic: string, buffer: Buffer): void {
    const match = /^devices\/([^/]+)\/cmd$/.exec(topic);
    if (!match) return;

    const gang = this.registry.getGang(match[1]);
    if (!gang) return;

    let payload: unknown;
    try {
      payload = JSON.parse(buffer.toString());
    } catch {
      this.logger.warn(`Sonoff: ignoring non-JSON command on ${topic}`);
      return;
    }
    if (
      typeof payload !== "object" ||
      payload === null ||
      Array.isArray(payload) ||
      typeof (payload as { on?: unknown }).on !== "boolean"
    ) {
      this.logger.warn(`Sonoff: ignoring malformed command on ${topic}`);
      return;
    }

    this.setGangOutput(gang, (payload as { on: boolean }).on);
  }

  private handleState(topic: string, buffer: Buffer): void {
    if (topic.endsWith("/RESULT")) {
      this.handleResult(topic, buffer);
      return;
    }

    const match = /^stat\/(.+)\/POWER(\d+)$/.exec(topic);
    if (!match) return;

    const base = match[1];
    const channel = Number(match[2]);
    const entry = this.registry.getSwitchByBase(base);
    if (
      !entry ||
      !Number.isInteger(channel) ||
      channel < 1 ||
      channel > entry.gangs
    ) {
      return;
    }

    const text = buffer.toString().trim().toUpperCase();
    if (text !== "ON" && text !== "OFF") return;

    const gang = this.registry.getGangForSwitch(entry.switchId, channel);
    if (!gang) return;

    this.recordState(gang, text === "ON");
  }

  private handleResult(topic: string, buffer: Buffer): void {
    const match = /^stat\/(.+)\/RESULT$/.exec(topic);
    if (!match) return;

    const entry = this.registry.getSwitchByBase(match[1]);
    if (!entry) return;

    let payload: unknown;
    try {
      payload = JSON.parse(buffer.toString());
    } catch {
      this.logger.warn(`Sonoff: ignoring non-JSON RESULT on ${topic}`);
      return;
    }
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return;
    }

    for (const [key, value] of Object.entries(payload)) {
      const buttonMatch = /^Button(\d+)$/.exec(key);
      if (!buttonMatch) continue;
      // A local switch toggles its own relay, so it publishes no actions; if it
      // ever does, they must not drive the cycle the relay change already ran.
      if (entry.buttonMode !== "detached") continue;
      if (!this.isPressAction(value)) continue;

      const gang = this.registry.getGangForSwitch(
        entry.switchId,
        Number(buttonMatch[1]),
      );
      if (!gang) continue;
      this.automation.handleButtonPress(gang.deviceId, gang.gang);
    }
  }

  /**
   * SINGLE and HOLD each count as one click; DOUBLE and anything else do not.
   */
  private isPressAction(value: unknown): boolean {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return false;
    }
    const action = (value as { Action?: unknown }).Action;
    return action === "SINGLE" || action === "HOLD";
  }

  setOutput(channel: number, on: boolean): void {
    const deviceId = this.deviceIdFor(channel);
    if (!deviceId) {
      this.logger.warn(`setOutput: invalid legacy channel ${channel}`);
      return;
    }
    this.setDeviceOutput(deviceId, on);
  }

  setDeviceOutput(deviceId: string, on: boolean): void {
    const gang = this.registry.getGang(deviceId);
    if (!gang) {
      this.logger.warn(`setDeviceOutput: unknown Sonoff device ${deviceId}`);
      return;
    }
    this.setGangOutput(gang, on);
  }

  deviceIdFor(channel: number): string {
    return channel >= 1 && channel <= 3 ? `sonoff${channel}` : "";
  }

  enabledState(): boolean {
    return this.switches.length > 0;
  }

  private setGangOutput(gang: SonoffGang, on: boolean): void {
    const topic = `cmnd/${gang.base}/POWER${gang.gang}`;
    const payload = on ? "ON" : "OFF";
    // Scenes and the legacy endpoint publish here directly, bypassing
    // DeviceService.sendCommand, so pair the echo here too.
    this.deviceService.noteRelayCommand(gang.deviceId, on);
    this.mqtt.publish(topic, payload);
    this.logger.log(`Sonoff publish ${topic} -> ${payload}`);
  }

  /** Apply a relay state the device reported over `stat/<base>/POWER<n>`. */
  private recordState(gang: SonoffGang, on: boolean): void {
    const echo = this.deviceService.resolveRelayEcho(gang.deviceId, on);
    // Echo of a command a newer one already superseded: dropping it keeps the
    // later state (and any timer armed with it) intact.
    if (echo === "stale") return;

    const changed = this.deviceService.setState(gang.deviceId, {
      type: "switch",
      state: { on },
    });
    if (!changed) return;

    const state = this.deviceService.getState(gang.deviceId);
    if (state) this.gateway.broadcast(state);
    this.logger.log(`Sonoff ${gang.deviceId} state -> ${on ? "ON" : "OFF"}`);

    // A local wall press switched the relay on without us: supervise it. OFF
    // needs nothing here — the automation's state-changed listener cancels the
    // gang's running timer.
    if (echo === "unsolicited" && on && gang.buttonMode === "local") {
      this.automation.handleLocalRelayOn(gang.deviceId, gang.gang);
    }
  }
}
