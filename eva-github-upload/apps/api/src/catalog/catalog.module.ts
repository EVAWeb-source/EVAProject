import { Module } from '@nestjs/common';
import { ReservationsModule } from '../reservations/reservations.module.js';
import { CatalogController } from './catalog.controller.js';
import { CatalogService } from './catalog.service.js';
import { CatalogSeedService } from './catalog-seed.service.js';

@Module({
  imports: [ReservationsModule],
  controllers: [CatalogController],
  providers: [CatalogService, CatalogSeedService],
})
export class CatalogModule {}
