import { PaymentsService } from '../payments.service';
import { PrismaService } from '../../common/prisma.service';
import { createPrismaMock } from '../../../test/prisma.mock';

/* eslint-disable @typescript-eslint/unbound-method */

process.env.STRIPE_SECRET_KEY = 'sk_test_123';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123';

const retrieveMock = jest.fn();
const constructEventMock = jest.fn();

// Mock the Stripe SDK BEFORE importing the service
jest.mock('stripe', () => {
  const StripeMock = jest.fn().mockImplementation(() => ({
    paymentIntents: { retrieve: retrieveMock },
    webhooks: { constructEvent: constructEventMock },
  }));
  return { __esModule: true, default: StripeMock };
});

describe('PaymentsService (unit)', () => {
  let prisma: PrismaService;
  let service: PaymentsService;

  beforeEach(() => {
    retrieveMock.mockReset();
    constructEventMock.mockReset();
    prisma = createPrismaMock();
    service = new PaymentsService(prisma);
  });

  it('attachOrder: upsert payment & mark order paid when PI succeeded', async () => {
    (prisma.order.findUnique as any).mockResolvedValue({
      id: 'order_1',
      paymentStatus: 'unpaid',
    });
    retrieveMock.mockResolvedValue({
      id: 'pi_1',
      status: 'succeeded',
      amount: 1234,
      currency: 'usd',
    });
    (prisma.payment.upsert as any).mockResolvedValue({
      id: 'pay_1',
      status: 'succeeded',
    });

    const res = await service.attachOrder({
      orderId: 'order_1',
      paymentIntentId: 'pi_1',
      clientSecret: undefined,
    });

    expect(retrieveMock).toHaveBeenCalledWith('pi_1');
    expect(prisma.payment.upsert).toHaveBeenCalled();
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order_1' },
      data: { paymentStatus: 'paid' },
    });
    expect(res).toEqual({
      ok: true,
      orderId: 'order_1',
      paymentId: 'pay_1',
      stripePaymentIntentId: 'pi_1',
      status: 'succeeded',
    });
  });

  it('handleWebhook: updates Payment & Order on payment_intent.succeeded', async () => {
    const sig = 't=1,v1=abc';
    const body = Buffer.from('{}');

    constructEventMock.mockImplementation(() => ({
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_1',
          status: 'succeeded',
          amount: 1234,
          currency: 'usd',
        },
      },
    }));

    (prisma.payment.findUnique as any).mockResolvedValue({
      id: 'pay_1',
      orderId: 'order_1',
    });
    (prisma.payment.update as any).mockResolvedValue({
      id: 'pay_1',
      status: 'succeeded',
    });
    (prisma.order.update as any).mockResolvedValue({
      id: 'order_1',
      paymentStatus: 'paid',
    });

    const res = await service.handleWebhook(sig, body);

    expect(constructEventMock).toHaveBeenCalled();
    expect(prisma.payment.update).toHaveBeenCalledWith({
      where: { stripePaymentIntentId: 'pi_1' },
      data: { status: 'succeeded', amountCents: 1234, currency: 'usd' },
    });
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order_1' },
      data: { paymentStatus: 'paid' },
    });
    expect(res).toEqual({ received: true });
  });
});
