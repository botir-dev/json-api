// src/core/middleware/authenticate.js
import { AppError } from '../errors/handler.js';
import { prisma } from '../../infrastructure/database/index.js';
import { cache } from '../../infrastructure/cache/index.js';

/**
 * Authenticates via JWT Bearer token or X-API-Key header.
 * Attaches `request.user` with { id, email, role }.
 */
export async function authenticate(request, reply) {
  try {
    const apiKey = request.headers['x-api-key'];

    if (apiKey && process.env.ENABLE_API_KEYS !== 'false') {
      return await authenticateWithApiKey(request, apiKey);
    }

    await request.jwtVerify();

    // Check cache for user session invalidation
    const cacheKey = `user:${request.user.id}:session`;
    const invalidated = await cache.get(cacheKey);
    if (invalidated === 'invalidated') {
      throw AppError.unauthorized('Session has been invalidated');
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw AppError.unauthorized('Invalid or expired token');
  }
}

async function authenticateWithApiKey(request, key) {
  const cacheKey = `apikey:${key}`;
  let apiKeyRecord = await cache.getJson(cacheKey);

  if (!apiKeyRecord) {
    apiKeyRecord = await prisma.apiKey.findUnique({
      where: { key, isActive: true },
      include: { user: { select: { id: true, email: true, role: true, isActive: true } } },
    });

    if (!apiKeyRecord) throw AppError.unauthorized('Invalid API key');
    if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
      throw AppError.unauthorized('API key has expired');
    }

    await cache.setJson(cacheKey, apiKeyRecord, 300); // cache 5 min
  }

  if (!apiKeyRecord.user.isActive) {
    throw AppError.forbidden('Account is deactivated');
  }

  // Update last used (fire-and-forget)
  prisma.apiKey.update({
    where: { id: apiKeyRecord.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {});

  request.user = {
    id: apiKeyRecord.user.id,
    email: apiKeyRecord.user.email,
    role: apiKeyRecord.user.role,
  };
}

/**
 * Role-based access control middleware factory.
 * Usage: authorize('ADMIN') or authorize(['ADMIN', 'MODERATOR'])
 */
export function authorize(...roles) {
  const allowed = roles.flat();
  return async function (request, reply) {
    if (!request.user) {
      throw AppError.unauthorized();
    }
    if (!allowed.includes(request.user.role)) {
      throw AppError.forbidden(
        `This action requires one of the following roles: ${allowed.join(', ')}`
      );
    }
  };
}

/**
 * Optional auth - attaches user if token is present but doesn't fail if missing.
 */
export async function optionalAuthenticate(request, reply) {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (token) {
      await request.jwtVerify();
    }
  } catch {
    // Silent fail - optional auth
  }
}
