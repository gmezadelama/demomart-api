/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { CatalogService } from '../catalog.service';
import { PrismaService } from '../../common/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { createPrismaMock, resetPrismaMock } from '../../../test/prisma.mock';

describe('CatalogService', () => {
  const prismaMock = createPrismaMock();
  let service: CatalogService;

  beforeEach(async () => {
    resetPrismaMock(prismaMock);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<CatalogService>(CatalogService);
  });

  describe('listCategories', () => {
    it('returns categories sorted with selected fields', async () => {
      const rows = [
        { id: 'c1', name: 'Bakery', slug: 'bakery', sort: 1 },
        { id: 'c2', name: 'Desserts', slug: 'desserts', sort: 2 },
      ];
      (prismaMock.category.findMany as jest.Mock).mockResolvedValue(rows);

      const result = await service.listCategories();

      expect(prismaMock.category.findMany).toHaveBeenCalledWith({
        orderBy: [{ sort: 'asc' }, { name: 'asc' }],
        select: { id: true, name: true, slug: true, sort: true },
      });
      expect(result).toEqual(rows);
    });
  });

  describe('listProducts', () => {
    it('applies search + pagination and normalizes items', async () => {
      (prismaMock.product.count as jest.Mock).mockResolvedValue(3);
      (prismaMock.product.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'p1',
          slug: 'choco-cake',
          name: 'Chocolate Cake',
          description: 'Rich cocoa',
          category: { slug: 'desserts', name: 'Desserts' },
          variants: [
            {
              id: 'v1',
              sku: 'SKU1',
              priceCents: 1200,
              currency: 'USD',
              stockQty: 5,
            },
          ],
          assets: [{ url: 'http://img/1.jpg', kind: 'image', sort: 1 }],
          createdAt: new Date('2025-01-01'),
        },
        {
          id: 'p2',
          slug: 'apple-pie',
          name: 'Apple Pie',
          description: 'Tart & sweet',
          category: { slug: 'bakery', name: 'Bakery' },
          variants: [
            {
              id: 'v2',
              sku: 'SKU2',
              priceCents: 900,
              currency: 'USD',
              stockQty: 10,
            },
          ],
          assets: [{ url: 'http://img/2.jpg', kind: 'image', sort: 1 }],
          createdAt: new Date('2025-01-02'),
        },
      ]);

      const result = await service.listProducts({
        search: 'pie',
        skip: 0,
        limit: 2,
      });

      // Query called with pagination + selection
      expect(result).toEqual({
        items: [
          {
            id: 'p1',
            slug: 'choco-cake',
            name: 'Chocolate Cake',
            description: 'Rich cocoa',
            category: { slug: 'desserts', name: 'Desserts' },
            priceCents: 1200,
            currency: 'USD',
            sku: 'SKU1',
            stockQty: 5,
            assets: [{ url: 'http://img/1.jpg', kind: 'image', sort: 1 }],
            thumbnail: 'http://img/1.jpg',
            createdAt: new Date('2025-01-01'),
          },
          {
            id: 'p2',
            slug: 'apple-pie',
            name: 'Apple Pie',
            description: 'Tart & sweet',
            category: { slug: 'bakery', name: 'Bakery' },
            priceCents: 900,
            currency: 'USD',
            sku: 'SKU2',
            stockQty: 10,
            assets: [{ url: 'http://img/2.jpg', kind: 'image', sort: 1 }],
            thumbnail: 'http://img/2.jpg',
            createdAt: new Date('2025-01-02'),
          },
        ],
        totalCount: 3,
        skip: 0,
        limit: 2,
      });
    });
  });

  describe('getProductBySlug', () => {
    it('returns mapped product detail', async () => {
      (prismaMock.product.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        slug: 'choco-cake',
        name: 'Chocolate Cake',
        description: 'Rich cocoa',
        category: { slug: 'desserts', name: 'Desserts' },
        variants: [
          {
            id: 'v1',
            sku: 'SKU1',
            priceCents: 1200,
            currency: 'USD',
            stockQty: 5,
          },
          {
            id: 'v2',
            sku: 'SKU2',
            priceCents: 1500,
            currency: 'USD',
            stockQty: 2,
          },
        ],
        assets: [{ url: 'http://img/1.jpg', kind: 'image', sort: 1 }],
        createdAt: new Date('2025-01-01'),
      });

      const result = await service.getProductBySlug('choco-cake');

      expect(prismaMock.product.findUnique).toHaveBeenCalledWith({
        where: { slug: 'choco-cake' },
        include: {
          category: { select: { slug: true, name: true } },
          variants: {
            orderBy: { priceCents: 'asc' },
            select: {
              id: true,
              sku: true,
              priceCents: true,
              currency: true,
              stockQty: true,
            },
          },
          assets: {
            orderBy: { sort: 'asc' },
            select: { url: true, kind: true, sort: true },
          },
        },
      });

      expect(result).toEqual({
        id: 'p1',
        slug: 'choco-cake',
        name: 'Chocolate Cake',
        description: 'Rich cocoa',
        category: { slug: 'desserts', name: 'Desserts' },
        priceCents: 1200,
        currency: 'USD',
        sku: 'SKU1',
        stockQty: 5,
        assets: [{ url: 'http://img/1.jpg', kind: 'image', sort: 1 }],
        thumbnail: 'http://img/1.jpg',
        createdAt: new Date('2025-01-01'),
      });
    });

    it('throws NotFoundException when product is missing', async () => {
      (prismaMock.product.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.getProductBySlug('nope')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
