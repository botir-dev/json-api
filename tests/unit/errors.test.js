// tests/unit/errors.test.js
import { describe, it, expect } from '@jest/globals';
import { AppError } from '../../src/core/errors/handler.js';

describe('AppError', () => {
  it('creates a 400 BAD_REQUEST error', () => {
    const err = AppError.badRequest('Invalid input', [{ field: 'email', message: 'Required' }]);
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('BAD_REQUEST');
    expect(err.details).toHaveLength(1);
  });

  it('creates a 401 UNAUTHORIZED error', () => {
    const err = AppError.unauthorized();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
    expect(err.message).toBe('Unauthorized');
  });

  it('creates a 403 FORBIDDEN error', () => {
    const err = AppError.forbidden('Admins only');
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe('Admins only');
  });

  it('creates a 404 NOT_FOUND error with resource name', () => {
    const err = AppError.notFound('Product');
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('Product not found');
  });

  it('creates a 409 CONFLICT error', () => {
    const err = AppError.conflict('Email already exists');
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('CONFLICT');
  });

  it('creates a 500 INTERNAL_ERROR', () => {
    const err = AppError.internal();
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('INTERNAL_ERROR');
  });

  it('is an instance of Error', () => {
    const err = AppError.notFound('User');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });
});
