// src/api/v1/products/products.service.js
import slugify from '../../../shared/utils/slugify.js';
import { productRepository } from './products.repository.js';
import { cache } from '../../../infrastructure/cache/index.js';
import { AppError } from '../../../core/errors/handler.js';
import { eventEmitter, EVENTS } from '../../../core/events/emitter.js';
import { logger } from '../../../infrastructure/logger/index.js';

const CACHE_PREFIX = 'products';
const CACHE_TTL    = 300; // 5 minutes

class ProductService {
  async list(pagination) {
    const { page, limit, skip, take, orderBy, search, includeDeleted } = pagination;
    const { categoryId, minPrice, maxPrice, inStock, isFeatured } = pagination.filters || {};

    // Build dynamic filter object
    const filters = {
      ...(categoryId  && { categoryId }),
      ...(isFeatured !== undefined && { isFeatured }),
      ...(inStock     && { stock: { gt: 0 } }),
      ...(minPrice !== undefined || maxPrice !== undefined
        ? { price: { gte: minPrice, lte: maxPrice } }
        : {}),
    };

    // Cache key includes all relevant params
    const cacheKey = `${CACHE_PREFIX}:list:${JSON.stringify({ skip, take, orderBy, search, includeDeleted, filters })}`;

    return cache.wrap(cacheKey, () =>
      productRepository.findMany({ skip, take, orderBy, search, includeDeleted, filters }),
      CACHE_TTL
    );
  }

  async getById(id) {
    const cacheKey = `${CACHE_PREFIX}:${id}`;
    const cached = await cache.getJson(cacheKey);
    if (cached) return cached;

    const product = await productRepository.findById(id);
    if (!product) throw AppError.notFound('Product');

    await cache.setJson(cacheKey, product, CACHE_TTL);
    return product;
  }

  async getBySlug(slug) {
    const cacheKey = `${CACHE_PREFIX}:slug:${slug}`;
    return cache.wrap(cacheKey, async () => {
      const product = await productRepository.findBySlug(slug);
      if (!product) throw AppError.notFound('Product');
      return product;
    }, CACHE_TTL);
  }

  async create(data) {
    const slug = await this._uniqueSlug(data.name);

    const product = await productRepository.create({
      ...data,
      slug,
      price: parseFloat(data.price),
      comparePrice: data.comparePrice ? parseFloat(data.comparePrice) : null,
    });

    await this._invalidateListCache();
    await eventEmitter.emitDomain(EVENTS.PRODUCT_CREATED, product);
    logger.info({ productId: product.id }, 'Product created');
    return product;
  }

  async update(id, data) {
    const existing = await productRepository.findById(id);
    if (!existing) throw AppError.notFound('Product');

    // Re-slug only if name changed
    const slug = data.name && data.name !== existing.name
      ? await this._uniqueSlug(data.name, id)
      : existing.slug;

    const product = await productRepository.update(id, {
      ...data,
      slug,
      ...(data.price       && { price: parseFloat(data.price) }),
      ...(data.comparePrice && { comparePrice: parseFloat(data.comparePrice) }),
    });

    await this._invalidateProductCache(id, existing.slug);
    await eventEmitter.emitDomain(EVENTS.PRODUCT_UPDATED, product);
    return product;
  }

  async delete(id, hard = false) {
    const existing = await productRepository.findById(id, true);
    if (!existing) throw AppError.notFound('Product');

    if (hard) {
      await productRepository.hardDelete(id);
    } else {
      await productRepository.softDelete(id);
    }

    await this._invalidateProductCache(id, existing.slug);
    await eventEmitter.emitDomain(EVENTS.PRODUCT_DELETED, { id });
  }

  async restore(id) {
    const existing = await productRepository.findById(id, true);
    if (!existing) throw AppError.notFound('Product');
    if (!existing.deletedAt) throw AppError.badRequest('Product is not deleted');

    const product = await productRepository.restore(id);
    await this._invalidateListCache();
    return product;
  }

  // ─── Private ──────────────────────────────────────────────────────

  async _uniqueSlug(name, excludeId = null) {
    let base = slugify(name);
    let slug = base;
    let counter = 1;

    while (true) {
      const existing = await productRepository.findBySlug(slug);
      if (!existing || existing.id === excludeId) break;
      slug = `${base}-${counter++}`;
    }

    return slug;
  }

  async _invalidateProductCache(id, slug) {
    await Promise.all([
      cache.del(`${CACHE_PREFIX}:${id}`),
      cache.del(`${CACHE_PREFIX}:slug:${slug}`),
      this._invalidateListCache(),
    ]);
  }

  async _invalidateListCache() {
    await cache.delPattern(`${CACHE_PREFIX}:list:*`);
  }
}

export const productService = new ProductService();
