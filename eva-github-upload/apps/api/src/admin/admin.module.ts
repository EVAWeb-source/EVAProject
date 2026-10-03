import { Module } from '@nestjs/common';
import { PricingModule } from '../pricing/pricing.module.js';
import { AdminController } from './admin.controller.js';
import { AdminPricingController } from './admin-pricing.controller.js';
import { AdminPricingService } from './admin-pricing.service.js';
import { AdminProductContentController } from './admin-product-content.controller.js';
import { AdminProductContentService } from './admin-product-content.service.js';
import { AdminService } from './admin.service.js';

@Module({
  imports: [PricingModule],
  controllers: [AdminController, AdminPricingController, AdminProductContentController],
  providers: [AdminService, AdminPricingService, AdminProductContentService],
})
export class AdminModule {}
