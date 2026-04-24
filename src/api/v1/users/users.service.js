// src/api/v1/users/users.service.js
import { userRepository } from './users.repository.js';
import { cache } from '../../../infrastructure/cache/index.js';
import { AppError } from '../../../core/errors/handler.js';
import { eventEmitter, EVENTS } from '../../../core/events/emitter.js';

const CACHE_PREFIX = 'users';
const CACHE_TTL    = 300;

class UserService {
  async list(pagination) {
    const cacheKey = `${CACHE_PREFIX}:list:${JSON.stringify(pagination)}`;
    return cache.wrap(cacheKey, () => userRepository.findMany(pagination), CACHE_TTL);
  }

  async getById(id) {
    const cacheKey = `${CACHE_PREFIX}:${id}`;
    return cache.wrap(cacheKey, async () => {
      const user = await userRepository.findById(id);
      if (!user) throw AppError.notFound('User');
      return user;
    }, CACHE_TTL);
  }

  async update(id, data) {
    const user = await userRepository.findById(id);
    if (!user) throw AppError.notFound('User');

    const updated = await userRepository.update(id, data);
    await cache.del(`${CACHE_PREFIX}:${id}`);
    await eventEmitter.emitDomain(EVENTS.USER_UPDATED, updated);
    return updated;
  }

  async updateRole(id, role) {
    const user = await userRepository.findById(id);
    if (!user) throw AppError.notFound('User');

    const updated = await userRepository.update(id, { role });
    await cache.del(`${CACHE_PREFIX}:${id}`);
    return updated;
  }

  async delete(id) {
    const user = await userRepository.findById(id);
    if (!user) throw AppError.notFound('User');

    await userRepository.softDelete(id);
    await cache.del(`${CACHE_PREFIX}:${id}`);
    await eventEmitter.emitDomain(EVENTS.USER_DELETED, { id });
  }

  async restore(id) {
    const user = await userRepository.findById(id, true);
    if (!user) throw AppError.notFound('User');
    if (!user.deletedAt) throw AppError.badRequest('User is not deleted');

    const restored = await userRepository.restore(id);
    await cache.del(`${CACHE_PREFIX}:${id}`);
    return restored;
  }
}

export const userService = new UserService();
