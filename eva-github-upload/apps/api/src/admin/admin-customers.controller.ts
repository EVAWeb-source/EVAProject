import { Body, Controller, Get, Headers, Param, Patch, UnauthorizedException } from '@nestjs/common';
import { AdminCustomersService } from './admin-customers.service.js';

@Controller('admin/customers')
export class AdminCustomersController {
  constructor(private readonly customers: AdminCustomersService) {}

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
  update(
    @Headers('x-admin-key') key: string | undefined,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    this.authorize(key);
    return this.customers.update(id, body);
  }

  private authorize(key?: string) {
    const expected = process.env.ADMIN_API_KEY;
    if (!expected || !key || key !== expected) {
      throw new UnauthorizedException('Admin access denied');
    }
  }
}
