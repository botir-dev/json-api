// src/core/middleware/mock-mode.js
/**
 * Mock mode middleware.
 *
 * When MOCK_MODE=true, routes decorated with `{ mock: <data> }` in their
 * schema will return the mock data immediately — no DB or cache hit.
 *
 * Useful for: frontend development without a real backend,
 *             load testing with predictable payloads,
 *             demo environments.
 *
 * Usage in a route:
 *   app.get('/products', {
 *     config: { mock: { data: [...], meta: { total: 3, page: 1 } } },
 *   }, productController.list);
 */

import { faker } from '@faker-js/faker';

const MOCK_DELAY_MS = parseInt(process.env.MOCK_DELAY_MS || '0', 10);

export const isMockMode = process.env.MOCK_MODE === 'true';

/**
 * Global Fastify hook — intercepts requests in mock mode and returns
 * the route's `config.mock` payload (or a generated one).
 */
export async function mockModeHook(request, reply) {
  if (!isMockMode) return;

  const mock = request.routeOptions?.config?.mock;
  if (!mock) return;

  if (MOCK_DELAY_MS > 0) {
    await new Promise((r) => setTimeout(r, MOCK_DELAY_MS));
  }

  request.log.debug({ path: request.url }, '[MOCK] Returning mock response');

  return reply.send({ success: true, ...mock });
}

// ─── Pre-built mock factories ──────────────────────────────────────

export const mockFactories = {
  user: () => ({
    id:              faker.string.uuid(),
    email:           faker.internet.email(),
    username:        faker.internet.username(),
    firstName:       faker.person.firstName(),
    lastName:        faker.person.lastName(),
    role:            'USER',
    isActive:        true,
    isEmailVerified: true,
    avatarUrl:       faker.image.avatar(),
    createdAt:       faker.date.past().toISOString(),
    updatedAt:       faker.date.recent().toISOString(),
  }),

  product: () => {
    const price = parseFloat(faker.commerce.price({ min: 10, max: 999 }));
    return {
      id:           faker.string.uuid(),
      name:         `${faker.commerce.productAdjective()} ${faker.commerce.product()}`,
      slug:         faker.helpers.slugify(faker.commerce.productName()).toLowerCase(),
      description:  faker.commerce.productDescription(),
      price:        price.toFixed(2),
      comparePrice: (price * 1.25).toFixed(2),
      stock:        faker.number.int({ min: 0, max: 200 }),
      sku:          `SKU-${faker.string.alphanumeric(8).toUpperCase()}`,
      imageUrls:    [faker.image.url()],
      tags:         faker.helpers.arrayElements(['sale', 'new', 'popular', 'trending'], 2),
      isActive:     true,
      isFeatured:   false,
      category:     { id: faker.string.uuid(), name: 'Electronics', slug: 'electronics' },
      createdAt:    faker.date.past().toISOString(),
    };
  },

  order: () => {
    const subtotal = parseFloat(faker.commerce.price({ min: 20, max: 500 }));
    const tax      = parseFloat((subtotal * 0.1).toFixed(2));
    const shipping = subtotal > 100 ? 0 : 9.99;
    return {
      id:          faker.string.uuid(),
      orderNumber: `ORD-${faker.string.alphanumeric(8).toUpperCase()}`,
      status:      faker.helpers.arrayElement(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED']),
      subtotal:    subtotal.toFixed(2),
      tax:         tax.toFixed(2),
      shippingCost: shipping.toFixed(2),
      total:       (subtotal + tax + shipping).toFixed(2),
      createdAt:   faker.date.recent().toISOString(),
      items:       [
        {
          id:         faker.string.uuid(),
          productId:  faker.string.uuid(),
          quantity:   faker.number.int({ min: 1, max: 5 }),
          unitPrice:  faker.commerce.price({ min: 10, max: 300 }),
          totalPrice: faker.commerce.price({ min: 10, max: 900 }),
        },
      ],
    };
  },

  paginatedList: (factory, count = 5) => ({
    data: Array.from({ length: count }, factory),
    meta: {
      total:       count * 3,
      page:        1,
      limit:       count,
      totalPages:  3,
      hasNextPage: true,
      hasPrevPage: false,
    },
  }),
};
