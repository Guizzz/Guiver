import WssManager from "../utils/wss_manager";
import LinkManager from "../utils/link_manager";
import { interfaceLogger } from "../utils/logger";

class ExtModuleManager {
  private logger: any;
  private linkManager: LinkManager;
  private wssManager: WssManager;

  constructor() {
    this.logger = interfaceLogger("WSS_MODULES");
    this.linkManager = new LinkManager("MODULES_MGMT", "modules_queue", (msg: string) => this.logger.debug(msg));
    this.wssManager = new WssManager(process.env.WSS_MDL_PORT!, "mdl_ws_msg", (msg: string) => this.logger.debug(msg));
    this.linkManager.start();
    this.wssManager.start();

    this.wssManager.on("mdl_ws_msg", this.from_client.bind(this));
    this.linkManager.on("msg", this.send_client.bind(this));
    this.linkManager.on("channel_new", this._start.bind(this));
  }

  _start() {
    const j_msg = {
      type: "managment",
      command: "response_config",
      module: "MODULES_MGMT",
      module_queue: "modules_queue",
    };
    this.linkManager.toCore("core_queue", JSON.stringify(j_msg));
  }

  from_client(msg: string) {
    return this.linkManager.toCore("core_queue", msg);
  }

  send_client(msg: string) {
    return this.wssManager.sendResponse(msg);
  }
}

export default ExtModuleManager;
