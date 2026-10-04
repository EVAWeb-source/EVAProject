import { Controller, Get, Headers, Param, Patch, Post, UnauthorizedException } from '@nestjs/common';
import { AdminCatalogReadinessService } from './admin-catalog-readiness.service.js';
import { AdminAuditService } from './admin-audit.service.js';

@Controller('admin/catalog-readiness')
export class AdminCatalogReadinessController {
  constructor(
    private readonly readiness: AdminCatalogReadinessService,
    private readonly audit: AdminAuditService,
  ) {}

  @Get()
  list(@Headers('x-admin-key') key?: string) {
    this.authorize(key);
    return this.readiness.list();
  }

  @Post('aghaz/drafts')
  async createAghazDrafts(@Headers('x-admin-key') key?: string) {
    this.authorize(key);
    const result = await this.readiness.createAghazDrafts();
    await this.audit.record({
      action: 'BULK_DRAFTS_CREATED', entityType: 'CATALOG', entityId: 'aghaz',
      summary: 'Batch Draft کالکشن آغاز اجرا شد', metadata: result as any,
    });
    return result;
  }

  @Patch(':id/publish')
  async publish(@Headers('x-admin-key') key: string | undefined, @Param('id') id: string) {
    this.authorize(key);
    const result = await this.readiness.publish(id);
    await this.audit.record({
      action: 'PRODUCT_PUBLISHED', entityType: 'PRODUCT', entityId: id,
      summary: `${result.nameFa ?? result.masterSku ?? id} منتشر شد`, metadata: { status: result.status },
    });
    return result;
  }

  private authorize(key?: string) {
    const expected = process.env.ADMIN_API_KEY;
    if (!expected || !key || key !== expected) {
      throw new UnauthorizedException('Admin access denied');
    }
  }
}
