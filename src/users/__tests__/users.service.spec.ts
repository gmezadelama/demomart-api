/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users.service';
import { PrismaService } from '../../common/prisma.service';
import { createPrismaMock, resetPrismaMock } from '../../../test/prisma.mock';

describe('UsersService', () => {
  const prismaMock = createPrismaMock();
  let service: UsersService;

  beforeEach(async () => {
    resetPrismaMock(prismaMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('getDemoUsers', () => {
    it('returns Alice and Bob minimal profiles', async () => {
      (prismaMock.user.findMany as jest.Mock).mockResolvedValue([
        { id: '1', name: 'Alice', email: 'alice@example.com' },
        { id: '2', name: 'Bob', email: 'bob@example.com' },
      ]);

      const result = await service.getDemoUsers();

      expect(prismaMock.user.findMany).toHaveBeenCalledWith({
        where: { isDemo: true, name: { in: ['Alice', 'Bob'] } },
        select: { id: true, name: true, email: true },
      });
      expect(result).toEqual({
        alice: { id: '1', name: 'Alice', email: 'alice@example.com' },
        bob: { id: '2', name: 'Bob', email: 'bob@example.com' },
      });
    });

    it('returns null for missing users', async () => {
      (prismaMock.user.findMany as jest.Mock).mockResolvedValue([
        { id: '1', name: 'Alice', email: 'alice@example.com' },
      ]);

      const result = await service.getDemoUsers();
      expect(result).toEqual({
        alice: { id: '1', name: 'Alice', email: 'alice@example.com' },
        bob: null,
      });
    });
  });

  describe('getUserOrders', () => {
    it('returns a list of orders with items', async () => {
      (prismaMock.order.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'o1',
          number: '1001',
          status: 'PAID',
          placedAt: new Date('2025-01-01'),
          totalCents: 5000,
          currency: 'USD',
          items: [
            {
              nameSnapshot: 'Chocolate Cake',
              skuSnapshot: 'CAKE-1',
              quantity: 2,
              unitPriceCents: 2500,
            },
          ],
        },
      ]);

      const result = await service.getUserOrders('1');

      expect(prismaMock.order.findMany).toHaveBeenCalledWith({
        where: { userId: '1' },
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
      expect(result).toHaveLength(1);
    });
  });

  describe('getUserWishlist', () => {
    it('returns wishlist items with variant->product', async () => {
      (prismaMock.wishlistItem.findMany as jest.Mock).mockResolvedValue([
        {
          variantId: 'v1',
          variant: {
            priceCents: 1200,
            product: { slug: 'choco-cake', name: 'Chocolate Cake' },
          },
        },
      ]);

      const result = await service.getUserWishlist('1');

      expect(prismaMock.wishlistItem.findMany).toHaveBeenCalledWith({
        where: { wishlist: { userId: '1' } },
        select: {
          variantId: true,
          variant: {
            select: {
              priceCents: true,
              product: { select: { slug: true, name: true } },
            },
          },
        },
      });

      expect(result).toEqual([
        {
          variantId: 'v1',
          product: { slug: 'choco-cake', name: 'Chocolate Cake' },
          priceCents: 1200,
        },
      ]);
    });

    it('returns empty array when no items', async () => {
      (prismaMock.wishlistItem.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getUserWishlist('1');
      expect(result).toEqual([]);
    });
  });
});
