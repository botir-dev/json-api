// src/api/v1/products/products.controller.js
import { productService } from './products.service.js';
import { paginate } from '../../../core/middleware/query-parser.js';
import { createProductZod, updateProductZod } from './products.validators.js';
import { AppError } from '../../../core/errors/handler.js';

function validate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    throw AppError.badRequest('Validation failed', details);
  }
  return result.data;
}

export const productController = {
  async list(request, reply) {
    const { page, limit } = request.pagination;

    // Extra filters from query string
    request.pagination.filters = {
      categoryId:  request.query.categoryId,
      minPrice:    request.query.minPrice ? parseFloat(request.query.minPrice) : undefined,
      maxPrice:    request.query.maxPrice ? parseFloat(request.query.maxPrice) : undefined,
      inStock:     request.query.inStock === 'true',
      isFeatured:  request.query.featured === 'true' ? true : undefined,
    };

    const { data, total } = await productService.list(request.pagination);
    return reply.send(paginate(data, total, { page, limit }));
  },

  async getOne(request, reply) {
    const product = await productService.getById(request.params.id);
    return reply.send({ success: true, data: product });
  },

  async getBySlug(request, reply) {
    const product = await productService.getBySlug(request.params.slug);
    return reply.send({ success: true, data: product });
  },

  async create(request, reply) {
    const data = validate(createProductZod, request.body);
    const product = await productService.create(data);
    return reply.status(201).send({ success: true, data: product });
  },

  async update(request, reply) {
    const data = validate(updateProductZod, request.body);
    const product = await productService.update(request.params.id, data);
    return reply.send({ success: true, data: product });
  },

  async delete(request, reply) {
    const hard = request.query.hard === 'true';
    await productService.delete(request.params.id, hard);
    return reply.send({ success: true, message: 'Product deleted successfully' });
  },

  async restore(request, reply) {
    const product = await productService.restore(request.params.id);
    return reply.send({ success: true, data: product });
  },
};
