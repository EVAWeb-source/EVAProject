import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PricingService } from '../pricing/pricing.service.js';

@Injectable()
export class AdminProductPricingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: PricingService,
  ) {}

  async get(id: string) {
    const [product, fallbackRule] = await Promise.all([
      this.prisma.masterProduct.findUnique({ where: { id } }),
      this.prisma.pricingRule.findFirst({ where: { isActive: true }, orderBy: { updatedAt: 'desc' } }),
    ]);
    if (!product) throw new NotFoundException('Product not found');

    return {
      productId: product.id,
      makingPercent: product.makingPercent === null ? (fallbackRule ? Number(fallbackRule.makingPercent) : null) : Number(product.makingPercent),
      profitPercent: product.profitPercent === null ? (fallbackRule ? Number(fallbackRule.profitPercent) : null) : Number(product.profitPercent),
      taxPercent: product.taxPercent === null ? (fallbackRule ? Number(fallbackRule.taxPercent) : null) : Number(product.taxPercent),
      source: product.makingPercent !== null && product.profitPercent !== null && product.taxPercent !== null ? 'PRODUCT' : 'LEGACY_FALLBACK',
    };
  }

  async update(id: string, input: Record<string, unknown>) {
    const product = await this.prisma.masterProduct.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');

    const makingPercent = this.percentage(input.makingPercent, 'Making');
    const profitPercent = this.percentage(input.profitPercent, 'Profit');
    const taxPercent = this.percentage(input.taxPercent, 'Tax');

    const updated = await this.prisma.masterProduct.update({
      where: { id },
      data: {
        makingPercent: makingPercent.toFixed(3),
        profitPercent: profitPercent.toFixed(3),
        taxPercent: taxPercent.toFixed(3),
      },
    });

    const units = await this.prisma.physicalUnit.findMany({
      where: {
        productId: id,
        status: { in: ['QC_PENDING', 'AVAILABLE', 'QUALITY_HOLD', 'DAMAGED', 'UNAVAILABLE'] },
      },
      select: { id: true },
    });

    await Promise.all(units.map((unit) => this.pricing.priceUnit(unit.id, true)));

    return {
      productId: updated.id,
      makingPercent: Number(updated.makingPercent),
      profitPercent: Number(updated.profitPercent),
      taxPercent: Number(updated.taxPercent),
      repricedUnits: units.length,
      protectedSnapshots: true,
    };
  }

  private percentage(value: unknown, label: string) {
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0 || number > 100) {
      throw new BadRequestException(`${label} percent must be between 0 and 100`);
    }
    return number;
  }
}
