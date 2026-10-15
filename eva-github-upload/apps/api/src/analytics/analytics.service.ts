import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async track(input: Record<string, unknown>) {
    const event = String(input.event ?? 'PAGE_VIEW').trim().toUpperCase();
    const sessionId = String(input.sessionId ?? '').trim();
    const path = String(input.path ?? '').trim();
    const referrer = String(input.referrer ?? '').trim();

    if (event !== 'PAGE_VIEW') throw new BadRequestException('Unsupported analytics event');
    if (!sessionId || sessionId.length > 80) throw new BadRequestException('Invalid analytics session');
    if (!path.startsWith('/') || path.length > 500) throw new BadRequestException('Invalid analytics path');

    const item = await this.prisma.siteEvent.create({
      data: {
        event,
        sessionId,
        path,
        referrer: referrer ? referrer.slice(0, 500) : null,
      },
      select: { id: true, createdAt: true },
    });

    return { ok: true, id: item.id, createdAt: item.createdAt };
  }
}
