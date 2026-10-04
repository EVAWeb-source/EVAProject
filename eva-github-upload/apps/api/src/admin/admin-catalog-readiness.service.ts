import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AdminCatalogReadinessService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const products = await this.prisma.masterProduct.findMany({
      include: {
        collection: true,
        images: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
        units: { select: { id: true, status: true, unitSku: true, exactWeightGram: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const items = products.map((product) => this.serialize(product));

    return {
      generatedAt: new Date().toISOString(),
      summary: {
        total: items.length,
        active: items.filter((item) => item.status === 'ACTIVE').length,
        readyToPublish: items.filter((item) => item.readyToPublish && item.status !== 'ACTIVE').length,
        needsContent: items.filter((item) => !item.checks.content).length,
        needsMedia: items.filter((item) => !item.checks.media).length,
        needsSeo: items.filter((item) => !item.checks.seo).length,
        needsInventory: items.filter((item) => !item.checks.inventory).length,
      },
      items,
    };
  }

  async publish(id: string) {
    const product = await this.prisma.masterProduct.findUnique({
      where: { id },
      include: {
        collection: true,
        images: true,
        units: { select: { status: true } },
      },
    });

    if (!product) throw new NotFoundException('Product not found');

    const readiness = this.serialize(product);
    if (!readiness.readyToPublish) {
      throw new ConflictException(`Product is not publish-ready: ${readiness.missing.join(', ')}`);
    }

    const updated = await this.prisma.masterProduct.update({
      where: { id },
      data: { status: 'ACTIVE' },
      include: { collection: true },
    });

    return {
      id: updated.id,
      nameFa: updated.nameFa,
      slug: updated.slug,
      masterSku: updated.masterSku,
      status: updated.status,
      collection: updated.collection?.nameFa ?? null,
    };
  }

  private serialize(product: any) {
    const checks = {
      product: Boolean(product.id && product.nameFa && product.slug && product.masterSku),
      collection: Boolean(product.collectionId),
      content: Boolean(
        product.shortDescription?.trim() &&
        product.story?.trim() &&
        product.goldColor?.trim() &&
        product.styleLabel?.trim(),
      ),
      media: Boolean(product.images?.some((image: any) => image.role === 'MAIN' && image.url?.trim() && image.altText?.trim())),
      seo: Boolean(product.seoTitle?.trim() && product.seoDescription?.trim()),
      inventory: Boolean(product.units?.some((unit: any) => unit.status === 'AVAILABLE')),
      published: product.status === 'ACTIVE',
    };

    const labels: Record<keyof typeof checks, string> = {
      product: 'Product',
      collection: 'Collection',
      content: 'Content',
      media: 'Main image',
      seo: 'SEO',
      inventory: 'Available unit',
      published: 'Publish',
    };

    const publishRequirements = ['product', 'collection', 'content', 'media', 'seo', 'inventory'] as const;
    const missing = publishRequirements.filter((key) => !checks[key]).map((key) => labels[key]);
    const completedSteps = Object.values(checks).filter(Boolean).length;

    return {
      id: product.id,
      nameFa: product.nameFa,
      slug: product.slug,
      masterSku: product.masterSku,
      purity: product.purity,
      status: product.status,
      collectionId: product.collectionId,
      collection: product.collection
        ? { id: product.collection.id, nameFa: product.collection.nameFa, slug: product.collection.slug, code: product.collection.code }
        : null,
      imageCount: product.images?.length ?? 0,
      availableUnitCount: product.units?.filter((unit: any) => unit.status === 'AVAILABLE').length ?? 0,
      unitCount: product.units?.length ?? 0,
      checks,
      completedSteps,
      totalSteps: 7,
      readyToPublish: missing.length === 0,
      missing,
    };
  }
}
