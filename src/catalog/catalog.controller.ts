import { Controller, Get, Param, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { ListProductResponse } from './catalog.interface';

@Controller()
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('categories')
  async listCategories() {
    return this.catalogService.listCategories();
  }

  @Get('products')
  async listProducts(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('skip') skip?: string,
    @Query('limit') limit?: string,
  ): Promise<ListProductResponse> {
    return await this.catalogService.listProducts({
      category,
      search,
      skip: skip ? parseInt(skip, 10) : 0,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get('products/:slug')
  async getProduct(@Param('slug') slug: string) {
    return await this.catalogService.getProductBySlug(slug);
  }
}
