import Module from "../module";

class Delay_module extends Module {
  constructor() {
    super("DELAY_MODULE", "delay_queue");
    this.setHandledCmds({
      delay: this._delay.bind(this),
    });
  }

  async _delay(command: any) {
    try {
      const delay_time = parseInt(command.payload.delay_time, 10) || 0;
      const cmd_to_delay = command.payload.command_to_delay;

      if (!cmd_to_delay) {
        return this.sendError("delay", command.id, "Missing 'command_to_delay'");
      }

      this.log.debug(`Delaying command '${cmd_to_delay}' for ${delay_time} ms`);
      this.sendResponse(command.command, command.id || "", {});
      await this._sleep(delay_time);

      this.log.info(`Delay done for command '${cmd_to_delay}'`);
      return this.sendRequest(cmd_to_delay, command.payload.payload_to_delay);

    } catch (err: any) {
      return this.sendError("delay", command.id, err.message);
    }
  }

  _sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default Delay_module;
