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

    if (!Number.isFinite(tomanPerGram) || tomanPerGram <= 0 || tomanPerGram > 1_000_000_000_000) {
      throw new BadRequestException('Gold rate must be a positive Toman amount');
    }

    const stamp = Date.now();
    const rateVersion = `ADMIN-RATE-${stamp}`;
    const now = new Date();

    await this.prisma.goldRate.create({
      data: {
        purity: 18,
        irrPerGram: BigInt(Math.round(tomanPerGram * 10)),
        source: 'ADMIN_MANUAL',
        rateVersion,
        observedAt: now,
      },
    });

    const units = await this.prisma.physicalUnit.findMany({
      where: {
        status: {
          in: ['QC_PENDING', 'AVAILABLE', 'QUALITY_HOLD', 'DAMAGED', 'UNAVAILABLE'],
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
      repricedUnits: units.length,
      protectedSnapshots: true,
      productPricingPreserved: true,
    };
  }
}
