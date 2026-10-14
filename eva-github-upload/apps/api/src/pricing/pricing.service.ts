import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

const EVA_PRICING_FORMULA_VERSION = 'EVA-PRODUCT-STONE-V3';

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

    if (!rate) throw new ConflictException(`No gold rate for purity ${purity}`);
    return { rule, rate };
  }

  calculateQuote(unit: any, config: { rule: any | null; rate: any }) {
    const { rule, rate } = config;
    const product = unit.product ?? {};
    const exactWeightGram = Number(unit.exactWeightGram);
    const goldRateTomanPerGram = Math.round(Number(rate.irrPerGram) / 10);

    const makingPercent = product.makingPercent === null || product.makingPercent === undefined
      ? (rule ? Number(rule.makingPercent) : NaN)
      : Number(product.makingPercent);
    const profitPercent = product.profitPercent === null || product.profitPercent === undefined
      ? (rule ? Number(rule.profitPercent) : NaN)
      : Number(product.profitPercent);
    const taxPercent = product.taxPercent === null || product.taxPercent === undefined
      ? (rule ? Number(rule.taxPercent) : NaN)
      : Number(product.taxPercent);

    if (![makingPercent, profitPercent, taxPercent].every(Number.isFinite)) {
      throw new ConflictException('Product pricing percentages are not configured');
    }

    // EVA approved formula (per gram):
    // board price × (1 + making%) × (1 + profit%)
    // tax is applied only to making + profit, never to the board-price gold value.
    const makingPerGram = goldRateTomanPerGram * (makingPercent / 100);
    const priceAfterMakingPerGram = goldRateTomanPerGram + makingPerGram;
    const profitPerGram = priceAfterMakingPerGram * (profitPercent / 100);
    const goldBeforeTaxPerGram = priceAfterMakingPerGram + profitPerGram;
    const taxablePerGram = goldBeforeTaxPerGram - goldRateTomanPerGram;
    const taxPerGram = taxablePerGram * (taxPercent / 100);

    const goldValueToman = Math.round(exactWeightGram * goldRateTomanPerGram);
    const makingToman = Math.round(exactWeightGram * makingPerGram);
    const profitToman = Math.round(exactWeightGram * profitPerGram);
    const taxToman = Math.round(exactWeightGram * taxPerGram);
    const goldSubtotalBeforeTaxToman = Math.round(exactWeightGram * goldBeforeTaxPerGram);
    const goldFinalToman = goldSubtotalBeforeTaxToman + taxToman;

    const stoneCarat = unit.stoneCarat === null || unit.stoneCarat === undefined
      ? null
      : Number(unit.stoneCarat);
    const stonePriceTomanPerGram = unit.stonePriceTomanPerGram === null || unit.stonePriceTomanPerGram === undefined
      ? null
      : Number(unit.stonePriceTomanPerGram);
    const hasStone = Boolean(
      stoneCarat !== null && stoneCarat > 0 &&
      stonePriceTomanPerGram !== null && stonePriceTomanPerGram > 0,
    );
    const stoneWeightGram = hasStone ? stoneCarat! * 0.2 : null;
    const stoneValueToman = hasStone
      ? Math.round(stoneWeightGram! * stonePriceTomanPerGram!)
      : 0;

    const finalPriceToman = goldFinalToman + stoneValueToman;
    const productPricingConfigured = product.makingPercent !== null && product.makingPercent !== undefined &&
      product.profitPercent !== null && product.profitPercent !== undefined &&
      product.taxPercent !== null && product.taxPercent !== undefined;

    return {
      unitId: unit.id,
      unitSku: unit.unitSku,
      productNameFa: product.nameFa ?? null,
      purity: product.purity ?? rate.purity,
      exactWeightGram: unit.exactWeightGram.toString(),
      goldRateTomanPerGram,
      goldValueToman,
      makingToman,
      profitToman,
      taxToman,
      goldSubtotalBeforeTaxToman,
      goldFinalToman,
      stoneName: hasStone ? (unit.stoneName ?? 'سنگ') : null,
      stoneCarat: hasStone ? stoneCarat : null,
      stoneWeightGram,
      stonePriceTomanPerGram: hasStone ? stonePriceTomanPerGram : null,
      stoneValueToman,
      finalPriceToman,
      rateVersion: rate.rateVersion,
      rateSource: rate.source,
      rateObservedAt: rate.observedAt,
      pricingRuleId: productPricingConfigured ? `product:${product.id}` : (rule?.id ?? null),
      pricingFormulaVersion: EVA_PRICING_FORMULA_VERSION,
      parameters: {
        makingPercent,
        profitPercent,
        taxPercent,
        pricingSource: productPricingConfigured ? 'PRODUCT' : 'LEGACY_FALLBACK',
      },
    };
  }

  async priceUnit(unitId: string, persist = true) {
    const unit = await this.prisma.physicalUnit.findUnique({
      where: { id: unitId },
      include: { product: true },
    });

    if (!unit) throw new NotFoundException('Unit not found');

    const config = await this.getCurrentConfig(unit.product.purity);
    const quote = this.calculateQuote(unit, config);

    if (persist) {
      await this.prisma.physicalUnit.update({
        where: { id: unit.id },
        data: { currentPriceToman: BigInt(quote.finalPriceToman) },
      });
    }

    return quote;
  }
}
