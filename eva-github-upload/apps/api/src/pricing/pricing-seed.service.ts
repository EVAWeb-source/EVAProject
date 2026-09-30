import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class PricingSeedService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const existingRule = await this.prisma.pricingRule.findFirst({
      where: { isActive: true },
    });

    if (!existingRule) {
      await this.prisma.pricingRule.create({
        data: {
          id: 'default-demo-rule',
          name: 'EVA Temporary Demo Formula',
          formulaVersion: 'DEMO-FORMULA-V1',
          makingPercent: '12.000',
          profitPercent: '7.000',
          taxPercent: '10.000',
          isActive: true,
        },
      });
    }

    const existingRate = await this.prisma.goldRate.findFirst({
      where: { purity: 18 },
      orderBy: { observedAt: 'desc' },
    });

    if (!existingRate) {
      await this.prisma.goldRate.create({
        data: {
          purity: 18,
          // Stored in IRR. This is intentionally a demo/manual rate for testing.
          irrPerGram: BigInt(140000000),
          source: 'DEMO_MANUAL',
          rateVersion: 'DEMO-RATE-V1',
          observedAt: new Date('2026-09-30T00:00:00.000Z'),
        },
      });
    }
  }
}
