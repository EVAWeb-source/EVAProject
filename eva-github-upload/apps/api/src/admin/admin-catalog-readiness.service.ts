import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

const AGHAZ_BLUEPRINT = [
  { nameFa: 'طلوع', slug: 'tolou', masterSku: 'EVA-AGH-NEC-TOL-001' },
  { nameFa: 'افق', slug: 'ofogh', masterSku: 'EVA-AGH-NEC-OFG-002' },
  { nameFa: 'بامداد', slug: 'bamdad', masterSku: 'EVA-AGH-NEC-BMD-003' },
  { nameFa: 'مسیر', slug: 'masir', masterSku: 'EVA-AGH-RIN-MAS-004' },
  { nameFa: 'آستانه', slug: 'astaneh', masterSku: 'EVA-AGH-RIN-AST-005' },
  { nameFa: 'نقطه', slug: 'noghteh', masterSku: 'EVA-AGH-RIN-NOG-006' },
  { nameFa: 'راه', slug: 'rah', masterSku: 'EVA-AGH-BRA-RAH-007' },
  { nameFa: 'گام', slug: 'gam', masterSku: 'EVA-AGH-BRA-GAM-008' },
  { nameFa: 'جهت', slug: 'jahat', masterSku: 'EVA-AGH-BRA-JHT-009' },
  { nameFa: 'روشن', slug: 'roshan', masterSku: 'EVA-AGH-EAR-ROS-010' },
  { nameFa: 'نوا', slug: 'nava', masterSku: 'EVA-AGH-EAR-NVA-011' },
  { nameFa: 'دم', slug: 'dam', masterSku: 'EVA-AGH-EAR-DAM-012' },
  { nameFa: 'فردا', slug: 'farda', masterSku: 'EVA-AGH-SET-FRD-013' },
  { nameFa: 'رویش', slug: 'rooyesh', masterSku: 'EVA-AGH-SET-ROY-014' },
  { nameFa: 'پروا', slug: 'parva', masterSku: 'EVA-AGH-SET-PRV-015' },
] as const;

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

  async createAghazDrafts() {
    const collection = await this.prisma.collection.findUnique({ where: { slug: 'aghaz' } });
    if (!collection) throw new NotFoundException('Aghaz collection not found');

    const masterSkus = AGHAZ_BLUEPRINT.map((item) => item.masterSku);
    const slugs = AGHAZ_BLUEPRINT.map((item) => item.slug);
    const existingProducts = await this.prisma.masterProduct.findMany({
      where: {
        OR: [
          { masterSku: { in: [...masterSkus] } },
          { slug: { in: [...slugs] } },
        ],
      },
      select: { id: true, nameFa: true, slug: true, masterSku: true, status: true },
    });

    const bySku = new Map(existingProducts.map((product) => [product.masterSku, product]));
    const bySlug = new Map(existingProducts.map((product) => [product.slug, product]));
    const created: Array<{ id: string; nameFa: string; slug: string; masterSku: string }> = [];
    const existing: Array<{ id: string; nameFa: string; slug: string; masterSku: string; status: string }> = [];
    const conflicts: Array<{ nameFa: string; slug: string; masterSku: string; reason: string }> = [];

    for (const blueprint of AGHAZ_BLUEPRINT) {
      const skuMatch = bySku.get(blueprint.masterSku);
      if (skuMatch) {
        if (skuMatch.slug !== blueprint.slug) {
          conflicts.push({
            ...blueprint,
            reason: `Master SKU already exists with slug ${skuMatch.slug}`,
          });
        } else {
          existing.push(skuMatch);
        }
        continue;
      }

      const slugMatch = bySlug.get(blueprint.slug);
      if (slugMatch) {
        conflicts.push({
          ...blueprint,
          reason: `Slug is already used by ${slugMatch.masterSku}`,
        });
        continue;
      }

      const product = await this.prisma.masterProduct.create({
        data: {
          nameFa: blueprint.nameFa,
          slug: blueprint.slug,
          masterSku: blueprint.masterSku,
          purity: 18,
          status: 'DRAFT',
          collectionId: collection.id,
        },
        select: { id: true, nameFa: true, slug: true, masterSku: true },
      });
      created.push(product);
      bySku.set(product.masterSku, { ...product, status: 'DRAFT' });
      bySlug.set(product.slug, { ...product, status: 'DRAFT' });
    }

    return {
      collection: { id: collection.id, nameFa: collection.nameFa, slug: collection.slug, code: collection.code },
      planned: AGHAZ_BLUEPRINT.length,
      createdCount: created.length,
      existingCount: existing.length,
      conflictCount: conflicts.length,
      created,
      existing,
      conflicts,
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
