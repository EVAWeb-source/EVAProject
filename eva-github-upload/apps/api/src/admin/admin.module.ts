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
import { AdminAfterSalesController } from './admin-after-sales.controller.js';
import { AdminAfterSalesService } from './admin-after-sales.service.js';
import { AdminCustomersController } from './admin-customers.controller.js';
import { AdminCustomersService } from './admin-customers.service.js';

@Module({
  imports: [PricingModule],
  controllers: [
    AdminController,
    AdminPricingController,
    AdminProductContentController,
    AdminCatalogReadinessController,
    AdminAfterSalesController,
    AdminCustomersController,
  ],
  providers: [
    AdminService,
    AdminPricingService,
    AdminProductContentService,
    AdminCatalogReadinessService,
    AdminAfterSalesService,
    AdminCustomersService,
  ],
})
export class AdminModule {}
