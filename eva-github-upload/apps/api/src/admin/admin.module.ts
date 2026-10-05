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
import { AdminAuditController } from './admin-audit.controller.js';
import { AdminAuditService } from './admin-audit.service.js';
import { AdminOperationsController } from './admin-operations.controller.js';
import { AdminOperationsService } from './admin-operations.service.js';
import { AdminBackupController } from './admin-backup.controller.js';
import { AdminBackupService } from './admin-backup.service.js';

@Module({
  imports: [PricingModule],
  controllers: [
    AdminController,
    AdminPricingController,
    AdminProductContentController,
    AdminCatalogReadinessController,
    AdminAfterSalesController,
    AdminCustomersController,
    AdminAuditController,
    AdminOperationsController,
    AdminBackupController,
  ],
  providers: [
    AdminService,
    AdminPricingService,
    AdminProductContentService,
    AdminCatalogReadinessService,
    AdminAfterSalesService,
    AdminCustomersService,
    AdminAuditService,
    AdminOperationsService,
    AdminBackupService,
  ],
})
export class AdminModule {}
