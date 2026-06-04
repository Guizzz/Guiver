import dgram from "dgram";
import "dotenv/config";
import { interfaceLogger } from "../../utils/logger";

class InfoPoint {
  private logger: any;
  private server: dgram.Socket;

  constructor() {
    this.logger = interfaceLogger("INFO_POINT");
    this.server = dgram.createSocket("udp4");

    this.server.on("error", (error: Error) => {
      this.logger.error("Error: " + error);
      this.server.close();
    });

    this.server.on("listening", this.listening.bind(this));
    this.server.on("message", this.onMessages.bind(this));

    this.server.on("close", () => {
      this.logger.debug("Socket is closed !");
    });

    this.server.bind(Number(process.env.INFO_PORT) || 54321);
  }

  listening() {
    const address = this.server.address();
    const port = address.port;
    const family = address.family;
    const ipaddr = address.address;
    this.logger.info("Server is listening at port " + port);
    this.logger.debug("Server ip :" + ipaddr);
    this.logger.debug("Server is IP4/IP6 : " + family);
  }

  onMessages(msg: Buffer, info: dgram.RemoteInfo) {
    this.logger.debug("Data received from client : " + msg.toString());
    this.logger.debug("From %s:%d\n", info.address, info.port);

    if (msg.toString() === "WHOISBRAIN") {
      this.server.send("IAM", info.port, "localhost");
    }
  }
}

export default InfoPoint;
