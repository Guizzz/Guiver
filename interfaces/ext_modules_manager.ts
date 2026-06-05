import WssManager from "../utils/wss_manager";
import EventBus from "../utils/event_bus";
import { interfaceLogger } from "../utils/logger";

class ExtModuleManager {
  private logger: any;
  private wssManager: WssManager;

  constructor() {
    this.logger = interfaceLogger("WSS_MODULES");
    this.wssManager = new WssManager(process.env.WSS_MDL_PORT!, "mdl_ws_msg", (msg: string) => this.logger.debug(msg));
    this.wssManager.start();

    this.wssManager.on("mdl_ws_msg", this.from_client.bind(this));
    EventBus.subscribe("core:response", this.send_client.bind(this));

    this._start();
  }

  _start() {
    const j_msg = {
      type: "managment",
      command: "response_config",
      module: "MODULES_MGMT",
      module_queue: "modules_queue",
    };
    EventBus.publish("core:register_handler", j_msg);
  }

  from_client(msg: string) {
    try {
      const parsed = JSON.parse(msg);
      EventBus.publish("core:request", parsed);
    } catch {
      this.logger.error("Invalid JSON from external module");
    }
  }

  send_client(msg: any) {
    this.wssManager.sendResponse(JSON.stringify(msg));
  }
}

export default ExtModuleManager;
