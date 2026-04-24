// src/core/errors/handler.js

/**
 * Centralized error handler for Fastify.
 * Produces a consistent structured error response across all routes.
 */
export async function errorHandler(error, request, reply) {
  const { log } = request;

  // Validation errors from Zod (thrown via AppError) or Fastify schema
  if (error.validation) {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        statusCode: 400,
        details: error.validation,
      },
    });
  }

  // Custom application errors
  if (error instanceof AppError) {
    log.warn({ err: error }, 'Application error');
    return reply.status(error.statusCode).send({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        ...(error.details && { details: error.details }),
      },
    });
  }

  // JWT errors from @fastify/jwt
  if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID' ||
      error.code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED') {
    return reply.status(401).send({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
        statusCode: 401,
      },
    });
  }

  // Rate limit errors
  if (error.statusCode === 429) {
    return reply.status(429).send({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: error.message,
        statusCode: 429,
      },
    });
  }

  // Prisma errors
  if (error.code?.startsWith('P')) {
    return handlePrismaError(error, reply);
  }

  // Generic / unknown errors
  log.error({ err: error }, 'Unhandled server error');
  return reply.status(500).send({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : error.message,
      statusCode: 500,
    },
  });
}

function handlePrismaError(error, reply) {
  switch (error.code) {
    case 'P2002':
      return reply.status(409).send({
        success: false,
        error: {
          code: 'CONFLICT',
          message: `Unique constraint violation on: ${error.meta?.target?.join(', ')}`,
          statusCode: 409,
        },
      });
    case 'P2025':
      return reply.status(404).send({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Record not found',
          statusCode: 404,
        },
      });
    default:
      return reply.status(500).send({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'A database error occurred',
          statusCode: 500,
        },
      });
  }
}

// ─── Custom AppError Class ─────────────────────────────────────────

export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(message, details = null) {
    return new AppError(message, 400, 'BAD_REQUEST', details);
  }

  static unauthorized(message = 'Unauthorized') {
    return new AppError(message, 401, 'UNAUTHORIZED');
  }

  static forbidden(message = 'Forbidden') {
    return new AppError(message, 403, 'FORBIDDEN');
  }

  static notFound(resource = 'Resource') {
    return new AppError(`${resource} not found`, 404, 'NOT_FOUND');
  }

  static conflict(message) {
    return new AppError(message, 409, 'CONFLICT');
  }

  static unprocessable(message, details = null) {
    return new AppError(message, 422, 'UNPROCESSABLE_ENTITY', details);
  }

  static internal(message = 'Internal server error') {
    return new AppError(message, 500, 'INTERNAL_ERROR');
  }
}
