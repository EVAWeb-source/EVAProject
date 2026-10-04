import { Controller, Get, Headers, UnauthorizedException } from '@nestjs/common';
import { AdminAuditService } from './admin-audit.service.js';

@Controller('admin/audit')
export class AdminAuditController {
  constructor(private readonly audit: AdminAuditService) {}

  @Get()
  list(@Headers('x-admin-key') key?: string) {
    this.authorize(key);
    return this.audit.list();
  }

  private authorize(key?: string) {
    const expected = process.env.ADMIN_API_KEY;
    if (!expected || !key || key !== expected) throw new UnauthorizedException('Admin access denied');
  }
}
