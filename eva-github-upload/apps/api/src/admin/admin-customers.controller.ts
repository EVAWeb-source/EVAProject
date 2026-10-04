import { Body, Controller, Get, Headers, Param, Patch, UnauthorizedException } from '@nestjs/common';
import { AdminCustomersService } from './admin-customers.service.js';
import { AdminAuditService } from './admin-audit.service.js';

@Controller('admin/customers')
export class AdminCustomersController {
  constructor(
    private readonly customers: AdminCustomersService,
    private readonly audit: AdminAuditService,
  ) {}

  @Get()
  list(@Headers('x-admin-key') key?: string) {
    this.authorize(key);
    return this.customers.list();
  }

  @Get(':id')
  detail(@Headers('x-admin-key') key: string | undefined, @Param('id') id: string) {
    this.authorize(key);
    return this.customers.detail(id);
  }

  @Patch(':id')
  async update(
    @Headers('x-admin-key') key: string | undefined,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    this.authorize(key);
    const customer = await this.customers.update(id, body);
    await this.audit.record({
      action: 'CUSTOMER_UPDATED',
      entityType: 'CUSTOMER',
      entityId: customer.id,
      summary: `${customer.name ?? customer.mobile} بروزرسانی شد`,
      metadata: { fields: Object.keys(body), mobile: customer.mobile },
    });
    return customer;
  }

  private authorize(key?: string) {
    const expected = process.env.ADMIN_API_KEY;
    if (!expected || !key || key !== expected) {
      throw new UnauthorizedException('Admin access denied');
    }
  }
}
