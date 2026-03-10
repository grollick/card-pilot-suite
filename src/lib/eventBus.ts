// ── Lightweight cross-module event bus ──
// Allows modules to communicate without direct imports.
// Usage:
//   eventBus.emit("lead:created", { leadId: "abc" });
//   const unsub = eventBus.on("lead:created", (data) => { ... });
//   unsub(); // cleanup

type EventHandler<T = any> = (data: T) => void;

/** All known platform events. Extend this as modules grow. */
export interface EventMap {
  "lead:created": { leadId: string; source?: string };
  "lead:updated": { leadId: string };
  "booking:created": { bookingId: string; contactId?: string };
  "booking:completed": { bookingId: string };
  "job:created": { jobId: string };
  "job:completed": { jobId: string };
  "job:assigned": { jobId: string; userId: string };
  "estimate:created": { estimateId: string };
  "estimate:approved": { estimateId: string };
  "task:created": { taskId: string; leadId?: string };
  "review:added": { reviewId: string };
  "card:published": { cardId: string };
  "invoice:paid": { invoiceId: string };
  "automation:triggered": { ruleId: string; action: string };
}

type EventName = keyof EventMap;

class EventBus {
  private listeners = new Map<string, Set<EventHandler>>();

  /** Subscribe to an event. Returns an unsubscribe function. */
  on<K extends EventName>(event: K, handler: EventHandler<EventMap[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  /** Emit an event to all subscribers. */
  emit<K extends EventName>(event: K, data: EventMap[K]): void {
    this.listeners.get(event)?.forEach(handler => {
      try {
        handler(data);
      } catch (err) {
        console.error(`[EventBus] Error in handler for "${event}":`, err);
      }
    });
  }

  /** Remove all listeners (useful for testing). */
  clear(): void {
    this.listeners.clear();
  }
}

export const eventBus = new EventBus();
