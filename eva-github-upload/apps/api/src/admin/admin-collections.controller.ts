import { Body, Controller, Delete, Headers, Param, Patch, Post, UnauthorizedException } from '@nestjs/common';
import { AdminAuditService } from './admin-audit.service.js';
import { AdminCollectionsService } from './admin-collections.service.js';

@Controller('admin/collections')
export class AdminCollectionsController {
  constructor(
    private readonly collections: AdminCollectionsService,
    private readonly audit: AdminAuditService,
  ) {}

  @Post()
  async create(
    @Headers('x-admin-key') key: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    this.authorize(key);
    const collection = await this.collections.create(body);
    await this.audit.record({
      action: 'COLLECTION_CREATED', entityType: 'COLLECTION', entityId: collection.id,
      summary: `${collection.nameFa} ساخته شد`, metadata: { slug: collection.slug, code: collection.code },
    });
    return collection;
  }

  @Patch(':id')
  async update(
    @Headers('x-admin-key') key: string | undefined,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    this.authorize(key);
    const collection = await this.collections.update(id, body);
    await this.audit.record({
      action: 'COLLECTION_UPDATED', entityType: 'COLLECTION', entityId: collection.id,
      summary: `${collection.nameFa} بروزرسانی شد`, metadata: { fields: Object.keys(body), code: collection.code },
    });
    return collection;
  }

  @Delete(':id')
  async remove(
    @Headers('x-admin-key') key: string | undefined,
    @Param('id') id: string,
  ) {
    this.authorize(key);
    const deleted = await this.collections.delete(id);
    await this.audit.record({
      action: 'COLLECTION_DELETED', entityType: 'COLLECTION', entityId: deleted.id,
      summary: `${deleted.nameFa} حذف شد`, metadata: { code: deleted.code },
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
