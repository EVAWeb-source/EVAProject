import { Body, Controller, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { AdminPricingService } from './admin-pricing.service.js';
import { AdminAuditService } from './admin-audit.service.js';

@Controller('admin/pricing')
export class AdminPricingController {
  constructor(
    private readonly pricing: AdminPricingService,
    private readonly audit: AdminAuditService,
  ) {}

  @Post('config')
  async updateConfig(
    @Headers('x-admin-key') key: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    const expected = process.env.ADMIN_API_KEY;
    if (!expected || !key || key !== expected) {
      throw new UnauthorizedException('Admin access denied');
    }
    const result = await this.pricing.updateConfig(body);
    await this.audit.record({
      action: 'GOLD_RATE_UPDATED',
      entityType: 'GOLD_RATE',
      entityId: result.rate.rateVersion,
      summary: 'نرخ هر گرم طلا بروزرسانی شد',
      metadata: {
        tomanPerGram: result.rate.tomanPerGram,
        source: result.rate.source,
        rateVersion: result.rate.rateVersion,
        repricedUnits: result.repricedUnits,
      },
    });
    return result;
  }
}
