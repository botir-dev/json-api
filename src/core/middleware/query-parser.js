// src/core/middleware/query-parser.js
import { z } from 'zod';

export const paginationSchema = z.object({
  page:    z.coerce.number().int().min(1).default(1),
  limit:   z.coerce.number().int().min(1).max(100).default(20),
  sortBy:  z.string().optional(),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
  search:  z.string().trim().optional(),
  deleted: z.coerce.boolean().default(false), // include soft-deleted (admin only)
});

/**
 * Parses and normalizes common query parameters.
 * Attaches `request.pagination` to the request object.
 */
export async function parseQuery(request, reply) {
  const result = paginationSchema.safeParse(request.query);
  if (!result.success) {
    const issues = result.error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    return reply.status(400).send({
      success: false,
      error: {
        code: 'INVALID_QUERY_PARAMS',
        message: 'Invalid query parameters',
        statusCode: 400,
        details: issues,
      },
    });
  }

  const { page, limit, sortBy, sortDir, search, deleted } = result.data;

  request.pagination = {
    page,
    limit,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: sortBy ? { [sortBy]: sortDir } : { createdAt: 'desc' },
    search: search || null,
    includeDeleted: deleted,
  };
}

/**
 * Builds a standardized paginated response envelope.
 */
export function paginate(data, total, { page, limit }) {
  const totalPages = Math.ceil(total / limit);
  return {
    success: true,
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}
