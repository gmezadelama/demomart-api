import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import {
  ListProductResponse,
  ListProductsArgs,
  ProductResponse,
} from './catalog.interface';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories() {
    return this.prisma.category.findMany({
      orderBy: [{ sort: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, slug: true, sort: true },
    });
  }

  async listProducts(args: ListProductsArgs): Promise<ListProductResponse> {
    const { category, search, skip = 0, limit } = args;

    const where: Prisma.ProductWhereInput = {
      AND: [
        category ? { category: { slug: category } } : {},
        search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { slug: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {},
      ],
    };

    // Count that matches filters (ignores cursor)
    const totalCount = await this.prisma.product.count({ where });

    const items = await this.prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
      skip,
      take: limit,
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        category: { select: { slug: true, name: true } },
        variants: {
          orderBy: { priceCents: 'asc' },
          take: 1,
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
          take: 1,
          select: { url: true, kind: true, sort: true },
        },
        createdAt: true,
      },
    });

    const normalized = items.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      category: p.category,
      priceCents: p.variants[0]?.priceCents ?? null,
      currency: p.variants[0]?.currency ?? null,
      sku: p.variants[0]?.sku ?? null,
      stockQty: p.variants[0]?.stockQty ?? null,
      thumbnail: p.assets[0]?.url ?? null,
      assets: p.assets,
      createdAt: p.createdAt,
    }));

    return {
      items: normalized,
      totalCount,
      skip,
      limit,
    };
  }

  async getProductBySlug(slug: string): Promise<ProductResponse> {
    const product = await this.prisma.product.findUnique({
      where: { slug },
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

    if (!product) throw new NotFoundException('Product not found');

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      category: product.category,
      priceCents: product.variants[0]?.priceCents ?? null,
      currency: product.variants[0]?.currency ?? null,
      sku: product.variants[0]?.sku ?? null,
      stockQty: product.variants[0]?.stockQty ?? null,
      thumbnail: product.assets[0]?.url ?? null,
      assets: product.assets,
      createdAt: product.createdAt,
    };
  }
}
