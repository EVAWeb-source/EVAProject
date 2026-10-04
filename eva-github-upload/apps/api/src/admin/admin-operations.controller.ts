import { Controller, Get, Headers, UnauthorizedException } from '@nestjs/common';
import { AdminOperationsService } from './admin-operations.service.js';

@Controller('admin/operations')
export class AdminOperationsController {
  constructor(private readonly operations: AdminOperationsService) {}

  @Get()
  overview(@Headers('x-admin-key') key?: string) {
    this.authorize(key);
    return this.operations.overview();
  }

  private authorize(key?: string) {
    const expected = process.env.ADMIN_API_KEY;
    if (!expected || !key || key !== expected) throw new UnauthorizedException('Admin access denied');
  }
}
