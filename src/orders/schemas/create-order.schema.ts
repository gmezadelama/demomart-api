import { z } from 'zod';

const id = z.string().min(1);

export const CreateOrderItemSchema = z.object({
  variantId: id,
  quantity: z.number().int().positive().max(10000),
});

export const CreateOrderBodySchema = z.object({
  userId: id,
  items: z.array(CreateOrderItemSchema).min(1),
  isDemo: z.boolean().optional(),
  // Optional: if you want to pass addresses now; otherwise service fills {}
  shippingAddress: z.unknown().optional(),
  billingAddress: z.unknown().optional(),
});

export type CreateOrderBody = z.infer<typeof CreateOrderBodySchema>;
export type CreateOrderItem = z.infer<typeof CreateOrderItemSchema>;
