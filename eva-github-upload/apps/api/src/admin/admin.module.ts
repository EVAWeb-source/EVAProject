import { Module } from '@nestjs/common';
import { PricingModule } from '../pricing/pricing.module.js';
import { AdminController } from './admin.controller.js';
import { AdminPricingController } from './admin-pricing.controller.js';
import { AdminPricingService } from './admin-pricing.service.js';
import { AdminService } from './admin.service.js';
import { AdminCatalogContentController } from './admin-catalog-content.controller.js';
import { AdminCatalogContentService } from './admin-catalog-content.service.js';
import { AdminCatalogReadinessController } from './admin-catalog-readiness.controller.js';
import { AdminCatalogReadinessService } from './admin-catalog-readiness.service.js';

@Module({
  imports: [PricingModule],
  controllers: [
    AdminController,
    AdminPricingController,
    AdminCatalogContentController,
    AdminCatalogReadinessController,
  ],
  providers: [
    AdminService,
    AdminPricingService,
    AdminCatalogContentService,
    AdminCatalogReadinessService,
  ],
})
export class AdminModule {}
