import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import type { CreateOrderBody } from './schemas/create-order.schema';
import type { PaginationQuery } from './schemas/get-order.schema';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  // POST /api/v1/orders
  async createOrder(body: CreateOrderBody) {
    const { userId, items, isDemo } = body;

    // Fetch variants with product info
    const variantIds = items.map((i) => i.variantId);
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: {
        id: true,
        sku: true,
        priceCents: true,
        currency: true,
        active: true,
        productId: true,
        product: { select: { id: true, name: true, slug: true } },
      },
    });

    if (variants.length !== variantIds.length) {
      throw new BadRequestException({
        ok: false,
        error: 'Some variants not found',
      });
    }

    const inactive = variants.filter((v) => !v.active).map((v) => v.id);
    if (inactive.length) {
      throw new BadRequestException({
        ok: false,
        error: 'Inactive variants',
        inactive,
      });
    }

    const currencies = new Set(variants.map((v) => v.currency));
    if (currencies.size > 1) {
      throw new BadRequestException({
        ok: false,
        error: 'Mixed currencies not allowed',
      });
    }
    const currency = variants[0].currency;

    // Build line items and totals
    const byId = new Map(variants.map((v) => [v.id, v]));
    const orderItemsData = items.map((i) => {
      const v = byId.get(i.variantId)!;
      const unitPriceCents = v.priceCents;
      const lineTotalCents = unitPriceCents * i.quantity;

      return {
        product: { connect: { id: v.productId } },
        variant: { connect: { id: v.id } },
        nameSnapshot: v.product?.name ?? v.sku, // snapshot name from product
        skuSnapshot: v.sku,
        quantity: i.quantity,
        unitPriceCents,
        lineTotalCents,
        currency,
      } satisfies Prisma.OrderItemCreateWithoutOrderInput;
    });

    const subtotalCents = orderItemsData.reduce(
      (s, it) => s + it.lineTotalCents,
      0,
    );
    const taxCents = 0;
    const shippingCents = 0;
    const discountCents = 0;
    const totalCents = subtotalCents + taxCents + shippingCents - discountCents;

    // Order.number is VarChar(20); keep it short
    const orderNumber = `ORD-${Date.now()}`.slice(0, 20);

    // Required JSON fields in your schema; default to {}
    const shippingAddress = (body as any).shippingAddress ?? {};
    const billingAddress = (body as any).billingAddress ?? {};

    const created = await this.prisma.order.create({
      data: {
        number: orderNumber,
        status: 'processing', // enum OrderStatus (no default in your schema)
        paymentStatus: 'unpaid', // enum OrderPaymentStatus (default is unpaid anyway)
        currency,
        subtotalCents,
        taxCents,
        shippingCents,
        discountCents,
        totalCents,
        isDemo: !!isDemo,
        placedAt: new Date(),
        user: { connect: { id: userId } },
        shippingAddress,
        billingAddress,
        items: { create: orderItemsData },
      },
      select: {
        id: true,
        number: true,
        status: true,
        currency: true,
        subtotalCents: true,
        taxCents: true,
        shippingCents: true,
        discountCents: true,
        totalCents: true,
        paymentStatus: true,
        placedAt: true,
      },
    });

    return { ok: true, order: created };
  }

  // GET /api/v1/orders/:id
  async getOrderById(id: string) {
    const found = await this.prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        number: true,
        userId: true,
        status: true,
        currency: true,
        subtotalCents: true,
        taxCents: true,
        shippingCents: true,
        discountCents: true,
        totalCents: true,
        paymentStatus: true,
        placedAt: true,
        items: {
          select: {
            id: true,
            quantity: true,
            unitPriceCents: true,
            lineTotalCents: true,
            skuSnapshot: true,
            nameSnapshot: true,
            variant: {
              select: {
                id: true,
                sku: true,
                priceCents: true,
                currency: true,
                product: { select: { id: true, slug: true, name: true } },
              },
            },
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            amountCents: true,
            currency: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!found) {
      throw new NotFoundException({ ok: false, error: 'Order not found' });
    }

    const latestPayment = found.payments?.[0] ?? null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { payments, ...order } = found;
    return { ok: true, order: { ...order, latestPayment } };
  }

  // GET /api/v1/users/:id/orders
  async getOrdersByUser(userId: string, q: PaginationQuery) {
    const take = q.limit ?? 10;
    const baseWhere = { userId };
    const baseSelect = {
      id: true,
      number: true,
      status: true,
      currency: true,
      subtotalCents: true,
      taxCents: true,
      shippingCents: true,
      discountCents: true,
      totalCents: true,
      paymentStatus: true,
      placedAt: true,
    } satisfies Prisma.OrderSelect;

    if (q.cursor) {
      const rows = await this.prisma.order.findMany({
        where: baseWhere,
        select: baseSelect,
        take,
        skip: 1,
        cursor: { id: q.cursor },
        orderBy: { placedAt: 'desc' },
      });
      return {
        ok: true,
        items: rows,
        nextCursor: rows.length === take ? rows[rows.length - 1].id : null,
      };
    }

    const rows = await this.prisma.order.findMany({
      where: baseWhere,
      select: baseSelect,
      take,
      skip: q.skip ?? 0,
      orderBy: { placedAt: 'desc' },
    });

    return { ok: true, items: rows, count: rows.length, nextCursor: null };
  }
}
