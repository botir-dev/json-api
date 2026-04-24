// src/api/v1/products/products.repository.js
import { prisma } from '../../../infrastructure/database/index.js';

class ProductRepository {
  /**
   * Find many products with full pagination, filtering, sorting, and search.
   */
  async findMany({ skip, take, orderBy, search, includeDeleted, filters = {} }) {
    const baseWhere = {
      ...(includeDeleted ? {} : { deletedAt: null }),
      ...filters,
    };

    const where = search
      ? {
          ...baseWhere,
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
            { tags: { has: search } },
          ],
        }
      : baseWhere;

    const [data, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id, includeDeleted = false) {
    return prisma.product.findFirst({
      where: { id, ...(includeDeleted ? {} : { deletedAt: null }) },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  async findBySlug(slug) {
    return prisma.product.findFirst({
      where: { slug, deletedAt: null },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  async create(data) {
    return prisma.product.create({
      data,
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  async update(id, data) {
    return prisma.product.update({
      where: { id },
      data,
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  /**
   * Soft delete - sets deletedAt timestamp.
   */
  async softDelete(id) {
    return prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  /**
   * Hard delete - permanently removes the record.
   */
  async hardDelete(id) {
    return prisma.product.delete({ where: { id } });
  }

  /**
   * Restore a soft-deleted product.
   */
  async restore(id) {
    return prisma.product.update({
      where: { id },
      data: { deletedAt: null, isActive: true },
    });
  }

  async decrementStock(id, quantity) {
    return prisma.product.update({
      where: { id },
      data: { stock: { decrement: quantity } },
    });
  }
}

export const productRepository = new ProductRepository();
