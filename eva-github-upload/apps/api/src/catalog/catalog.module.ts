import { Module } from '@nestjs/common';
import { PricingModule } from '../pricing/pricing.module.js';
import { ReservationsModule } from '../reservations/reservations.module.js';
import { CatalogController } from './catalog.controller.js';
import { CatalogService } from './catalog.service.js';
import { CatalogSeedService } from './catalog-seed.service.js';

@Module({
  imports: [ReservationsModule, PricingModule],
  controllers: [CatalogController],
  providers: [CatalogService, CatalogSeedService],
})
export class CatalogModule {}
