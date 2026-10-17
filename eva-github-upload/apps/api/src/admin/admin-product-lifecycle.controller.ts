import { Body, Controller, Delete, Get, Headers, Param, Patch, UnauthorizedException } from '@nestjs/common';
import { AdminAuditService } from './admin-audit.service.js';
import { AdminProductLifecycleService } from './admin-product-lifecycle.service.js';

@Controller('admin/product-lifecycle')
export class AdminProductLifecycleController {
  constructor(
    private readonly lifecycle: AdminProductLifecycleService,
    private readonly audit: AdminAuditService,
  ) {}

  @Get()
  list(@Headers('x-admin-key') key?: string) {
    this.authorize(key);
    return this.lifecycle.list();
  }

  @Patch(':id')
  async update(
    @Headers('x-admin-key') key: string | undefined,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    this.authorize(key);
    const product = await this.lifecycle.update(id, body);
    await this.audit.record({
      action: body.archive === true ? 'PRODUCT_ARCHIVED' : 'PRODUCT_VISIBILITY_UPDATED',
      entityType: 'PRODUCT',
      entityId: product.id,
      summary: body.archive === true
        ? `${product.nameFa} آرشیو و از سایت مخفی شد`
        : `${product.nameFa} → ${product.isVisible ? 'نمایش در سایت' : 'عدم نمایش در سایت'}`,
      metadata: { status: product.status, isVisible: product.isVisible },
    });
    return product;
  }

  @Delete(':id')
  async remove(
    @Headers('x-admin-key') key: string | undefined,
    @Param('id') id: string,
  ) {
    this.authorize(key);
    const deleted = await this.lifecycle.delete(id);
    await this.audit.record({
      action: 'PRODUCT_DELETED',
      entityType: 'PRODUCT',
      entityId: deleted.id,
      summary: `${deleted.nameFa} برای همیشه حذف شد`,
      metadata: { masterSku: deleted.masterSku },
    });
    return deleted;
  }

  private authorize(key?: string) {
    const expected = process.env.ADMIN_API_KEY;
    if (!expected || !key || key !== expected) {
      throw new UnauthorizedException('Admin access denied');
    }
  }
}
