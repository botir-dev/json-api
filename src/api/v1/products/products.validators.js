// src/api/v1/products/products.validators.js
import { z } from 'zod';

export const createProductZod = z.object({
  name:         z.string().min(2).max(200),
  description:  z.string().max(5000).optional(),
  price:        z.coerce.number().positive('Price must be positive'),
  comparePrice: z.coerce.number().positive().optional(),
  stock:        z.coerce.number().int().min(0).default(0),
  sku:          z.string().max(100).optional(),
  imageUrls:    z.array(z.string().url()).default([]),
  tags:         z.array(z.string()).default([]),
  categoryId:   z.string().uuid().optional(),
  isActive:     z.boolean().default(true),
  isFeatured:   z.boolean().default(false),
  metadata:     z.record(z.unknown()).optional(),
});

export const updateProductZod = createProductZod.partial();
