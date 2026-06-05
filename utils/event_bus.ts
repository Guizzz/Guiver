import { EventEmitter } from "events";

export type EventHandler = (...args: any[]) => void;

class EventBus extends EventEmitter {
  private static instance: EventBus;

  private constructor() {
    super();
    this.setMaxListeners(50);
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  publish(event: string, data: any): void {
    this.emit(event, data);
  }

  subscribe(event: string, handler: EventHandler): void {
    this.on(event, handler);
  }

  unsubscribe(event: string, handler: EventHandler): void {
    this.removeListener(event, handler);
  }
}

export default EventBus.getInstance();
