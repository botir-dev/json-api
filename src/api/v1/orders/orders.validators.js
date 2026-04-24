// src/api/v1/orders/orders.validators.js
import { z } from 'zod';

const addressZod = z.object({
  fullName:  z.string().min(2),
  address1:  z.string().min(5),
  address2:  z.string().optional(),
  city:      z.string().min(2),
  state:     z.string().min(2),
  zip:       z.string().min(3),
  country:   z.string().length(2, 'Country must be ISO 2-letter code'),
  phone:     z.string().optional(),
});

export const createOrderZod = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity:  z.coerce.number().int().min(1).max(999),
    })
  ).min(1, 'At least one item is required'),
  shippingAddress: addressZod,
  billingAddress:  addressZod.optional(),
  notes:           z.string().max(500).optional(),
});

export const updateOrderStatusZod = z.object({
  status: z.enum(['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
});
