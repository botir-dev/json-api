// src/api/v1/products/products.routes.js
import { productController } from './products.controller.js';
import { authenticate, authorize } from '../../../core/middleware/authenticate.js';
import { parseQuery } from '../../../core/middleware/query-parser.js';

export default async function productRoutes(app) {
  // Public routes
  app.get('/', {
    onRequest: [parseQuery],
    schema: {
      tags: ['Products'],
      summary: 'List all products',
      description: 'Paginated list with filtering, sorting, and full-text search',
      querystring: {
        type: 'object',
        properties: {
          page:       { type: 'integer', default: 1 },
          limit:      { type: 'integer', default: 20 },
          sortBy:     { type: 'string', enum: ['name', 'price', 'createdAt', 'stock'] },
          sortDir:    { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          search:     { type: 'string' },
          categoryId: { type: 'string', format: 'uuid' },
          minPrice:   { type: 'number' },
          maxPrice:   { type: 'number' },
          inStock:    { type: 'boolean' },
          featured:   { type: 'boolean' },
        },
      },
    },
  }, productController.list);

  app.get('/slug/:slug', {
    schema: {
      tags: ['Products'],
      summary: 'Get product by slug',
      params: { type: 'object', properties: { slug: { type: 'string' } }, required: ['slug'] },
    },
  }, productController.getBySlug);

  app.get('/:id', {
    schema: {
      tags: ['Products'],
      summary: 'Get product by ID',
      params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } }, required: ['id'] },
    },
  }, productController.getOne);

  // Admin-only routes
  app.post('/', {
    onRequest: [authenticate, authorize('ADMIN')],
    schema: {
      tags: ['Products'],
      summary: 'Create a new product',
      security: [{ bearerAuth: [] }],
    },
  }, productController.create);

  app.patch('/:id', {
    onRequest: [authenticate, authorize('ADMIN')],
    schema: {
      tags: ['Products'],
      summary: 'Update a product',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } }, required: ['id'] },
    },
  }, productController.update);

  app.delete('/:id', {
    onRequest: [authenticate, authorize('ADMIN')],
    schema: {
      tags: ['Products'],
      summary: 'Delete a product (soft by default)',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } }, required: ['id'] },
      querystring: {
        type: 'object',
        properties: { hard: { type: 'boolean', default: false } },
      },
    },
  }, productController.delete);

  app.post('/:id/restore', {
    onRequest: [authenticate, authorize('ADMIN')],
    schema: {
      tags: ['Products'],
      summary: 'Restore a soft-deleted product',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } }, required: ['id'] },
    },
  }, productController.restore);
}
