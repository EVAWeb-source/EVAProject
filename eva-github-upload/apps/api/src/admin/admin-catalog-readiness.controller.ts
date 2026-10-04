import { Controller, Get, Headers, Param, Patch, UnauthorizedException } from '@nestjs/common';
import { AdminCatalogReadinessService } from './admin-catalog-readiness.service.js';

@Controller('admin/catalog-readiness')
export class AdminCatalogReadinessController {
  constructor(private readonly readiness: AdminCatalogReadinessService) {}

  @Get()
  list(@Headers('x-admin-key') key?: string) {
    this.authorize(key);
    return this.readiness.list();
  }

  @Patch(':id/publish')
  publish(@Headers('x-admin-key') key: string | undefined, @Param('id') id: string) {
    this.authorize(key);
    return this.readiness.publish(id);
  }

  private authorize(key?: string) {
    const expected = process.env.ADMIN_API_KEY;
    if (!expected || !key || key !== expected) {
      throw new UnauthorizedException('Admin access denied');
    }
  }
}
