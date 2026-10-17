import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { MediaService } from './media.service.js';

@Controller()
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Get('site-media')
  siteMedia() {
    return this.media.getSiteMedia();
  }

  @Get('media/:id')
  async file(@Param('id') id: string, @Res() response: Response) {
    const result = await this.media.getObject(id);
    response.setHeader('Content-Type', result.asset.mimeType);
    response.setHeader('Content-Length', String(result.bytes.length));
    response.setHeader('Cache-Control', result.cacheControl);
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.send(result.bytes);
  }
}
