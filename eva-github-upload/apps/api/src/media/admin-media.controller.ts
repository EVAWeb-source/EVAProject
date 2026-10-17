import { BadRequestException, Body, Controller, Delete, Get, Headers, Param, Patch, Post, UnauthorizedException, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service.js';

@Controller('admin/media')
export class AdminMediaController {
  constructor(private readonly media: MediaService) {}

  @Get()
  list(@Headers('x-admin-key') key: string | undefined) {
    this.authorize(key);
    return this.media.listAdmin();
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024, files: 1 } }))
  upload(@Headers('x-admin-key') key: string | undefined, @UploadedFile() file: any) {
    this.authorize(key);
    if (!file) throw new BadRequestException('No image file received');
    return this.media.upload(file);
  }

  @Patch('slots/:slot')
  setSlot(
    @Headers('x-admin-key') key: string | undefined,
    @Param('slot') slot: string,
    @Body() body: Record<string, unknown>,
  ) {
    this.authorize(key);
    const assetId = body.assetId === null || body.assetId === '' ? null : String(body.assetId || '');
    if (assetId !== null && !assetId) throw new BadRequestException('assetId is required');
    return this.media.setSlot(slot, assetId, body.altText);
  }

  @Delete(':id')
  remove(@Headers('x-admin-key') key: string | undefined, @Param('id') id: string) {
    this.authorize(key);
    return this.media.remove(id);
  }

  private authorize(key?: string) {
    const expected = process.env.ADMIN_API_KEY;
    if (!expected || !key || key !== expected) throw new UnauthorizedException('Admin access denied');
  }
}
