// tests/unit/products.service.test.js
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock dependencies
jest.mock('../../src/infrastructure/database/index.js', () => ({
  prisma: {
    product: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create:   jest.fn(),
      update:   jest.fn(),
      delete:   jest.fn(),
      count:    jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('../../src/infrastructure/cache/index.js', () => ({
  cache: {
    get:        jest.fn().mockResolvedValue(null),
    set:        jest.fn().mockResolvedValue(undefined),
    getJson:    jest.fn().mockResolvedValue(null),
    setJson:    jest.fn().mockResolvedValue(undefined),
    del:        jest.fn().mockResolvedValue(undefined),
    delPattern: jest.fn().mockResolvedValue(undefined),
    wrap:       jest.fn().mockImplementation(async (key, fetcher) => fetcher()),
  },
}));

jest.mock('../../src/core/events/emitter.js', () => ({
  eventEmitter: { emitDomain: jest.fn().mockResolvedValue(undefined) },
  EVENTS: {
    PRODUCT_CREATED: 'product.created',
    PRODUCT_UPDATED: 'product.updated',
    PRODUCT_DELETED: 'product.deleted',
  },
}));

import { productRepository } from '../../src/api/v1/products/products.repository.js';
import { AppError } from '../../src/core/errors/handler.js';

// Mock the repository directly
jest.mock('../../src/api/v1/products/products.repository.js', () => ({
  productRepository: {
    findMany:   jest.fn(),
    findById:   jest.fn(),
    findBySlug: jest.fn(),
    create:     jest.fn(),
    update:     jest.fn(),
    softDelete: jest.fn(),
    hardDelete: jest.fn(),
    restore:    jest.fn(),
  },
}));

const { productService } = await import('../../src/api/v1/products/products.service.js');

const mockProduct = {
  id:          'prod-uuid-1',
  name:        'Test Laptop',
  slug:        'test-laptop',
  description: 'A great laptop',
  price:       999.00,
  stock:       50,
  isActive:    true,
  deletedAt:   null,
  category:    { id: 'cat-1', name: 'Electronics', slug: 'electronics' },
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ProductService.getById', () => {
  it('returns a product when found', async () => {
    productRepository.findById.mockResolvedValue(mockProduct);
    const result = await productService.getById('prod-uuid-1');
    expect(result).toEqual(mockProduct);
    expect(productRepository.findById).toHaveBeenCalledWith('prod-uuid-1');
  });

  it('throws AppError.notFound when product does not exist', async () => {
    productRepository.findById.mockResolvedValue(null);
    await expect(productService.getById('nonexistent'))
      .rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' });
  });
});

describe('ProductService.create', () => {
  it('creates a product with a generated slug', async () => {
    productRepository.findBySlug.mockResolvedValue(null); // slug is unique
    productRepository.create.mockResolvedValue({ ...mockProduct, id: 'new-uuid' });

    const result = await productService.create({
      name:  'Test Laptop',
      price: 999,
      stock: 50,
    });

    expect(productRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'test-laptop', price: 999 })
    );
    expect(result.id).toBe('new-uuid');
  });

  it('generates a unique slug when base slug is already taken', async () => {
    // First call: slug taken; second call: free
    productRepository.findBySlug
      .mockResolvedValueOnce(mockProduct)  // 'test-laptop' taken
      .mockResolvedValueOnce(null);        // 'test-laptop-1' free

    productRepository.create.mockResolvedValue({ ...mockProduct, slug: 'test-laptop-1' });

    await productService.create({ name: 'Test Laptop', price: 100, stock: 10 });

    expect(productRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'test-laptop-1' })
    );
  });
});

describe('ProductService.delete', () => {
  it('soft-deletes by default', async () => {
    productRepository.findById.mockResolvedValue(mockProduct);
    productRepository.softDelete.mockResolvedValue({ ...mockProduct, deletedAt: new Date() });

    await productService.delete('prod-uuid-1', false);

    expect(productRepository.softDelete).toHaveBeenCalledWith('prod-uuid-1');
    expect(productRepository.hardDelete).not.toHaveBeenCalled();
  });

  it('hard-deletes when hard=true', async () => {
    productRepository.findById.mockResolvedValue(mockProduct);
    productRepository.hardDelete.mockResolvedValue(mockProduct);

    await productService.delete('prod-uuid-1', true);

    expect(productRepository.hardDelete).toHaveBeenCalledWith('prod-uuid-1');
    expect(productRepository.softDelete).not.toHaveBeenCalled();
  });

  it('throws 404 when product does not exist', async () => {
    productRepository.findById.mockResolvedValue(null);

    await expect(productService.delete('bad-id'))
      .rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('ProductService.restore', () => {
  it('restores a soft-deleted product', async () => {
    const deleted = { ...mockProduct, deletedAt: new Date() };
    productRepository.findById.mockResolvedValue(deleted);
    productRepository.restore.mockResolvedValue({ ...mockProduct, deletedAt: null });

    const result = await productService.restore('prod-uuid-1');
    expect(result.deletedAt).toBeNull();
  });

  it('throws 400 when product is not deleted', async () => {
    productRepository.findById.mockResolvedValue(mockProduct); // deletedAt: null

    await expect(productService.restore('prod-uuid-1'))
      .rejects.toMatchObject({ statusCode: 400 });
  });
});
