import { z } from 'zod';

export const queryProductsSchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(['priceAsc', 'priceDesc', 'new']).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export type QueryProductsDto = z.infer<typeof queryProductsSchema>;
