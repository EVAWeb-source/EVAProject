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

@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('dashboard')
  dashboard(@Headers('x-admin-key') key?: string) {
    this.authorize(key);
    return this.admin.dashboard();
  }

  // Fulfillment operations are exposed only through the authenticated admin API.
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

    // Return a deliberately JSON-safe payload. The Order model contains BigInt
    // monetary fields, which must never be serialized directly by Nest/JSON.
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

  @Post('products')
  createProduct(
    @Headers('x-admin-key') key: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    this.authorize(key);
    return this.admin.createProduct(body);
  }

  @Patch('products/:id')
  updateProduct(
    @Headers('x-admin-key') key: string | undefined,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    this.authorize(key);
    return this.admin.updateProduct(id, body);
  }

  @Post('units')
  createUnit(
    @Headers('x-admin-key') key: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    this.authorize(key);
    return this.admin.createUnit(body);
  }

  @Patch('units/:id')
  updateUnit(
    @Headers('x-admin-key') key: string | undefined,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    this.authorize(key);
    return this.admin.updateUnit(id, body);
  }

  private authorize(key?: string) {
    const expected = process.env.ADMIN_API_KEY;
    if (!expected || !key || key !== expected) {
      throw new UnauthorizedException('Admin access denied');
    }
  }
}
