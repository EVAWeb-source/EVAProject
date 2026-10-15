import { Body, Controller, Post } from '@nestjs/common';
import { AnalyticsService } from './analytics.service.js';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Post('events')
  track(@Body() body: Record<string, unknown>) {
    return this.analytics.track(body);
  }
}
