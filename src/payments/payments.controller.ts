import { Body, Controller, Headers, Post, Req } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { attachOrderSchema } from './schemas/attach-order.schema';
import type { AttachOrderInput } from './schemas/attach-order.schema';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('attach-order')
  async attachOrder(
    @Body(new ZodValidationPipe(attachOrderSchema)) body: AttachOrderInput,
  ) {
    return this.payments.attachOrder(body);
  }

  @Post('webhook')
  async webhook(@Req() req: any, @Headers('stripe-signature') sig: string) {
    // Ensure req.body is a Buffer; if using a raw body parser, it should be available as req.body
    return this.payments.handleWebhook(sig, req.body);
  }
}
