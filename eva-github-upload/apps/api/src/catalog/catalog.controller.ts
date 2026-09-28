import { Controller, Get } from '@nestjs/common';
import { CatalogService } from './catalog.service.js';

@Controller('products')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  listProducts() {
    return this.catalog.listProducts();
  }
}
