// src/api/v1/auth/auth.validators.js
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { AppError } from '../../../core/errors/handler.js';

export const registerZod = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
});

export const loginZod = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const refreshZod = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const changePasswordZod = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

// Convert Zod schemas to JSON Schema for Fastify/Swagger
export const registerSchema = zodToJsonSchema(registerZod, { target: 'openApi3' });
export const loginSchema    = zodToJsonSchema(loginZod,    { target: 'openApi3' });
export const refreshSchema  = zodToJsonSchema(refreshZod,  { target: 'openApi3' });
export const changePasswordSchema = zodToJsonSchema(changePasswordZod, { target: 'openApi3' });

/**
 * Validates request body against a Zod schema.
 * Throws a structured 400 error on failure.
 */
export function validate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    throw AppError.badRequest('Validation failed', details);
  }
  return result.data;
}
