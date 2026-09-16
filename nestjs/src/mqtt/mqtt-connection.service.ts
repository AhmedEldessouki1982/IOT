import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as mqtt from "mqtt";

type MessageHandler = (topic: string, buffer: Buffer) => void;

/**
 * Owns the single raw MQTT client the whole backend shares (publisher +
 * wildcard subscriber + Sonoff Tasmota bridge). Every other service injects
 * this instead of calling `mqtt.connect()` itself, so exactly one connection
 * is held and connect/reconnect/error logging lives in one place.
 *
 * Why a raw client (not @nestjs/microservices MQTT transport): the
 * microservice transport routes @EventPattern handlers by exact topic match,
 * so wildcard patterns like `devices/+/state` or `stat/<base>/#` never match.
 * See DeviceMqttListener for background.
 *
 * The client is created in the constructor (NOT onModuleInit): the broker on
 * localhost can emit `connect` before NestJS runs lifecycle hooks, so any
 * subscription registered during provider construction must already be
 * buffered here and flushed when `connect` fires.
 */
@Injectable()
export class MqttConnectionService implements OnModuleDestroy {
  private readonly logger = new Logger(MqttConnectionService.name);
  private readonly client: mqtt.MqttClient;
  private readonly subscriptions = new Map<string, MessageHandler>();

  constructor(config: ConfigService) {
    const mqttUrl = config.get<string>("MQTT_URL") ?? "mqtt://localhost:1883";
    this.client = mqtt.connect(mqttUrl);

    this.client.on("connect", () => {
      this.logger.log(`MQTT connected to ${mqttUrl}`);
      for (const [topic, handler] of this.subscriptions) {
        this.client.subscribe(topic, (err) => {
          if (err) {
            this.logger.error(`Failed to subscribe to ${topic}: ${err.message}`);
            return;
          }
          this.logger.log(`Subscribed to ${topic}`);
        });
      }
    });
    this.client.on("reconnect", () =>
      this.logger.warn(`MQTT reconnecting to ${mqttUrl}`),
    );
    this.client.on("offline", () => this.logger.warn("MQTT client offline"));
    this.client.on("close", () => this.logger.warn("MQTT connection closed"));
    this.client.on("error", (err) =>
      this.logger.error(`MQTT error: ${err.message}`),
    );
    this.client.on("message", (topic, buffer) =>
      this.handleMessage(topic, buffer),
    );
  }

  onModuleDestroy(): void {
    this.client.end();
  }

  /**
   * Subscribes to `pattern` and routes every matching message to `onMessage`.
   * Pattern grammar is the MQTT one: `+` matches one level, `#` (last level
   * only) matches any trailing levels. Buffered until the client connects, so
   * it is safe to call from any provider constructor.
   */
  subscribe(pattern: string, onMessage: MessageHandler): void {
    if (this.subscriptions.has(pattern)) {
      this.logger.warn(`Duplicate subscribe for ${pattern} — replaced`);
    }
    this.subscriptions.set(pattern, onMessage);
    if (this.client.connected) {
      this.client.subscribe(pattern, (err) => {
        if (err) {
          this.logger.error(`Failed to subscribe to ${pattern}: ${err.message}`);
          return;
        }
        this.logger.log(`Subscribed to ${pattern}`);
      });
    }
  }

  publish(topic: string, payload: string): void {
    this.client.publish(topic, payload);
  }

  private handleMessage(topic: string, buffer: Buffer): void {
    for (const [pattern, handler] of this.subscriptions) {
      if (topicMatches(pattern, topic)) handler(topic, buffer);
    }
  }
}

/** True when `topic` matches `pattern` (`+` = one level, `#` = trailing). */
function topicMatches(pattern: string, topic: string): boolean {
  const p = pattern.split("/");
  const t = topic.split("/");
  for (let i = 0; i < p.length; i++) {
    if (p[i] === "#") return i === p.length - 1 && t.length >= i;
    if (p[i] === "+") {
      if (i >= t.length) return false;
      continue;
    }
    if (t[i] !== p[i]) return false;
  }
  return t.length === p.length;
}