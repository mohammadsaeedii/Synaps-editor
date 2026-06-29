/* =========================================================================
   synapse · engine · event bus
   Lightweight typed pub/sub for decoupled IDE modules.
   ========================================================================= */
import type { EngineEventMap, EngineEventType, EventHandler, Subscription } from "./types";

type HandlerEntry = { type: EngineEventType; handler: EventHandler<EngineEventType> };

export class EventBus {
  private handlers = new Set<HandlerEntry>();

  on<T extends EngineEventType>(type: T, handler: EventHandler<T>): Subscription {
    const entry = { type, handler: handler as EventHandler<EngineEventType> };
    this.handlers.add(entry);
    return { unsubscribe: () => this.handlers.delete(entry) };
  }

  once<T extends EngineEventType>(type: T, handler: EventHandler<T>): Subscription {
    const sub = this.on(type, (payload) => {
      sub.unsubscribe();
      handler(payload);
    });
    return sub;
  }

  emit<T extends EngineEventType>(type: T, payload: EngineEventMap[T]): void {
    for (const entry of this.handlers) {
      if (entry.type === type) {
        try {
          entry.handler(payload);
        } catch (err) {
          console.error(`[EventBus] handler error for ${type}:`, err);
        }
      }
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}

export const eventBus = new EventBus();
