import { z } from 'zod';

export const IdParamSchema = z.object({
  id: z.string().min(1),
});
export type IdParam = z.infer<typeof IdParamSchema>;

export const UserOrdersParamSchema = z.object({
  id: z.string().min(1), // userId
});
export type UserOrdersParam = z.infer<typeof UserOrdersParamSchema>;

export const PaginationQuerySchema = z.object({
  // Compatible with both skip/limit and cursor/limit
  limit: z.coerce.number().int().positive().max(100).default(10),
  skip: z.coerce.number().int().min(0).optional(),
  cursor: z.string().min(1).optional(),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
