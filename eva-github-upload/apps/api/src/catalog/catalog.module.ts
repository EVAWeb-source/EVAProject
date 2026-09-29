import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller.js';
import { CatalogService } from './catalog.service.js';
import { CatalogSeedService } from './catalog-seed.service.js';

@Module({
  controllers: [CatalogController],
  providers: [CatalogService, CatalogSeedService],
})
export class CatalogModule {}
