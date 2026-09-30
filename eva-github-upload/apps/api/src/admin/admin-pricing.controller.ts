import { Body, Controller, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { AdminPricingService } from './admin-pricing.service.js';

@Controller('admin/pricing')
export class AdminPricingController {
  constructor(private readonly pricing: AdminPricingService) {}

  @Post('config')
  updateConfig(
    @Headers('x-admin-key') key: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    const expected = process.env.ADMIN_API_KEY;
    if (!expected || !key || key !== expected) {
      throw new UnauthorizedException('Admin access denied');
    }
    return this.pricing.updateConfig(body);
  }
}
