import { Injectable, NotFoundException } from '@nestjs/common';
import { PricingService } from '../pricing/pricing.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ReservationsService } from '../reservations/reservations.service.js';

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reservations: ReservationsService,
    private readonly pricing: PricingService,
  ) {}

  async listProducts() {
    await this.reservations.releaseExpired();

    const products = await this.prisma.masterProduct.findMany({
      where: { status: 'ACTIVE' },
      include: {
        collection: true,
        images: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
        units: {
          where: { status: 'AVAILABLE' },
          orderBy: { exactWeightGram: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const configByPurity = await this.loadPricingConfigs(products.map((product) => product.purity));
    return products.map((product) => this.serializeProduct(product, configByPurity));
  }

  async getProductBySlug(slug: string) {
    await this.reservations.releaseExpired();

    const product = await this.prisma.masterProduct.findUnique({
      where: { slug },
      include: {
        collection: true,
        images: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
        units: {
          where: { status: 'AVAILABLE' },
          orderBy: { exactWeightGram: 'asc' },
        },
      },
    });

    if (!product || product.status !== 'ACTIVE') {
      throw new NotFoundException('Product not found');
    }

    const configByPurity = await this.loadPricingConfigs([product.purity]);
    return this.serializeProduct(product, configByPurity);
  }

  private async loadPricingConfigs(purities: number[]) {
    const uniquePurities = [...new Set(purities)];
    const entries = await Promise.all(
      uniquePurities.map(async (purity) => [purity, await this.pricing.getCurrentConfig(purity)] as const),
    );
    return new Map<number, any>(entries);
  }

  private serializeProduct(product: any, configByPurity: Map<number, any>) {
    const config = configByPurity.get(product.purity);
    const units = product.units.map((unit: any) => {
      const quote = this.pricing.calculateQuote(
        { ...unit, product: { nameFa: product.nameFa, purity: product.purity } },
        config,
      );

      return {
        id: unit.id,
        unitSku: unit.unitSku,
        exactWeightGram: unit.exactWeightGram.toString(),
        currentPriceToman: String(quote.finalPriceToman),
        status: unit.status,
        reservedUntil: unit.reservedUntil,
        pricing: {
          goldRateTomanPerGram: quote.goldRateTomanPerGram,
          goldValueToman: quote.goldValueToman,
          makingToman: quote.makingToman,
          profitToman: quote.profitToman,
          taxToman: quote.taxToman,
          finalPriceToman: quote.finalPriceToman,
          rateVersion: quote.rateVersion,
          pricingFormulaVersion: quote.pricingFormulaVersion,
        },
      };
    });

    return {
      id: product.id,
      nameFa: product.nameFa,
      slug: product.slug,
      masterSku: product.masterSku,
      purity: product.purity,
      status: product.status,
      shortDescription: product.shortDescription,
      story: product.story,
      goldColor: product.goldColor,
      styleLabel: product.styleLabel,
      details: product.details,
      dimensions: product.dimensions,
      sizeGuide: product.sizeGuide,
      careInstructions: product.careInstructions,
      packagingNote: product.packagingNote,
      seoTitle: product.seoTitle,
      seoDescription: product.seoDescription,
      images: product.images.map((image: any) => ({
        id: image.id,
        url: image.url,
        altText: image.altText,
        role: image.role,
        sortOrder: image.sortOrder,
      })),
      collection: product.collection
        ? {
            id: product.collection.id,
            nameFa: product.collection.nameFa,
            slug: product.collection.slug,
            code: product.collection.code,
            story: product.collection.story,
          }
        : null,
      units,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
