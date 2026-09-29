import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listProducts() {
    const products = await this.prisma.masterProduct.findMany({
      where: { status: 'ACTIVE' },
      include: {
        collection: true,
        units: {
          where: { status: 'AVAILABLE' },
          orderBy: { exactWeightGram: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return products.map((product) => this.serializeProduct(product));
  }

  async getProductBySlug(slug: string) {
    const product = await this.prisma.masterProduct.findUnique({
      where: { slug },
      include: {
        collection: true,
        units: {
          orderBy: { exactWeightGram: 'asc' },
        },
      },
    });

    if (!product || product.status !== 'ACTIVE') {
      throw new NotFoundException('Product not found');
    }

    return this.serializeProduct(product);
  }

  private serializeProduct(product: any) {
    return {
      id: product.id,
      nameFa: product.nameFa,
      slug: product.slug,
      masterSku: product.masterSku,
      purity: product.purity,
      status: product.status,
      collection: product.collection
        ? {
            id: product.collection.id,
            nameFa: product.collection.nameFa,
            slug: product.collection.slug,
            code: product.collection.code,
            story: product.collection.story,
          }
        : null,
      units: product.units.map((unit: any) => ({
        id: unit.id,
        unitSku: unit.unitSku,
        exactWeightGram: unit.exactWeightGram.toString(),
        currentPriceToman: unit.currentPriceToman?.toString() ?? null,
        status: unit.status,
        reservedUntil: unit.reservedUntil,
      })),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
