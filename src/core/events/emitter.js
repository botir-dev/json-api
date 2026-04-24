// src/core/events/emitter.js
// YANGI (ishlaydi)
import EventEmitter2pkg from "eventemitter2";
const { EventEmitter2 } = EventEmitter2pkg;
import { logger } from "../../infrastructure/logger/index.js";
import { webhookService } from "../../api/v1/webhooks/webhooks.service.js";

class DomainEventEmitter extends EventEmitter2 {
  constructor() {
    super({
      wildcard: true,
      delimiter: ".",
      newListener: false,
      maxListeners: 50,
      verboseMemoryLeak: true,
    });

    this._setupInternalListeners();
  }

  /**
   * Emit a domain event and forward to registered webhooks.
   */
  async emitDomain(eventName, payload) {
    logger.debug({ event: eventName, payload }, "Domain event emitted");

    // Emit locally for in-process listeners
    this.emit(eventName, {
      event: eventName,
      payload,
      timestamp: new Date().toISOString(),
    });

    // Forward to webhooks (non-blocking)
    this._dispatchWebhooks(eventName, payload).catch((err) =>
      logger.error({ err, eventName }, "Webhook dispatch failed"),
    );
  }

  async _dispatchWebhooks(eventName, payload) {
    try {
      await webhookService.dispatch(eventName, payload);
    } catch (err) {
      logger.warn({ err }, "Webhook dispatch error (non-critical)");
    }
  }

  _setupInternalListeners() {
    this.on("user.created", ({ payload }) => {
      logger.info(
        { userId: payload?.id },
        "📧 [Event] User created - send welcome email",
      );
    });

    this.on("order.paid", ({ payload }) => {
      logger.info(
        { orderId: payload?.id },
        "📦 [Event] Order paid - trigger fulfillment",
      );
    });

    this.on("order.cancelled", ({ payload }) => {
      logger.info(
        { orderId: payload?.id },
        "🔄 [Event] Order cancelled - process refund",
      );
    });

    this.on("user.password_changed", ({ payload }) => {
      logger.info(
        { userId: payload?.id },
        "🔐 [Event] Password changed - notify user",
      );
    });
  }
}

export const eventEmitter = new DomainEventEmitter();

// ─── Event Name Constants ─────────────────────────────────────────

export const EVENTS = {
  // User events
  USER_CREATED: "user.created",
  USER_UPDATED: "user.updated",
  USER_DELETED: "user.deleted",
  USER_LOGIN: "user.login",
  USER_PASSWORD_CHANGED: "user.password_changed",

  // Product events
  PRODUCT_CREATED: "product.created",
  PRODUCT_UPDATED: "product.updated",
  PRODUCT_DELETED: "product.deleted",
  PRODUCT_OUT_OF_STOCK: "product.out_of_stock",

  // Order events
  ORDER_CREATED: "order.created",
  ORDER_PAID: "order.paid",
  ORDER_SHIPPED: "order.shipped",
  ORDER_DELIVERED: "order.delivered",
  ORDER_CANCELLED: "order.cancelled",
};
