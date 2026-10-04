import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export type AuditEntryInput = {
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  metadata?: Record<string, unknown> | null;
};

@Injectable()
export class AdminAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: AuditEntryInput) {
    try {
      return await this.prisma.adminAuditLog.create({
        data: {
          actor: 'ADMIN',
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId ?? null,
          summary: input.summary,
          metadata: input.metadata ? (input.metadata as any) : undefined,
        },
      });
    } catch (error) {
      // Audit logging should never make a successfully completed commerce action look failed.
      console.error('Admin audit log write failed', error);
      return null;
    }
  }

  async list() {
    const now = Date.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [items, today, last7Days] = await Promise.all([
      this.prisma.adminAuditLog.findMany({
        take: 250,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.adminAuditLog.count({ where: { createdAt: { gte: startOfToday } } }),
      this.prisma.adminAuditLog.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      summary: { totalShown: items.length, today, last7Days },
      items: items.map((item) => ({
        id: item.id,
        actor: item.actor,
        action: item.action,
        entityType: item.entityType,
        entityId: item.entityId,
        summary: item.summary,
        metadata: item.metadata,
        createdAt: item.createdAt,
      })),
    };
  }

  async recent(limit = 8) {
    return this.prisma.adminAuditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        summary: true,
        createdAt: true,
      },
    });
  }
}
