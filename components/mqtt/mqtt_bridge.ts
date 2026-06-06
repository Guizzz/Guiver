import mqtt from "mqtt";
import "dotenv/config";
import { interfaceLogger } from "../../utils/logger";

class MqttBridge {
  private static instance: MqttBridge;
  private client: mqtt.MqttClient | null = null;
  private logger: any;
  private subscribers: Map<string, Array<(topic: string, message: Buffer) => void>>;
  private brokerUrl: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private offline: boolean = false;

  private constructor() {
    this.logger = interfaceLogger("MQTT_BRIDGE");
    this.subscribers = new Map();
    this.brokerUrl = process.env.MQTT_BROKER_URL || "mqtt://localhost:1883";
    this.connect();
  }

  static getInstance(): MqttBridge {
    if (!MqttBridge.instance) {
      MqttBridge.instance = new MqttBridge();
    }
    return MqttBridge.instance;
  }

  private connect(): void {
    this.client = mqtt.connect(this.brokerUrl, {
      reconnectPeriod: 1000,
    });

    this.client.on("connect", () => {
      this.logger.info("Connected to MQTT broker at " + this.brokerUrl);
      this.reconnectAttempts = 0;
      this.offline = false;
      for (const [topic] of this.subscribers) {
        this.client?.subscribe(topic);
      }
    });

    this.client.on("message", (topic: string, message: Buffer) => {
      const handlers = this.subscribers.get(topic);
      if (handlers) {
        for (const cb of handlers) {
          cb(topic, message);
        }
      }
    });

    this.client.on("error", () => {});

    this.client.on("reconnect", () => {
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.offline = true;
        this.client?.end(true);
        this.client = null;
        this.logger.warn("MQTT broker at " + this.brokerUrl + " not reachable — offline mode, continuing without MQTT");
        return;
      }
    });

    this.client.on("close", () => {});
  }

  publish(topic: string, message: string | Buffer): void {
    if (this.offline) {
      return;
    }
    if (!this.client || !this.client.connected) {
      this.logger.warn("Cannot publish to " + topic + ": not connected");
      return;
    }
    this.client.publish(topic, message);
  }

  subscribe(topic: string, callback: (topic: string, message: Buffer) => void): void {
    if (this.offline) {
      return;
    }
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, []);
      if (this.client?.connected) {
        this.client.subscribe(topic);
      }
    }
    this.subscribers.get(topic)!.push(callback);
  }

  unsubscribe(topic: string, callback?: (topic: string, message: Buffer) => void): void {
    if (this.offline) {
      return;
    }
    if (!callback) {
      this.subscribers.delete(topic);
      if (this.client?.connected) {
        this.client.unsubscribe(topic);
      }
      return;
    }
    const handlers = this.subscribers.get(topic);
    if (handlers) {
      const idx = handlers.indexOf(callback);
      if (idx !== -1) handlers.splice(idx, 1);
      if (handlers.length === 0) {
        this.subscribers.delete(topic);
        if (this.client?.connected) {
          this.client.unsubscribe(topic);
        }
      }
    }
  }

  isConnected(): boolean {
    return this.client?.connected ?? false;
  }
}

export default MqttBridge;
