import Module from "../module";
import MqttBridge from "../../mqtt/mqtt_bridge";

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
      esp_command: this.esp_command.bind(this),
    });

    this.setupMqttSubscriptions();
    this.startOfflineCheck();
  }

  private setupMqttSubscriptions(): void {
    this.bridge.subscribe("guiver/+/announce", this.onAnnounce.bind(this));
    this.bridge.subscribe("guiver/+/status", this.onStatus.bind(this));
    this.bridge.subscribe("guiver/+/online", this.onOnline.bind(this));
    this.log.info("MQTT subscriptions active (guiver/+/announce, guiver/+/status, guiver/+/online)");
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
    device.online = status === "true";
    device.lastSeen = Date.now();

    if (!device.online) {
      this.log.warn("ESP went offline: " + id);
    }
  }

  private startOfflineCheck(): void {
    this.offlineCheckInterval = setInterval(() => {
      const now = Date.now();
      for (const [id, device] of this.devices) {
        if (device.online && now - device.lastSeen > device.interval * 3) {
          device.online = false;
          this.log.warn("ESP marked offline (timeout): " + id);
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
    });
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
}

export default EspManager;
