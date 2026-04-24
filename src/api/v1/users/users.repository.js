// src/api/v1/users/users.repository.js
import { prisma } from '../../../infrastructure/database/index.js';

class UserRepository {
  async findMany({ skip, take, orderBy, search, includeDeleted }) {
    const where = {
      ...(includeDeleted ? {} : { deletedAt: null }),
      ...(search && {
        OR: [
          { email:     { contains: search, mode: 'insensitive' } },
          { username:  { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName:  { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy,
        select: this._safeSelect(),
      }),
      prisma.user.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id, includeDeleted = false) {
    return prisma.user.findFirst({
      where: { id, ...(includeDeleted ? {} : { deletedAt: null }) },
      select: this._safeSelect(),
    });
  }

  async findByEmail(email) {
    return prisma.user.findFirst({ where: { email, deletedAt: null } });
  }

  async update(id, data) {
    return prisma.user.update({
      where: { id },
      data,
      select: this._safeSelect(),
    });
  }

  async softDelete(id) {
    return prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async restore(id) {
    return prisma.user.update({
      where: { id },
      data: { deletedAt: null, isActive: true },
    });
  }

  _safeSelect() {
    return {
      id: true, email: true, username: true, firstName: true, lastName: true,
      role: true, isActive: true, isEmailVerified: true, avatarUrl: true,
      lastLoginAt: true, createdAt: true, updatedAt: true, deletedAt: true,
    };
  }
}

export const userRepository = new UserRepository();
