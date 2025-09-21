import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getDemoUsers() {
    // Assumes your seed creates two demo users with names 'Alice' and 'Bob'
    const users = await this.prisma.user.findMany({
      where: {
        isDemo: true,
        name: { in: ['Alice', 'Bob'] },
      },
      select: { id: true, name: true, email: true },
    });

    const alice = users.find((u) => u.name === 'Alice') ?? null;
    const bob = users.find((u) => u.name === 'Bob') ?? null;

    return { alice, bob };
  }

  async getUserOrders(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { placedAt: 'desc' },
      select: {
        id: true,
        number: true,
        status: true,
        placedAt: true,
        totalCents: true,
        currency: true,
        items: {
          select: {
            nameSnapshot: true,
            skuSnapshot: true,
            quantity: true,
            unitPriceCents: true,
          },
        },
      },
    });
    return orders;
  }

  async getUserWishlist(userId: string) {
    const rows = await this.prisma.wishlistItem.findMany({
      where: { wishlist: { userId } },
      select: {
        variantId: true,
        variant: {
          select: {
            priceCents: true, // take price from the variant
            product: { select: { slug: true, name: true } },
          },
        },
      },
    });

    return rows.map((r) => ({
      variantId: r.variantId,
      product: r.variant.product, // { slug, name }
      priceCents: r.variant.priceCents, // mapped from variant
    }));
  }
}
