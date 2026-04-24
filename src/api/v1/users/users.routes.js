// src/api/v1/users/users.routes.js
import { userController } from './users.controller.js';
import { authenticate, authorize } from '../../../core/middleware/authenticate.js';
import { parseQuery } from '../../../core/middleware/query-parser.js';

export default async function userRoutes(app) {
  app.addHook('onRequest', authenticate);

  // Current user profile
  app.get('/me', {
    schema: { tags: ['Users'], summary: 'Get my profile', security: [{ bearerAuth: [] }] },
  }, userController.getMe);

  app.patch('/me', {
    schema: { tags: ['Users'], summary: 'Update my profile', security: [{ bearerAuth: [] }] },
  }, userController.updateMe);

  // Admin: user management
  app.get('/', {
    onRequest: [authorize('ADMIN')],
    preHandler: [parseQuery],
    schema: {
      tags: ['Users'],
      summary: 'List all users (admin only)',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page:    { type: 'integer', default: 1 },
          limit:   { type: 'integer', default: 20 },
          sortBy:  { type: 'string', enum: ['email', 'username', 'createdAt', 'role'] },
          sortDir: { type: 'string', enum: ['asc', 'desc'] },
          search:  { type: 'string' },
          deleted: { type: 'boolean' },
        },
      },
    },
  }, userController.list);

  app.get('/:id', {
    onRequest: [authorize('ADMIN')],
    schema: {
      tags: ['Users'], summary: 'Get user by ID (admin only)',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } }, required: ['id'] },
    },
  }, userController.getOne);

  app.patch('/:id', {
    onRequest: [authorize('ADMIN')],
    schema: { tags: ['Users'], summary: 'Update user (admin only)', security: [{ bearerAuth: [] }] },
  }, userController.update);

  app.patch('/:id/role', {
    onRequest: [authorize('ADMIN')],
    schema: { tags: ['Users'], summary: 'Update user role (admin only)', security: [{ bearerAuth: [] }] },
  }, userController.updateRole);

  app.delete('/:id', {
    onRequest: [authorize('ADMIN')],
    schema: { tags: ['Users'], summary: 'Soft delete user (admin only)', security: [{ bearerAuth: [] }] },
  }, userController.delete);

  app.post('/:id/restore', {
    onRequest: [authorize('ADMIN')],
    schema: { tags: ['Users'], summary: 'Restore deleted user (admin only)', security: [{ bearerAuth: [] }] },
  }, userController.restore);
}
