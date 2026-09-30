import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PricingService } from '../pricing/pricing.service.js';

@Injectable()
export class AdminPricingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: PricingService,
  ) {}

  async updateConfig(input: Record<string, unknown>) {
    const tomanPerGram = Number(input.tomanPerGram);
    const makingPercent = Number(input.makingPercent);
    const profitPercent = Number(input.profitPercent);
    const taxPercent = Number(input.taxPercent);

    if (!Number.isFinite(tomanPerGram) || tomanPerGram <= 0 || tomanPerGram > 1_000_000_000_000) {
      throw new BadRequestException('Gold rate must be a positive Toman amount');
    }
    for (const [label, value] of [
      ['Making', makingPercent],
      ['Profit', profitPercent],
      ['Tax', taxPercent],
    ] as const) {
      if (!Number.isFinite(value) || value < 0 || value > 100) {
        throw new BadRequestException(`${label} percent must be between 0 and 100`);
      }
    }

    const stamp = Date.now();
    const rateVersion = `ADMIN-RATE-${stamp}`;
    const formulaVersion = `ADMIN-FORMULA-${stamp}`;
    const ruleId = `admin-rule-${stamp}`;
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.goldRate.create({
        data: {
          purity: 18,
          irrPerGram: BigInt(Math.round(tomanPerGram * 10)),
          source: 'ADMIN_MANUAL',
          rateVersion,
          observedAt: now,
        },
      });

      await tx.pricingRule.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      await tx.pricingRule.create({
        data: {
          id: ruleId,
          name: 'EVA Admin Configurable Formula',
          formulaVersion,
          makingPercent: makingPercent.toFixed(3),
          profitPercent: profitPercent.toFixed(3),
          taxPercent: taxPercent.toFixed(3),
          isActive: true,
        },
      });
    });

    const units = await this.prisma.physicalUnit.findMany({
      where: {
        status: {
          in: ['QC_PENDING', 'AVAILABLE', 'RETURNED', 'QUALITY_HOLD', 'DAMAGED', 'UNAVAILABLE'],
        },
      },
      select: { id: true },
    });

    await Promise.all(units.map((unit) => this.pricing.priceUnit(unit.id, true)));

    return {
      ok: true,
      rate: {
        purity: 18,
        tomanPerGram: Math.round(tomanPerGram),
        source: 'ADMIN_MANUAL',
        rateVersion,
        observedAt: now,
      },
      rule: {
        id: ruleId,
        name: 'EVA Admin Configurable Formula',
        formulaVersion,
        makingPercent,
        profitPercent,
        taxPercent,
      },
      repricedUnits: units.length,
      protectedSnapshots: true,
    };
  }
}
