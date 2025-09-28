import { z } from 'zod';

export const attachOrderSchema = z
  .object({
    orderId: z.string().min(1, 'orderId is required'),
    paymentIntentId: z.string().startsWith('pi_').optional(),
    clientSecret: z.string().includes('_secret').optional(),
  })
  .refine((d) => !!d.paymentIntentId || !!d.clientSecret, {
    message: 'Provide paymentIntentId or clientSecret',
  })
  .transform((d) => {
    // Derive pi_... from clientSecret if not provided directly
    let paymentIntentId = d.paymentIntentId;
    if (!paymentIntentId && d.clientSecret) {
      const idx = d.clientSecret.indexOf('_secret');
      if (idx > 0) paymentIntentId = d.clientSecret.slice(0, idx);
    }
    return { ...d, paymentIntentId };
  });

export type AttachOrderInput = z.infer<typeof attachOrderSchema>;
