import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrentConfig(purity = 18) {
    const [rule, rate] = await Promise.all([
      this.prisma.pricingRule.findFirst({
        where: { isActive: true },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.goldRate.findFirst({
        where: { purity },
        orderBy: { observedAt: 'desc' },
      }),
    ]);

    if (!rule) throw new ConflictException('No active pricing rule');
    if (!rate) throw new ConflictException(`No gold rate for purity ${purity}`);

    return { rule, rate };
  }

  async priceUnit(unitId: string, persist = true) {
    const unit = await this.prisma.physicalUnit.findUnique({
      where: { id: unitId },
      include: { product: true },
    });

    if (!unit) throw new NotFoundException('Unit not found');

    const { rule, rate } = await this.getCurrentConfig(unit.product.purity);
    const exactWeightGram = Number(unit.exactWeightGram);
    const goldRateTomanPerGram = Math.round(Number(rate.irrPerGram) / 10);
    const makingPercent = Number(rule.makingPercent);
    const profitPercent = Number(rule.profitPercent);
    const taxPercent = Number(rule.taxPercent);

    // Temporary, configurable test formula. The rule can be replaced later
    // without changing order/reservation snapshot architecture.
    const goldValueToman = Math.round(exactWeightGram * goldRateTomanPerGram);
    const makingToman = Math.round(goldValueToman * (makingPercent / 100));
    const profitToman = Math.round(
      (goldValueToman + makingToman) * (profitPercent / 100),
    );
    const taxToman = Math.round(
      (makingToman + profitToman) * (taxPercent / 100),
    );
    const finalPriceToman =
      goldValueToman + makingToman + profitToman + taxToman;

    if (persist) {
      await this.prisma.physicalUnit.update({
        where: { id: unit.id },
        data: { currentPriceToman: BigInt(finalPriceToman) },
      });
    }

    return {
      unitId: unit.id,
      unitSku: unit.unitSku,
      productNameFa: unit.product.nameFa,
      purity: unit.product.purity,
      exactWeightGram: unit.exactWeightGram.toString(),
      goldRateTomanPerGram,
      goldValueToman,
      makingToman,
      profitToman,
      taxToman,
      finalPriceToman,
      rateVersion: rate.rateVersion,
      rateSource: rate.source,
      rateObservedAt: rate.observedAt,
      pricingRuleId: rule.id,
      pricingFormulaVersion: rule.formulaVersion,
      parameters: {
        makingPercent,
        profitPercent,
        taxPercent,
      },
    };
  }
}
