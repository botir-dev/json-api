// src/api/v1/orders/orders.controller.js
import { orderService } from './orders.service.js';
import { paginate } from '../../../core/middleware/query-parser.js';
import { createOrderZod, updateOrderStatusZod } from './orders.validators.js';
import { AppError } from '../../../core/errors/handler.js';

function validate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    throw AppError.badRequest('Validation failed', details);
  }
  return result.data;
}

export const orderController = {
  async list(request, reply) {
    const { page, limit } = request.pagination;
    const { id: userId, role } = request.user;

    const { data, total } = await orderService.list(userId, role, request.pagination);
    return reply.send(paginate(data, total, { page, limit }));
  },

  async getOne(request, reply) {
    const { id: userId, role } = request.user;
    const order = await orderService.getById(request.params.id, userId, role);
    return reply.send({ success: true, data: order });
  },

  async create(request, reply) {
    const data = validate(createOrderZod, request.body);
    const order = await orderService.create(request.user.id, data);
    return reply.status(201).send({ success: true, data: order });
  },

  async updateStatus(request, reply) {
    const { status } = validate(updateOrderStatusZod, request.body);
    const { id: userId, role } = request.user;
    const order = await orderService.updateStatus(request.params.id, status, userId, role);
    return reply.send({ success: true, data: order });
  },

  async markAsPaid(request, reply) {
    const order = await orderService.markAsPaid(request.params.id);
    return reply.send({ success: true, data: order });
  },

  async delete(request, reply) {
    await orderService.softDelete(request.params.id);
    return reply.send({ success: true, message: 'Order deleted successfully' });
  },
};
