import { Body, Controller, Get, Headers, Param, Patch, Post, UnauthorizedException } from '@nestjs/common';
import { AdminAfterSalesService } from './admin-after-sales.service.js';
import { AdminAuditService } from './admin-audit.service.js';

@Controller('admin')
export class AdminAfterSalesController {
  constructor(
    private readonly afterSales: AdminAfterSalesService,
    private readonly audit: AdminAuditService,
  ) {}

  @Get('after-sales')
  list(@Headers('x-admin-key') key?: string) {
    this.authorize(key);
    return this.afterSales.list();
  }

  @Post('orders/:id/cancellation')
  async createCancellation(
    @Headers('x-admin-key') key: string | undefined,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    this.authorize(key);
    const result = await this.afterSales.createCancellation(id, body);
    await this.logCase('CANCELLATION_CREATED', result, body);
    return result;
  }

  @Post('orders/:id/return')
  async createReturn(
    @Headers('x-admin-key') key: string | undefined,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    this.authorize(key);
    const result = await this.afterSales.createReturn(id, body);
    await this.logCase('RETURN_CREATED', result, body);
    return result;
  }

  @Patch('after-sales/:id/approve')
  async approve(@Headers('x-admin-key') key: string | undefined, @Param('id') id: string) {
    this.authorize(key);
    const result = await this.afterSales.approve(id);
    await this.logCase('AFTER_SALES_APPROVED', result);
    return result;
  }

  @Patch('after-sales/:id/reject')
  async reject(
    @Headers('x-admin-key') key: string | undefined,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    this.authorize(key);
    const result = await this.afterSales.reject(id, body);
    await this.logCase('AFTER_SALES_REJECTED', result, body);
    return result;
  }

  @Patch('after-sales/:id/received')
  async received(@Headers('x-admin-key') key: string | undefined, @Param('id') id: string) {
    this.authorize(key);
    const result = await this.afterSales.markReceived(id);
    await this.logCase('RETURN_RECEIVED', result);
    return result;
  }

  @Patch('after-sales/:id/qc')
  async qc(
    @Headers('x-admin-key') key: string | undefined,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    this.authorize(key);
    const result = await this.afterSales.completeQc(id, body);
    await this.logCase('RETURN_QC_COMPLETED', result, body);
    return result;
  }

  @Patch('after-sales/:id/refund')
  async refund(
    @Headers('x-admin-key') key: string | undefined,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    this.authorize(key);
    const result = await this.afterSales.markRefunded(id, body);
    await this.logCase('REFUND_RECORDED', result, body);
    return result;
  }

  private async logCase(action: string, item: any, metadata?: Record<string, unknown>) {
    await this.audit.record({
      action,
      entityType: 'AFTER_SALES',
      entityId: item.id,
      summary: `${item.order?.orderNumber ?? 'Order'} • ${item.type} → ${item.status}`,
      metadata: {
        orderId: item.order?.id,
        orderNumber: item.order?.orderNumber,
        type: item.type,
        status: item.status,
        ...(metadata ?? {}),
      },
    });
  }

  private authorize(key?: string) {
    const expected = process.env.ADMIN_API_KEY;
    if (!expected || !key || key !== expected) throw new UnauthorizedException('Admin access denied');
  }
}
