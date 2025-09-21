export interface ListProductsArgs {
  category?: string;
  search?: string;
  skip?: number;
  limit: number;
}

export interface ProductResponse {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: { slug: string; name: string };
  priceCents: number | null;
  currency: string | null;
  sku: string | null;
  stockQty: number | null;
  thumbnail: string | null;
  assets: { url: string; kind: string; sort: number }[];
  createdAt: Date;
}

export interface ListProductResponse {
  items: ProductResponse[];
  totalCount: number;
  skip: number;
  limit: number;
}
