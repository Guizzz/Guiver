import Module from "../module";

class LoopTask_module extends Module {
  private tasks: Record<string, any>;

  constructor() {
    super("LOOP_MODULE", "loop_queue");
    this.setHandledCmds({
      add_loop_task: this._add_loop_task.bind(this),
      delete_loop_task: this._delete_loop_task.bind(this),
    });
    this.tasks = {};
  }

  _add_loop_task(command: any) {
    let delta_time = 5000;

    if (command.hasOwnProperty("delta_time"))
      delta_time = command.delta_time;

    if (command.hasOwnProperty("command_to_loop")) {
      const taskCommand = {
        type: "request",
        command: command.command_to_loop,
        payload: command.payload,
      };
      this.tasks[command.command_to_loop] = setInterval(() => {
        this.linkManager.toCore("core_queue", JSON.stringify(taskCommand));
      }, delta_time);
    }

    return undefined;
  }

  _delete_loop_task(command: any) {
    if (command.hasOwnProperty("command_to_unloop")) {
      console.log("stop loop:", command.command_to_unloop);
      clearInterval(this.tasks[command.command_to_unloop]);
    }
    return undefined;
  }
}

export default LoopTask_module;
