import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { MediaService } from './media.service.js';

@Controller()
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Get('site-media')
  siteMedia() {
    return this.media.getSiteMedia();
  }

  @Get('site-content/home')
  homeContent() {
    return this.media.getHomeContent();
  }

  @Get('media/:id')
  async file(@Param('id') id: string, @Query('w') width: string | undefined, @Query('q') quality: string | undefined, @Res() response: Response) {
    const result = await this.media.getObject(id, { width, quality });
    response.setHeader('Content-Type', result.contentType);
    response.setHeader('Content-Length', String(result.bytes.length));
    response.setHeader('Cache-Control', result.cacheControl);
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.send(result.bytes);
  }
}
