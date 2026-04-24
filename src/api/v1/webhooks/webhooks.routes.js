// src/api/v1/webhooks/webhooks.routes.js
import { webhookService } from './webhooks.service.js';
import { authenticate, authorize } from '../../../core/middleware/authenticate.js';
import { AppError } from '../../../core/errors/handler.js';
import { z } from 'zod';

const VALID_EVENTS = [
  'user.created', 'user.updated', 'user.deleted',
  'product.created', 'product.updated', 'product.deleted',
  'order.created', 'order.paid', 'order.shipped', 'order.delivered', 'order.cancelled',
];

const createWebhookZod = z.object({
  url:      z.string().url(),
  events:   z.array(z.enum(VALID_EVENTS)).min(1),
  isActive: z.boolean().default(true),
});

function validate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw AppError.badRequest('Validation failed',
      result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
    );
  }
  return result.data;
}

// Pre-built authorize('ADMIN') middleware
const requireAdmin = authorize('ADMIN');

export default async function webhookRoutes(app) {
  // All webhook routes require authentication + ADMIN role
  app.addHook('onRequest', authenticate);
  app.addHook('onRequest', requireAdmin);

  app.get('/', {
    schema: { tags: ['Webhooks'], summary: 'List all webhooks', security: [{ bearerAuth: [] }] },
  }, async (request, reply) => {
    const webhooks = await webhookService.list();
    // Never expose the secret in the response
    return reply.send({ success: true, data: webhooks.map(({ secret, ...w }) => w) });
  });

  app.post('/', {
    schema: {
      tags: ['Webhooks'],
      summary: 'Register a new webhook',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['url', 'events'],
        properties: {
          url:      { type: 'string', format: 'uri' },
          events:   { type: 'array', items: { type: 'string', enum: VALID_EVENTS } },
          isActive: { type: 'boolean', default: true },
        },
      },
    },
  }, async (request, reply) => {
    const data = validate(createWebhookZod, request.body);
    const webhook = await webhookService.create(data);
    const { secret, ...safe } = webhook;
    return reply.status(201).send({ success: true, data: safe });
  });

  app.patch('/:id', {
    schema: {
      tags: ['Webhooks'], summary: 'Update a webhook', security: [{ bearerAuth: [] }],
      params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } }, required: ['id'] },
    },
  }, async (request, reply) => {
    const data = validate(createWebhookZod.partial(), request.body);
    const webhook = await webhookService.update(request.params.id, data);
    const { secret, ...safe } = webhook;
    return reply.send({ success: true, data: safe });
  });

  app.delete('/:id', {
    schema: {
      tags: ['Webhooks'], summary: 'Delete a webhook', security: [{ bearerAuth: [] }],
      params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } }, required: ['id'] },
    },
  }, async (request, reply) => {
    await webhookService.delete(request.params.id);
    return reply.send({ success: true, message: 'Webhook deleted' });
  });

  // Expose valid event types
  app.get('/events', {
    schema: { tags: ['Webhooks'], summary: 'List available webhook events', security: [{ bearerAuth: [] }] },
  }, async (request, reply) => {
    return reply.send({ success: true, data: VALID_EVENTS });
  });
}
