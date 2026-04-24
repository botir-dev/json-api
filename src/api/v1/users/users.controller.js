// src/api/v1/users/users.controller.js
import { userService } from './users.service.js';
import { paginate } from '../../../core/middleware/query-parser.js';
import { AppError } from '../../../core/errors/handler.js';
import { z } from 'zod';

const updateUserZod = z.object({
  firstName: z.string().max(50).optional(),
  lastName:  z.string().max(50).optional(),
  avatarUrl: z.string().url().optional(),
});

const updateRoleZod = z.object({
  role: z.enum(['ADMIN', 'USER', 'MODERATOR']),
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

export const userController = {
  async list(request, reply) {
    const { page, limit } = request.pagination;
    const { data, total } = await userService.list(request.pagination);
    return reply.send(paginate(data, total, { page, limit }));
  },

  async getOne(request, reply) {
    const user = await userService.getById(request.params.id);
    return reply.send({ success: true, data: user });
  },

  async getMe(request, reply) {
    const user = await userService.getById(request.user.id);
    return reply.send({ success: true, data: user });
  },

  async updateMe(request, reply) {
    const data = validate(updateUserZod, request.body);
    const user = await userService.update(request.user.id, data);
    return reply.send({ success: true, data: user });
  },

  async update(request, reply) {
    const data = validate(updateUserZod, request.body);
    const user = await userService.update(request.params.id, data);
    return reply.send({ success: true, data: user });
  },

  async updateRole(request, reply) {
    const { role } = validate(updateRoleZod, request.body);
    const user = await userService.updateRole(request.params.id, role);
    return reply.send({ success: true, data: user });
  },

  async delete(request, reply) {
    // Prevent self-deletion
    if (request.params.id === request.user.id) {
      throw AppError.badRequest('Cannot delete your own account');
    }
    await userService.delete(request.params.id);
    return reply.send({ success: true, message: 'User deleted successfully' });
  },

  async restore(request, reply) {
    const user = await userService.restore(request.params.id);
    return reply.send({ success: true, data: user });
  },
};
