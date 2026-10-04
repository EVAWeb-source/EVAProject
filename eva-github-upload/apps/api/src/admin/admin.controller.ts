import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { AdminAuditService } from './admin-audit.service.js';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly audit: AdminAuditService,
  ) {}

  @Get('dashboard')
  dashboard(@Headers('x-admin-key') key?: string) {
    this.authorize(key);
    return this.admin.dashboard();
  }

  @Get('fulfillment')
  fulfillment(@Headers('x-admin-key') key?: string) {
    this.authorize(key);
    return this.admin.fulfillmentQueue();
  }

  @Patch('orders/:id/fulfillment')
  async updateFulfillment(
    @Headers('x-admin-key') key: string | undefined,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    this.authorize(key);
    const updated = await this.admin.updateFulfillment(id, body);
    await this.audit.record({
      action: 'FULFILLMENT_UPDATED',
      entityType: 'ORDER',
      entityId: updated.id,
      summary: `${updated.orderNumber} → ${updated.fulfillmentStatus}`,
      metadata: {
        fulfillmentStatus: updated.fulfillmentStatus,
        shippingCarrier: updated.shippingCarrier,
        trackingCode: updated.trackingCode,
      },
    });

    return {
      id: updated.id,
      orderNumber: updated.orderNumber,
      status: updated.status,
      fulfillmentStatus: updated.fulfillmentStatus,
      shippingCarrier: updated.shippingCarrier,
      trackingCode: updated.trackingCode,
      shippedAt: updated.shippedAt,
      deliveredAt: updated.deliveredAt,
      updatedAt: updated.updatedAt,
    };
  }

  @Get('notifications')
  notifications(@Headers('x-admin-key') key?: string) {
    this.authorize(key);
    return this.admin.smsOutbox();
  }

  @Post('notifications/test')
  testNotification(
    @Headers('x-admin-key') key: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    this.authorize(key);
    return this.admin.createTestSms(body);
  }

  @Post('products')
  async createProduct(
    @Headers('x-admin-key') key: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    this.authorize(key);
    const product = await this.admin.createProduct(body);
    await this.audit.record({
      action: 'PRODUCT_CREATED', entityType: 'PRODUCT', entityId: product.id,
      summary: `${product.nameFa} ساخته شد`, metadata: { masterSku: product.masterSku, status: product.status },
    });
    return product;
  }

  @Patch('products/:id')
  async updateProduct(
    @Headers('x-admin-key') key: string | undefined,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    this.authorize(key);
    const product = await this.admin.updateProduct(id, body);
    await this.audit.record({
      action: 'PRODUCT_UPDATED', entityType: 'PRODUCT', entityId: product.id,
      summary: `${product.nameFa} بروزرسانی شد`, metadata: { fields: Object.keys(body), status: product.status },
    });
    return product;
  }

  @Post('units')
  async createUnit(
    @Headers('x-admin-key') key: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    this.authorize(key);
    const unit = await this.admin.createUnit(body);
    await this.audit.record({
      action: 'UNIT_CREATED', entityType: 'UNIT', entityId: unit.id,
      summary: `${unit.unitSku} ساخته شد`, metadata: { productId: unit.productId, status: unit.status, weight: String(unit.exactWeightGram) },
    });
    return unit;
  }

  @Patch('units/:id')
  async updateUnit(
    @Headers('x-admin-key') key: string | undefined,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    this.authorize(key);
    const unit = await this.admin.updateUnit(id, body);
    await this.audit.record({
      action: 'UNIT_UPDATED', entityType: 'UNIT', entityId: unit.id,
      summary: `${unit.unitSku} بروزرسانی شد`, metadata: { fields: Object.keys(body), status: unit.status, weight: String(unit.exactWeightGram) },
    });
    return unit;
  }

  private authorize(key?: string) {
    const expected = process.env.ADMIN_API_KEY;
    if (!expected || !key || key !== expected) {
      throw new UnauthorizedException('Admin access denied');
    }
  }
}
