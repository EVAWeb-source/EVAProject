import { Module } from '@nestjs/common';
import { PricingController } from './pricing.controller.js';
import { PricingSeedService } from './pricing-seed.service.js';
import { PricingService } from './pricing.service.js';

@Module({
  controllers: [PricingController],
  providers: [PricingService, PricingSeedService],
  exports: [PricingService],
})
export class PricingModule {}
