import { Controller, Get, Param } from '@nestjs/common';
import { PricingService } from './pricing.service.js';

@Controller('pricing')
export class PricingController {
  constructor(private readonly pricing: PricingService) {}

  @Get('current')
  async current() {
    const { rule, rate } = await this.pricing.getCurrentConfig(18);

    return {
      rule: rule
        ? {
            id: rule.id,
            name: rule.name,
            formulaVersion: rule.formulaVersion,
            makingPercent: Number(rule.makingPercent),
            profitPercent: Number(rule.profitPercent),
            taxPercent: Number(rule.taxPercent),
          }
        : null,
      rate: {
        purity: rate.purity,
        tomanPerGram: Math.round(Number(rate.irrPerGram) / 10),
        source: rate.source,
        rateVersion: rate.rateVersion,
        observedAt: rate.observedAt,
      },
      mode: 'GLOBAL_GOLD_RATE_PRODUCT_PRICING',
    };
  }

  @Get('units/:unitId')
  priceUnit(@Param('unitId') unitId: string) {
    return this.pricing.priceUnit(unitId, true);
  }
}
