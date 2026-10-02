import { Body, Controller, Post } from '@nestjs/common';
import { TrackingService } from './tracking.service.js';

@Controller('tracking')
export class TrackingController {
  constructor(private readonly tracking: TrackingService) {}

  @Post()
  track(@Body() body: Record<string, unknown>) {
    return this.tracking.track(body);
  }
}
