import hap from "hap-nodejs";
import LinkManager from "../utils/link_manager";
import { interfaceLogger } from "../utils/logger";

const Accessory = hap.Accessory;
const Characteristic = hap.Characteristic;
const Service = hap.Service;

class HomekitServer {
  private logger: any;
  private linkManager: LinkManager;
  private last: any;
  private lightService: any;
  private tempService: any;
  private onCharacteristic_temp: any;
  private onCharacteristic_hum: any;
  private onCharacteristic_onoff: any;
  private accessoryUuid: any;
  private accessory: any;
  private accessoryUuid_2: any;
  private tempAccessory: any;
  private currentLightStatus: boolean;
  private currentTemperature: number;
  private currentHumidity: number;

  constructor() {
    this.logger = interfaceLogger("HOMEKIT");
    this.linkManager = new LinkManager("HOMEKIT_SERVER", "homekit_queue", (m: string) => this.logger.debug(m));
    this.linkManager.start();
    this.linkManager.on("msg", this.update_value.bind(this));
    this.linkManager.on("channel_new", this._start.bind(this));

    this.lightService = new Service.Lightbulb("Lightbulb Test");

    this.tempService = new Service.TemperatureSensor("Temp Test");
    this.onCharacteristic_temp = this.tempService.getCharacteristic(Characteristic.CurrentTemperature);
    this.onCharacteristic_hum = this.tempService.getCharacteristic(Characteristic.CurrentRelativeHumidity);
    this.onCharacteristic_temp.on("get", this._getTemp.bind(this));
    this.onCharacteristic_hum.on("get", this._getHum.bind(this));

    this.onCharacteristic_onoff = this.lightService.getCharacteristic(Characteristic.On);
    this.onCharacteristic_onoff.on("get", this._get.bind(this));
    this.onCharacteristic_onoff.on("set", this._set.bind(this));

    this.accessoryUuid = hap.uuid.generate("hap.examples.light");
    this.accessory = new Accessory("Test luce Apple Home", this.accessoryUuid);
    this.accessory.addService(this.lightService);

    this.accessoryUuid_2 = hap.uuid.generate("hap.examples.temp");
    this.tempAccessory = new Accessory("Apple Home Temp", this.accessoryUuid_2);
    this.tempAccessory.addService(this.tempService);

    this.accessory.publish({
      username: "17:51:07:F4:BC:8A",
      pincode: "678-90-876",
      port: 47129,
      category: hap.Categories.LIGHTBULB,
    });

    this.tempAccessory.publish({
      username: "17:51:07:F4:BC:8B",
      pincode: "678-90-876",
      port: 47130,
      category: hap.Categories.SENSOR,
    });

    this.currentLightStatus = false;
    this.currentTemperature = 0;
    this.currentHumidity = 0;

    console.log("Accessory setup finished!");
  }

  _start() {
    const j_msg = {
      type: "managment",
      command: "response_config",
      module: "HOMEKIT_SERVER",
      module_queue: "homekit_queue",
    };
    this.linkManager.toCore("core_queue", JSON.stringify(j_msg));

    const j_cmd = {
      type: "request",
      command: "relay_status",
    };
    this.linkManager.toCore("core_queue", JSON.stringify(j_cmd));
  }

  update_value(data: string) {
    this.last = data;
    const parsed = JSON.parse(data);
    if (!parsed.hasOwnProperty("payload"))
      return;
    if (parsed.payload.hasOwnProperty("light"))
      this.currentLightStatus = parsed.payload.light;

    if (parsed.payload.hasOwnProperty("temp")) {
      this.currentTemperature = parsed.payload.temp;
      this.onCharacteristic_temp.updateValue(this.currentTemperature);
    }
  }

  _get(callback: any) {
    console.log("Queried current light state: " + this.currentLightStatus);
    callback(undefined, this.currentLightStatus);
  }

  _set(value: any, callback: any) {
    console.log("Setting light state to: " + value);
    this.currentLightStatus = value;
    const j_cmd = {
      type: "request",
      command: "set_relay",
      payload: {
        set_relay: value,
        relay: "light",
      },
    };
    this.linkManager.toCore("core_queue", JSON.stringify(j_cmd));
    callback();
  }

  _getHum(callback: any) {
    callback(null, this.currentHumidity);
  }

  _getTemp(callback: any) {
    const j_cmd = {
      type: "request",
      command: "get_room_temp",
    };
    this.linkManager.toCore("core_queue", JSON.stringify(j_cmd));

    console.log("Queried current temperature: " + this.currentTemperature);
    callback(null, this.currentTemperature);
  }
}

export default HomekitServer;
