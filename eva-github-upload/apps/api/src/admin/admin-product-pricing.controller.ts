import { Body, Controller, Get, Headers, Param, Patch, UnauthorizedException } from '@nestjs/common';
import { AdminAuditService } from './admin-audit.service.js';
import { AdminProductPricingService } from './admin-product-pricing.service.js';

@Controller('admin/product-pricing')
export class AdminProductPricingController {
  constructor(
    private readonly pricing: AdminProductPricingService,
    private readonly audit: AdminAuditService,
  ) {}

  private authorize(key: string | undefined) {
    const expected = process.env.ADMIN_API_KEY;
    if (!expected || !key || key !== expected) throw new UnauthorizedException('Admin access denied');
  }

  @Get(':id')
  async get(@Headers('x-admin-key') key: string | undefined, @Param('id') id: string) {
    this.authorize(key);
    return this.pricing.get(id);
  }

  @Patch(':id')
  async update(
    @Headers('x-admin-key') key: string | undefined,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    this.authorize(key);
    const result = await this.pricing.update(id, body);
    await this.audit.record({
      action: 'PRODUCT_PRICING_UPDATED',
      entityType: 'PRODUCT',
      entityId: id,
      summary: 'اجرت، سود و مالیات محصول بروزرسانی شد',
      metadata: {
        makingPercent: result.makingPercent,
        profitPercent: result.profitPercent,
        taxPercent: result.taxPercent,
        repricedUnits: result.repricedUnits,
      },
    });
    return result;
  }
}
