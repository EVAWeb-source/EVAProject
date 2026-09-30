import { Controller, Get, Headers, UnauthorizedException } from '@nestjs/common';
import { AdminService } from './admin.service.js';

@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('dashboard')
  dashboard(@Headers('x-admin-key') key?: string) {
    const expected = process.env.ADMIN_API_KEY;

    if (!expected || !key || key !== expected) {
      throw new UnauthorizedException('Admin access denied');
    }

    return this.admin.dashboard();
  }
}
