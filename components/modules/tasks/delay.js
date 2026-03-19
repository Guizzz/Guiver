const Module = require("../module");

class Delay_module extends Module {
  constructor() {
    super("DELAY_MODULE", "delay_queue");
    this.set_handled_cmds({
      delay: this._delay.bind(this),
    });
  }

  async _delay(command) 
  {
    try {
      const delay_time = parseInt(command.payload.delay_time, 10) || 0;
      const cmd_to_delay = command.payload.command_to_delay;

      if (!cmd_to_delay) {
        return this.sendError("delay", "Missing 'command_to_delay'");
      }
      
      this.log.debug(`Delaying command '${cmd_to_delay}' for ${delay_time} ms`);
      this.sendResponse(command.command, {});
      await this._sleep(delay_time);

      this.log.info(`Delay done for command '${cmd_to_delay}'`);
      return this.sendRequest(cmd_to_delay, command.payload.payload_to_dealy);

    } catch (err) {
      return this.sendError("delay", err.message);
    }
  }

  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

}

module.exports = Delay_module;