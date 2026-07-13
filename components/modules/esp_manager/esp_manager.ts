import crypto from "crypto";
import Module from "../module";
import MqttBridge from "../../mqtt/mqtt_bridge";

const PURGE_AFTER_MS = 24 * 60 * 60 * 1000; // 24h — stale devices are removed from registry

interface EspDevice {
  id: string;
  type: string;
  name: string;
  online: boolean;
  lastSeen: number;
  interval: number;
  data: Record<string, any>;
  sensors?: string[];
  actuators?: { name: string; label: string }[];
}

class EspManager extends Module {
  private devices: Map<string, EspDevice>;
  private bridge: MqttBridge;
  private offlineCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    super("ESP_MANAGER", "esp_manager_queue");
    this.devices = new Map();
    this.bridge = MqttBridge.getInstance();

    this.setHandledCmds({
      esp_list: this.esp_list.bind(this),
      esp_get: this.esp_get.bind(this),
      esp_command: this.esp_command.bind(this),
      esp_purge: this.esp_purge.bind(this),
    });

    this.setupMqttSubscriptions();
    this.startOfflineCheck();
  }

  private setupMqttSubscriptions(): void {
    this.bridge.subscribe("guiver/+/announce", this.onAnnounce.bind(this));
    this.bridge.subscribe("guiver/+/status", this.onStatus.bind(this));
    this.bridge.subscribe("guiver/+/online", this.onOnline.bind(this));
    this.bridge.subscribe("guiver/+/response", this.onResponse.bind(this));
    this.bridge.subscribe("guiver/esp/purge", this.onMqttPurge.bind(this));
    this.log.info("MQTT subscriptions active (guiver/+/announce, guiver/+/status, guiver/+/online, guiver/+/response, guiver/esp/purge)");
  }

  private onAnnounce(topic: string, message: Buffer): void {
    try {
      const payload = JSON.parse(message.toString());
      const id = topic.split("/")[1];

      this.devices.set(id, {
        id,
        type: payload.type || "unknown",
        name: payload.name || id,
        online: true,
        lastSeen: Date.now(),
        interval: payload.interval || 30000,
        data: {},
        sensors: payload.sensors,
        actuators: payload.actuators,
      });

      this.log.info("ESP announced: " + id + " (" + payload.type + " - " + payload.name + ")");
      this.sendResponse("esp_announce", crypto.randomUUID(), { device: this.devices.get(id) });
    } catch (err: any) {
      this.log.error("Failed to parse announce message: " + err.message);
    }
  }

  private onStatus(topic: string, message: Buffer): void {
    try {
      const payload = JSON.parse(message.toString());
      const id = topic.split("/")[1];
      const device = this.devices.get(id);

      if (!device) {
        this.log.warn("Status from unknown device: " + id);
        return;
      }

      device.data = { ...device.data, ...payload };
      device.lastSeen = Date.now();
      device.online = true;
      this.log.debug("Status from " + id + ": " + JSON.stringify(payload));
      this.sendResponse("esp_status", crypto.randomUUID(), { id, data: device.data, lastSeen: device.lastSeen });
    } catch (err: any) {
      this.log.error("Failed to parse status message: " + err.message);
    }
  }

  private onOnline(topic: string, message: Buffer): void {
    const id = topic.split("/")[1];
    const device = this.devices.get(id);

    if (!device) {
      return;
    }

    const status = message.toString().trim();
    device.online = status === "true" || status === "1";
    device.lastSeen = Date.now();

    if (!device.online) {
      this.log.warn("ESP went offline: " + id);
    }
    this.sendResponse("esp_online", crypto.randomUUID(), { id, online: device.online });
  }

  private onResponse(topic: string, message: Buffer): void {
    try {
      const payload = JSON.parse(message.toString());
      const id = topic.split("/")[1];
      this.sendResponse("esp_response", crypto.randomUUID(), { id, ...payload });
    } catch (err: any) {
      this.log.error("Failed to parse response: " + err.message);
    }
  }

  private onMqttPurge(topic: string, message: Buffer): void {
    try {
      const payload = message.length > 0 ? JSON.parse(message.toString()) : {};
      const targetId = payload.id;
      const purged: { id: string; name: string }[] = [];

      for (const [id, device] of this.devices) {
        if (targetId && id !== targetId) continue;
        if (!device.online) {
          purged.push({ id, name: device.name });
          this.purgeDevice(id, device);
        }
      }

      this.log.info("MQTT purge: " + purged.length + " device(s) removed");
      this.sendResponse("esp_purge", crypto.randomUUID(), { purged: purged.length, devices: purged });
    } catch (err: any) {
      this.log.error("Failed to parse purge message: " + err.message);
    }
  }

  private purgeDevice(id: string, device: EspDevice): void {
    this.devices.delete(id);
    this.log.info("ESP purged: " + id + " (" + device.name + ")");
    this.bridge.publish("guiver/" + id + "/announce", Buffer.alloc(0), { retain: true });
    this.bridge.publish("guiver/" + id + "/online", Buffer.alloc(0), { retain: true });
    this.sendResponse("esp_purge", crypto.randomUUID(), { id, name: device.name });
  }

  private startOfflineCheck(): void {
    this.offlineCheckInterval = setInterval(() => {
      const now = Date.now();
      for (const [id, device] of this.devices) {
        if (!device.online) {
          if (now - device.lastSeen > PURGE_AFTER_MS) {
            this.purgeDevice(id, device);
          }
          continue;
        }
        if (now - device.lastSeen > device.interval * 3 * 1000) {
          device.online = false;
          this.log.warn("ESP marked offline (timeout): " + id);
          this.sendResponse("esp_online", crypto.randomUUID(), { id, online: false });
        }
      }
    }, 15000);
  }

  private async esp_list(command: any): Promise<any> {
    const filterType = command?.payload?.type;
    const devices = [];

    for (const [, device] of this.devices) {
      if (filterType && device.type !== filterType) {
        continue;
      }
      devices.push({ ...device });
    }

    const online = devices.filter((d) => d.online).length;

    return this.sendResponse("esp_list", command.id, {
      total: devices.length,
      online,
      devices,
    }, { client_id: command.client_id });
  }

  private async esp_get(command: any): Promise<any> {
    const { id } = command?.payload || {};

    if (!id) {
      return this.sendError("esp_get", undefined, "Missing device id");
    }

    const device = this.devices.get(id);
    if (!device) {
      return this.sendError("esp_get", id, "Device not found: " + id);
    }

    return this.sendResponse("esp_get", command.id, { ...device });
  }

  private async esp_command(command: any): Promise<any> {
    const { id, cmd, ...rest } = command?.payload || {};

    if (!id) {
      return this.sendError("esp_command", undefined, "Missing device id");
    }

    const device = this.devices.get(id);
    if (!device) {
      return this.sendError("esp_command", id, "Device not found: " + id);
    }

    const mqttTopic = "guiver/" + id + "/command";
    const mqttPayload = JSON.stringify({ cmd, ...rest });
    this.bridge.publish(mqttTopic, mqttPayload);

    this.log.info("Command sent to " + id + ": " + cmd);

    return this.sendResponse("esp_command", command.id, {
      status: "command_sent",
      device: id,
      topic: mqttTopic,
    });
  }

  private async esp_purge(command: any): Promise<any> {
    const targetId = command?.payload?.id;
    const purged: { id: string; name: string }[] = [];

    for (const [id, device] of this.devices) {
      if (targetId && id !== targetId) continue;
      if (!device.online) {
        purged.push({ id, name: device.name });
        this.purgeDevice(id, device);
      }
    }

    return this.sendResponse("esp_purge", command.id, {
      purged: purged.length,
      devices: purged,
    }, { client_id: command.client_id });
  }
}

export default EspManager;
