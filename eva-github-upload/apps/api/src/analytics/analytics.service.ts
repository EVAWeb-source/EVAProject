import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureTable() {
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SiteEvent" (
        "id" TEXT PRIMARY KEY,
        "event" TEXT NOT NULL,
        "sessionId" TEXT NOT NULL,
        "path" TEXT NOT NULL,
        "referrer" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "SiteEvent_createdAt_idx" ON "SiteEvent" ("createdAt")');
    await this.prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "SiteEvent_sessionId_createdAt_idx" ON "SiteEvent" ("sessionId", "createdAt")');
    await this.prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "SiteEvent_path_createdAt_idx" ON "SiteEvent" ("path", "createdAt")');
  }

  async track(input: Record<string, unknown>) {
    const event = String(input.event ?? 'PAGE_VIEW').trim().toUpperCase();
    const sessionId = String(input.sessionId ?? '').trim();
    const path = String(input.path ?? '').trim();
    const referrer = String(input.referrer ?? '').trim();

    if (event !== 'PAGE_VIEW') throw new BadRequestException('Unsupported analytics event');
    if (!sessionId || sessionId.length > 80) throw new BadRequestException('Invalid analytics session');
    if (!path.startsWith('/') || path.length > 500) throw new BadRequestException('Invalid analytics path');

    await this.ensureTable();
    const id = randomUUID();
    const safeReferrer = referrer ? referrer.slice(0, 500) : null;
    await this.prisma.$executeRaw`
      INSERT INTO "SiteEvent" ("id", "event", "sessionId", "path", "referrer")
      VALUES (${id}, ${event}, ${sessionId}, ${path}, ${safeReferrer})
    `;

    return { ok: true, id };
  }
}
