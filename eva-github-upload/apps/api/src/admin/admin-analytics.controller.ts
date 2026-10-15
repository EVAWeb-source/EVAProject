import { Controller, Get, Headers, Query, UnauthorizedException } from '@nestjs/common';
import { AdminAnalyticsService } from './admin-analytics.service.js';

@Controller('admin/analytics')
export class AdminAnalyticsController {
  constructor(private readonly analytics: AdminAnalyticsService) {}

  @Get()
  overview(@Headers('x-admin-key') key?: string, @Query('days') days?: string) {
    this.authorize(key);
    return this.analytics.overview(Number(days));
  }

  private authorize(key?: string) {
    const expected = process.env.ADMIN_API_KEY;
    if (!expected || !key || key !== expected) throw new UnauthorizedException('Admin access denied');
  }
}
