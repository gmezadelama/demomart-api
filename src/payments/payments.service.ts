import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../common/prisma.service';
import { AttachOrderInput } from './schemas/attach-order.schema';

type PIStatus = Stripe.PaymentIntent.Status;

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(private readonly prisma: PrismaService) {
    const key = process.env.STRIPE_SECRET_KEY || '';
    if (!key.startsWith('sk_test_')) {
      throw new ForbiddenException(
        'Stripe must be configured with a test key (sk_test_...)',
      );
    }
    this.stripe = new Stripe(key, { apiVersion: '2024-06-20' as any });
  }

  private mapPiToPaymentStatus(s: PIStatus) {
    switch (s) {
      case 'succeeded':
        return 'succeeded';
      case 'processing':
        return 'processing';
      case 'canceled':
        return 'canceled';
      case 'requires_action':
      case 'requires_payment_method':
      case 'requires_capture':
      case 'requires_confirmation':
        return 'requires_action';
      default:
        return 'requires_action';
    }
  }

  async attachOrder(dto: AttachOrderInput) {
    const { orderId, paymentIntentId, clientSecret } = dto;

    // order existence
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Order not found');

    if (!paymentIntentId || !paymentIntentId.startsWith('pi_')) {
      // Zod should already guard this, just in case
      throw new NotFoundException('Invalid paymentIntentId');
    }

    const pi = await this.stripe.paymentIntents.retrieve(paymentIntentId);

    const status = this.mapPiToPaymentStatus(pi.status);
    const amountCents = typeof pi.amount === 'number' ? pi.amount : 0;
    const currency = (pi.currency || 'usd').toLowerCase();

    const payment = await this.prisma.payment.upsert({
      where: { stripePaymentIntentId: paymentIntentId },
      create: {
        orderId: order.id,
        amountCents,
        currency,
        status,
        stripePaymentIntentId: paymentIntentId,
        clientSecret: clientSecret ?? null,
      },
      update: {
        orderId: order.id,
        amountCents,
        currency,
        status,
        clientSecret: clientSecret ?? undefined,
      },
      select: { id: true, status: true },
    });

    if (pi.status === 'succeeded' && order.paymentStatus !== 'paid') {
      await this.prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'paid' },
      });
    }

    return {
      ok: true,
      orderId: order.id,
      paymentId: payment.id,
      stripePaymentIntentId: paymentIntentId,
      status: payment.status,
    };
  }

  async handleWebhook(signature: string | undefined, rawBody: Buffer) {
    if (!signature) {
      return { received: false, error: 'Missing stripe-signature header' };
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || '',
      );
    } catch (err: any) {
      return {
        received: false,
        error: `Signature verification failed: ${err.message}`,
      };
    }

    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object as Stripe.PaymentIntent;

      const payment = await this.prisma.payment.findUnique({
        where: { stripePaymentIntentId: pi.id },
        select: { id: true, orderId: true },
      });

      if (payment) {
        await this.prisma.$transaction([
          this.prisma.payment.update({
            where: { stripePaymentIntentId: pi.id },
            data: {
              status: 'succeeded',
              amountCents: pi.amount,
              currency: pi.currency,
            },
          }),
          this.prisma.order.update({
            where: { id: payment.orderId },
            data: { paymentStatus: 'paid' },
          }),
        ]);
      }
    }

    return { received: true };
  }
}
