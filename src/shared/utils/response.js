// src/shared/utils/response.js

/**
 * Standard success response envelope.
 */
export function ok(data, meta = null) {
  return {
    success: true,
    data,
    ...(meta && { meta }),
  };
}

/**
 * Standard created response.
 */
export function created(data) {
  return { success: true, data };
}

/**
 * Standard no-content message response.
 */
export function message(msg) {
  return { success: true, message: msg };
}

/**
 * Paginated list response.
 */
export function paginated(data, total, { page, limit }) {
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
