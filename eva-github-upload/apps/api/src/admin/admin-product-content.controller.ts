import { Body, Controller, Get, Headers, Param, Patch, UnauthorizedException } from '@nestjs/common';
import { AdminProductContentService } from './admin-product-content.service.js';

@Controller('admin/products')
export class AdminProductContentController {
  constructor(private readonly content: AdminProductContentService) {}

  @Get(':id/content')
  get(
    @Headers('x-admin-key') key: string | undefined,
    @Param('id') id: string,
  ) {
    this.authorize(key);
    return this.content.get(id);
  }

  @Patch(':id/content')
  update(
    @Headers('x-admin-key') key: string | undefined,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    this.authorize(key);
    return this.content.update(id, body);
  }

  private authorize(key?: string) {
    const expected = process.env.ADMIN_API_KEY;
    if (!expected || !key || key !== expected) {
      throw new UnauthorizedException('Admin access denied');
    }
  }
}
