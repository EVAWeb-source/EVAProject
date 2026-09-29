import { Controller, Get, Param } from '@nestjs/common';
import { CatalogService } from './catalog.service.js';

@Controller('products')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  listProducts() {
    return this.catalog.listProducts();
  }

  @Get(':slug')
  getProduct(@Param('slug') slug: string) {
    return this.catalog.getProductBySlug(slug);
  }
}
