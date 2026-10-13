import { Body, Controller, Get, Headers, Param, Patch, UnauthorizedException } from '@nestjs/common';
import { AdminStoneService } from './admin-stone.service.js';
import { AdminAuditService } from './admin-audit.service.js';

@Controller('admin/stone-units')
export class AdminStoneController {
  constructor(
    private readonly stones: AdminStoneService,
    private readonly audit: AdminAuditService,
  ) {}

  @Get('product/:productId')
  forProduct(
    @Headers('x-admin-key') key: string | undefined,
    @Param('productId') productId: string,
  ) {
    this.authorize(key);
    return this.stones.forProduct(productId);
  }

  @Patch(':id')
  async updateUnitStone(
    @Headers('x-admin-key') key: string | undefined,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    this.authorize(key);
    const unit = await this.stones.updateUnitStone(id, body);
    await this.audit.record({
      action: 'UNIT_STONE_UPDATED',
      entityType: 'UNIT',
      entityId: unit.id,
      summary: `${unit.unitSku} اطلاعات سنگ بروزرسانی شد`,
      metadata: {
        hasStone: unit.stoneCarat !== null,
        stoneName: unit.stoneName,
        stoneCarat: unit.stoneCarat?.toString() ?? null,
      },
    });
    return {
      id: unit.id,
      unitSku: unit.unitSku,
      hasStone: unit.stoneCarat !== null && unit.stonePriceTomanPerGram !== null,
      stoneName: unit.stoneName,
      stoneCarat: unit.stoneCarat?.toString() ?? null,
      stonePriceTomanPerGram: unit.stonePriceTomanPerGram === null ? null : Number(unit.stonePriceTomanPerGram),
    };
  }

  private authorize(key?: string) {
    const expected = process.env.ADMIN_API_KEY;
    if (!expected || !key || key !== expected) {
      throw new UnauthorizedException('Admin access denied');
    }
  }
}
