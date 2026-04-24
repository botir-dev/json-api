// src/api/v1/orders/orders.routes.js
import { orderController } from './orders.controller.js';
import { authenticate, authorize } from '../../../core/middleware/authenticate.js';
import { parseQuery } from '../../../core/middleware/query-parser.js';

export default async function orderRoutes(app) {
  // All order routes require authentication
  app.addHook('onRequest', authenticate);

  app.get('/', {
    onRequest: [parseQuery],
    schema: {
      tags: ['Orders'],
      summary: 'List orders (own orders for users, all for admins)',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page:    { type: 'integer', default: 1 },
          limit:   { type: 'integer', default: 20 },
          sortBy:  { type: 'string', enum: ['createdAt', 'total', 'status'] },
          sortDir: { type: 'string', enum: ['asc', 'desc'] },
          search:  { type: 'string' },
        },
      },
    },
  }, orderController.list);

  app.get('/:id', {
    schema: {
      tags: ['Orders'],
      summary: 'Get order by ID',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } }, required: ['id'] },
    },
  }, orderController.getOne);

  app.post('/', {
    schema: {
      tags: ['Orders'],
      summary: 'Create a new order',
      security: [{ bearerAuth: [] }],
    },
  }, orderController.create);

  app.patch('/:id/status', {
    onRequest: [authorize('ADMIN')],
    schema: {
      tags: ['Orders'],
      summary: 'Update order status (admin only)',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } }, required: ['id'] },
    },
  }, orderController.updateStatus);

  app.post('/:id/pay', {
    onRequest: [authorize('ADMIN')],
    schema: {
      tags: ['Orders'],
      summary: 'Mark order as paid (admin/payment gateway)',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } }, required: ['id'] },
    },
  }, orderController.markAsPaid);

  app.delete('/:id', {
    onRequest: [authorize('ADMIN')],
    schema: {
      tags: ['Orders'],
      summary: 'Soft delete an order (admin only)',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } }, required: ['id'] },
    },
  }, orderController.delete);
}
