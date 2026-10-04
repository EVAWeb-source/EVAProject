import { Body, Controller, Get, Headers, Param, Patch, Post, UnauthorizedException } from '@nestjs/common';
import { AdminAfterSalesService } from './admin-after-sales.service.js';

@Controller('admin')
export class AdminAfterSalesController {
  constructor(private readonly afterSales: AdminAfterSalesService) {}

  @Get('after-sales')
  list(@Headers('x-admin-key') key?: string) {
    this.authorize(key);
    return this.afterSales.list();
  }

  @Post('orders/:id/cancellation')
  createCancellation(
    @Headers('x-admin-key') key: string | undefined,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    this.authorize(key);
    return this.afterSales.createCancellation(id, body);
  }

  @Post('orders/:id/return')
  createReturn(
    @Headers('x-admin-key') key: string | undefined,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    this.authorize(key);
    return this.afterSales.createReturn(id, body);
  }

  @Patch('after-sales/:id/approve')
  approve(@Headers('x-admin-key') key: string | undefined, @Param('id') id: string) {
    this.authorize(key);
    return this.afterSales.approve(id);
  }

  @Patch('after-sales/:id/reject')
  reject(
    @Headers('x-admin-key') key: string | undefined,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    this.authorize(key);
    return this.afterSales.reject(id, body);
  }

  @Patch('after-sales/:id/received')
  received(@Headers('x-admin-key') key: string | undefined, @Param('id') id: string) {
    this.authorize(key);
    return this.afterSales.markReceived(id);
  }

  @Patch('after-sales/:id/qc')
  qc(
    @Headers('x-admin-key') key: string | undefined,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    this.authorize(key);
    return this.afterSales.completeQc(id, body);
  }

  @Patch('after-sales/:id/refund')
  refund(
    @Headers('x-admin-key') key: string | undefined,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    this.authorize(key);
    return this.afterSales.markRefunded(id, body);
  }

  private authorize(key?: string) {
    const expected = process.env.ADMIN_API_KEY;
    if (!expected || !key || key !== expected) throw new UnauthorizedException('Admin access denied');
  }
}
