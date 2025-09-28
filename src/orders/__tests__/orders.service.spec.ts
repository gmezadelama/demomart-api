import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrdersService } from '../orders.service';
import { createPrismaMock } from '../../../test/prisma.mock';

/* eslint-disable @typescript-eslint/unbound-method */

const prismaMock = createPrismaMock();

const makeService = () => new OrdersService(prismaMock);

const userId = 'user_1';
const now = new Date('2025-01-01T00:00:00Z');

describe('OrdersService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers().setSystemTime(now);
  });

  describe('createOrder', () => {
    const body = {
      userId,
      items: [
        { variantId: 'v1', quantity: 1 },
        { variantId: 'v2', quantity: 2 },
      ],
      isDemo: true,
    };

    test('creates order successfully (happy path)', async () => {
      const variants = [
        {
          id: 'v1',
          sku: 'SKU-1',
          priceCents: 1000,
          currency: 'USD',
          active: true,
          productId: 'p1',
          product: { id: 'p1', name: 'P1', slug: 'p1' },
        },
        {
          id: 'v2',
          sku: 'SKU-2',
          priceCents: 2500,
          currency: 'USD',
          active: true,
          productId: 'p2',
          product: { id: 'p2', name: 'P2', slug: 'p2' },
        },
      ];

      (prismaMock.productVariant.findMany as any).mockResolvedValue(variants);

      (prismaMock.order.create as any).mockResolvedValueOnce({
        id: 'o1',
        number: 'ORD-1735689600000',
        status: 'processing',
        currency: 'USD',
        subtotalCents: 1000 + 2500 * 2,
        taxCents: 0,
        shippingCents: 0,
        discountCents: 0,
        totalCents: 1000 + 2500 * 2,
        paymentStatus: 'unpaid',
        placedAt: now,
      });

      const svc = makeService();
      const res = await svc.createOrder(body as any);

      expect(prismaMock.productVariant.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['v1', 'v2'] } },
        select: expect.any(Object),
      });

      // verify subtotal math: 1000*1 + 2500*2 = 6000
      expect(prismaMock.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            user: { connect: { id: userId } },
            currency: 'USD',
            subtotalCents: 6000,
            totalCents: 6000,
            paymentStatus: 'unpaid',
            isDemo: true,
            items: {
              create: [
                expect.objectContaining({
                  unitPriceCents: 1000,
                  lineTotalCents: 1000,
                  quantity: 1,
                  skuSnapshot: 'SKU-1',
                  nameSnapshot: 'P1',
                }),
                expect.objectContaining({
                  unitPriceCents: 2500,
                  lineTotalCents: 5000,
                  quantity: 2,
                  skuSnapshot: 'SKU-2',
                  nameSnapshot: 'P2',
                }),
              ],
            },
          }),
        }),
      );

      expect(res).toEqual({
        ok: true,
        order: expect.objectContaining({
          id: 'o1',
          currency: 'USD',
          subtotalCents: 6000,
          totalCents: 6000,
          paymentStatus: 'unpaid',
        }),
      });
    });

    test('rejects when some variants are not found', async () => {
      (prismaMock.productVariant.findMany as any).mockResolvedValueOnce([
        {
          id: 'v1',
          sku: 'SKU-1',
          priceCents: 1000,
          currency: 'USD',
          active: true,
          productId: 'p1',
          product: { id: 'p1', name: 'P1', slug: 'p1' },
        },
        // missing v2
      ]);

      const svc = makeService();
      await expect(svc.createOrder(body as any)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    test('rejects inactive variants', async () => {
      (prismaMock.productVariant.findMany as any).mockResolvedValueOnce([
        {
          id: 'v1',
          sku: 'SKU-1',
          priceCents: 1000,
          currency: 'USD',
          active: true,
          productId: 'p1',
          product: { id: 'p1', name: 'P1', slug: 'p1' },
        },
        {
          id: 'v2',
          sku: 'SKU-2',
          priceCents: 2500,
          currency: 'USD',
          active: false,
          productId: 'p2',
          product: { id: 'p2', name: 'P2', slug: 'p2' },
        },
      ]);

      const svc = makeService();
      await expect(svc.createOrder(body as any)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    test('rejects mixed currencies', async () => {
      (prismaMock.productVariant.findMany as any).mockResolvedValueOnce([
        {
          id: 'v1',
          sku: 'SKU-1',
          priceCents: 1000,
          currency: 'USD',
          active: true,
          productId: 'p1',
          product: { id: 'p1', name: 'P1', slug: 'p1' },
        },
        {
          id: 'v2',
          sku: 'SKU-2',
          priceCents: 2500,
          currency: 'EUR',
          active: true,
          productId: 'p2',
          product: { id: 'p2', name: 'P2', slug: 'p2' },
        },
      ]);

      const svc = makeService();
      await expect(svc.createOrder(body as any)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('getOrderById', () => {
    test('returns order with latestPayment normalized', async () => {
      (prismaMock.order.findUnique as any).mockResolvedValueOnce({
        id: 'o1',
        number: 'ORD-1',
        userId,
        status: 'processing',
        currency: 'USD',
        subtotalCents: 1000,
        taxCents: 0,
        shippingCents: 0,
        discountCents: 0,
        totalCents: 1000,
        paymentStatus: 'unpaid',
        placedAt: now,
        items: [
          {
            id: 'oi1',
            quantity: 1,
            unitPriceCents: 1000,
            lineTotalCents: 1000,
            skuSnapshot: 'SKU-1',
            nameSnapshot: 'P1',
            variant: {
              id: 'v1',
              sku: 'SKU-1',
              priceCents: 1000,
              currency: 'USD',
              product: { id: 'p1', slug: 'p1', name: 'P1' },
            },
          },
        ],
        payments: [
          {
            id: 'pay2',
            amountCents: 1000,
            currency: 'USD',
            status: 'authorized',
            provider: 'stripe',
            createdAt: new Date(now.getTime() + 1000),
          },
          {
            id: 'pay1',
            amountCents: 1000,
            currency: 'USD',
            status: 'created',
            provider: 'stripe',
            createdAt: now,
          },
        ],
      });

      const svc = makeService();
      const res = await svc.getOrderById('o1');
      expect(res.ok).toBe(true);
      expect(res.order.latestPayment).toEqual(
        expect.objectContaining({ id: 'pay2', status: 'authorized' }),
      );
      // Should not expose payments array
      // @ts-expect-error: payments property should not exist on returned order object
      expect(res.order.payments).toBeUndefined();
    });

    test('throws NotFound when missing', async () => {
      (prismaMock.order.findUnique as any).mockResolvedValueOnce(null);
      const svc = makeService();
      await expect(svc.getOrderById('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('getOrdersByUser', () => {
    test('skip/limit pagination', async () => {
      (prismaMock.order.findMany as any).mockResolvedValueOnce([
        {
          id: 'o1',
          number: 'ORD-1',
          status: 'processing',
          currency: 'USD',
          subtotalCents: 1000,
          taxCents: 0,
          shippingCents: 0,
          discountCents: 0,
          totalCents: 1000,
          paymentStatus: 'unpaid',
          placedAt: now,
        },
      ]);

      const svc = makeService();
      const res = await svc.getOrdersByUser(userId, { limit: 10, skip: 0 });
      expect(prismaMock.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId },
          take: 10,
          skip: 0,
          orderBy: { placedAt: 'desc' },
        }),
      );
      expect(res).toEqual({
        ok: true,
        items: expect.any(Array),
        count: 1,
        nextCursor: null,
      });
    });

    test('cursor pagination', async () => {
      (prismaMock.order.findMany as any).mockResolvedValueOnce([
        {
          id: 'o2',
          number: 'ORD-2',
          status: 'processing',
          currency: 'USD',
          subtotalCents: 1000,
          taxCents: 0,
          shippingCents: 0,
          discountCents: 0,
          totalCents: 1000,
          paymentStatus: 'unpaid',
          placedAt: now,
        },
        {
          id: 'o3',
          number: 'ORD-3',
          status: 'processing',
          currency: 'USD',
          subtotalCents: 1000,
          taxCents: 0,
          shippingCents: 0,
          discountCents: 0,
          totalCents: 1000,
          paymentStatus: 'unpaid',
          placedAt: now,
        },
      ]);

      const svc = makeService();
      const res = await svc.getOrdersByUser(userId, { limit: 2, cursor: 'o1' });
      expect(prismaMock.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId },
          take: 2,
          skip: 1,
          cursor: { id: 'o1' },
          orderBy: { placedAt: 'desc' },
        }),
      );
      expect(res.ok).toBe(true);
      expect(res.nextCursor).toBe('o3');
    });

    test('cursor pagination end-of-list returns null nextCursor', async () => {
      (prismaMock.order.findMany as any).mockResolvedValueOnce([
        {
          id: 'o2',
          number: 'ORD-2',
          status: 'processing',
          currency: 'USD',
          subtotalCents: 1000,
          taxCents: 0,
          shippingCents: 0,
          discountCents: 0,
          totalCents: 1000,
          paymentStatus: 'unpaid',
          placedAt: now,
        },
      ]);

      const svc = makeService();
      const res = await svc.getOrdersByUser(userId, { limit: 2, cursor: 'o1' });
      expect(res.nextCursor).toBeNull();
    });
  });
});
