import { Body, Controller, Get, Headers, Param, Patch, UnauthorizedException } from '@nestjs/common';
import { AdminProductContentService } from './admin-product-content.service.js';
import { AdminAuditService } from './admin-audit.service.js';

@Controller('admin/products')
export class AdminProductContentController {
  constructor(
    private readonly content: AdminProductContentService,
    private readonly audit: AdminAuditService,
  ) {}

  @Get(':id/content')
  get(
    @Headers('x-admin-key') key: string | undefined,
    @Param('id') id: string,
  ) {
    this.authorize(key);
    return this.content.get(id);
  }

  @Patch(':id/content')
  async update(
    @Headers('x-admin-key') key: string | undefined,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    this.authorize(key);
    const result = await this.content.update(id, body);
    await this.audit.record({
      action: 'PRODUCT_CONTENT_UPDATED',
      entityType: 'PRODUCT',
      entityId: result.id,
      summary: `${result.nameFa}؛ محتوا/Media بروزرسانی شد`,
      metadata: { fields: Object.keys(body), imageCount: result.images?.length ?? 0 },
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
