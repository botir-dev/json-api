// src/api/v1/orders/orders.service.js
import { prisma } from '../../../infrastructure/database/index.js';
import { cache } from '../../../infrastructure/cache/index.js';
import { AppError } from '../../../core/errors/handler.js';
import { eventEmitter, EVENTS } from '../../../core/events/emitter.js';
import { logger } from '../../../infrastructure/logger/index.js';

const CACHE_PREFIX = 'orders';

class OrderService {
  async list(userId, role, pagination) {
    const { skip, take, orderBy, search, includeDeleted } = pagination;

    // Users can only see their own orders; admins see all
    const where = {
      ...(role !== 'ADMIN' && { userId }),
      ...(includeDeleted ? {} : { deletedAt: null }),
      ...(search && {
        OR: [
          { orderNumber: { contains: search, mode: 'insensitive' } },
          { status: { equals: search.toUpperCase() } },
        ],
      }),
    };

    const [data, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          items: {
            include: { product: { select: { id: true, name: true, slug: true, imageUrls: true } } },
          },
          user: { select: { id: true, email: true, username: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return { data, total };
  }

  async getById(id, userId, role) {
    const cacheKey = `${CACHE_PREFIX}:${id}`;
    let order = await cache.getJson(cacheKey);

    if (!order) {
      order = await prisma.order.findFirst({
        where: { id, deletedAt: null },
        include: {
          items: {
            include: { product: { select: { id: true, name: true, slug: true, imageUrls: true, price: true } } },
          },
          user: { select: { id: true, email: true, username: true } },
        },
      });

      if (!order) throw AppError.notFound('Order');
      await cache.setJson(cacheKey, order, 60);
    }

    // Authorization: users can only see their own orders
    if (role !== 'ADMIN' && order.userId !== userId) {
      throw AppError.forbidden('You do not have access to this order');
    }

    return order;
  }

  async create(userId, data) {
    const { items, shippingAddress, billingAddress, notes } = data;

    if (!items?.length) throw AppError.badRequest('Order must contain at least one item');

    // Fetch all products and validate stock in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const productIds = items.map((i) => i.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, deletedAt: null, isActive: true },
      });

      // Validate all products exist
      const productMap = new Map(products.map((p) => [p.id, p]));
      for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product) throw AppError.badRequest(`Product ${item.productId} not found or inactive`);
        if (product.stock < item.quantity) {
          throw AppError.unprocessable(
            `Insufficient stock for "${product.name}". Available: ${product.stock}`
          );
        }
      }

      // Calculate totals
      let subtotal = 0;
      const orderItems = items.map((item) => {
        const product = productMap.get(item.productId);
        const unitPrice = parseFloat(product.price);
        const totalPrice = unitPrice * item.quantity;
        subtotal += totalPrice;
        return {
          productId: item.productId,
          quantity:  item.quantity,
          unitPrice,
          totalPrice,
        };
      });

      const tax          = parseFloat((subtotal * 0.1).toFixed(2)); // 10% tax
      const shippingCost = subtotal > 100 ? 0 : 9.99;              // Free shipping over $100
      const total        = subtotal + tax + shippingCost;

      // Decrement stock atomically
      await Promise.all(
        items.map((item) =>
          tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          })
        )
      );

      // Create order + items
      const order = await tx.order.create({
        data: {
          orderNumber:    this._generateOrderNumber(),
          userId,
          subtotal,
          tax,
          shippingCost,
          total,
          notes,
          shippingAddress,
          billingAddress,
          items:          { create: orderItems },
        },
        include: {
          items: { include: { product: { select: { id: true, name: true } } } },
        },
      });

      return order;
    });

    await eventEmitter.emitDomain(EVENTS.ORDER_CREATED, result);
    logger.info({ orderId: result.id, userId }, 'Order created');
    return result;
  }

  async updateStatus(id, status, userId, role) {
    const order = await this.getById(id, userId, role);

    // State machine validation
    const validTransitions = {
      PENDING:    ['PROCESSING', 'CANCELLED'],
      PROCESSING: ['SHIPPED', 'CANCELLED'],
      SHIPPED:    ['DELIVERED'],
      DELIVERED:  [],
      CANCELLED:  [],
      REFUNDED:   [],
    };

    if (!validTransitions[order.status]?.includes(status)) {
      throw AppError.unprocessable(
        `Cannot transition from ${order.status} to ${status}. Valid transitions: ${validTransitions[order.status]?.join(', ') || 'none'}`
      );
    }

    const timestamps = {
      PROCESSING: {},
      SHIPPED:    { shippedAt:   new Date() },
      DELIVERED:  { deliveredAt: new Date() },
      CANCELLED:  { cancelledAt: new Date() },
    };

    const updated = await prisma.order.update({
      where: { id },
      data:  { status, ...timestamps[status] },
      include: { items: true },
    });

    await cache.del(`${CACHE_PREFIX}:${id}`);

    // Emit appropriate event
    const eventMap = {
      SHIPPED:   EVENTS.ORDER_SHIPPED,
      DELIVERED: EVENTS.ORDER_DELIVERED,
      CANCELLED: EVENTS.ORDER_CANCELLED,
    };
    if (eventMap[status]) {
      await eventEmitter.emitDomain(eventMap[status], updated);
    }

    return updated;
  }

  async markAsPaid(id) {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw AppError.notFound('Order');
    if (order.paidAt) throw AppError.badRequest('Order already marked as paid');

    const updated = await prisma.order.update({
      where: { id },
      data:  { paidAt: new Date(), status: 'PROCESSING' },
    });

    await cache.del(`${CACHE_PREFIX}:${id}`);
    await eventEmitter.emitDomain(EVENTS.ORDER_PAID, updated);
    return updated;
  }

  async softDelete(id) {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw AppError.notFound('Order');

    await prisma.order.update({ where: { id }, data: { deletedAt: new Date() } });
    await cache.del(`${CACHE_PREFIX}:${id}`);
  }

  _generateOrderNumber() {
    const ts   = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${ts}-${rand}`;
  }
}

export const orderService = new OrderService();
