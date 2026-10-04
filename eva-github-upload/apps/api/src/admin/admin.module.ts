import { Module } from '@nestjs/common';
import { PricingModule } from '../pricing/pricing.module.js';
import { AdminController } from './admin.controller.js';
import { AdminPricingController } from './admin-pricing.controller.js';
import { AdminPricingService } from './admin-pricing.service.js';
import { AdminService } from './admin.service.js';
import { AdminProductContentController } from './admin-product-content.controller.js';
import { AdminProductContentService } from './admin-product-content.service.js';
import { AdminCatalogReadinessController } from './admin-catalog-readiness.controller.js';
import { AdminCatalogReadinessService } from './admin-catalog-readiness.service.js';

@Module({
  imports: [PricingModule],
  controllers: [
    AdminController,
    AdminPricingController,
    AdminProductContentController,
    AdminCatalogReadinessController,
  ],
  providers: [
    AdminService,
    AdminPricingService,
    AdminProductContentService,
    AdminCatalogReadinessService,
  ],
})
export class AdminModule {}
