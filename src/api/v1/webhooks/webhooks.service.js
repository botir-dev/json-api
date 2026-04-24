// src/api/v1/webhooks/webhooks.service.js
import { createHmac, randomBytes } from 'crypto';
import axios from 'axios';
import { prisma } from '../../../infrastructure/database/index.js';
import { AppError } from '../../../core/errors/handler.js';
import { logger } from '../../../infrastructure/logger/index.js';

class WebhookService {
  async list() {
    return prisma.webhook.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async create(data) {
    const secret = randomBytes(32).toString('hex');
    return prisma.webhook.create({
      data: { ...data, secret },
    });
  }

  async update(id, data) {
    const webhook = await prisma.webhook.findUnique({ where: { id } });
    if (!webhook) throw AppError.notFound('Webhook');
    return prisma.webhook.update({ where: { id }, data });
  }

  async delete(id) {
    const webhook = await prisma.webhook.findUnique({ where: { id } });
    if (!webhook) throw AppError.notFound('Webhook');
    await prisma.webhook.delete({ where: { id } });
  }

  /**
   * Dispatch an event to all subscribed, active webhooks.
   * Signs each payload with HMAC-SHA256 using the webhook's secret.
   */
  async dispatch(eventName, payload) {
    const webhooks = await prisma.webhook.findMany({
      where: {
        isActive: true,
        events: { has: eventName },
        failCount: { lt: 5 }, // skip webhooks that have failed too many times
      },
    });

    if (!webhooks.length) return;

    const body = JSON.stringify({
      event:     eventName,
      payload,
      timestamp: new Date().toISOString(),
    });

    await Promise.allSettled(
      webhooks.map((webhook) => this._deliverWebhook(webhook, eventName, body))
    );
  }

  async _deliverWebhook(webhook, eventName, body) {
    const signature = this._sign(body, webhook.secret);

    try {
      await axios.post(webhook.url, body, {
        timeout: 5000,
        headers: {
          'Content-Type':        'application/json',
          'X-Webhook-Event':     eventName,
          'X-Webhook-Signature': signature,
          'X-Webhook-Timestamp': Date.now().toString(),
        },
      });

      await prisma.webhook.update({
        where: { id: webhook.id },
        data: { lastCalledAt: new Date(), failCount: 0 },
      });

      logger.debug({ webhookId: webhook.id, event: eventName }, 'Webhook delivered');
    } catch (err) {
      logger.warn({ webhookId: webhook.id, event: eventName, err: err.message }, 'Webhook delivery failed');

      await prisma.webhook.update({
        where: { id: webhook.id },
        data: {
          failCount:   { increment: 1 },
          lastCalledAt: new Date(),
          ...(webhook.failCount + 1 >= 5 && { isActive: false }),
        },
      });
    }
  }

  _sign(body, secret) {
    return `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
  }
}

export const webhookService = new WebhookService();
