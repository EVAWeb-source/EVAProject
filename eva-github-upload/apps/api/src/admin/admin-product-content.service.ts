import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

const IMAGE_ROLES = ['MAIN', 'GALLERY', 'ON_BODY', 'DETAIL'] as const;
const TEXT_FIELDS = [
  'shortDescription',
  'story',
  'goldColor',
  'styleLabel',
  'details',
  'dimensions',
  'sizeGuide',
  'careInstructions',
  'packagingNote',
  'seoTitle',
  'seoDescription',
] as const;

@Injectable()
export class AdminProductContentService {
  constructor(private readonly prisma: PrismaService) {}

  async get(productId: string) {
    const product = await this.prisma.masterProduct.findUnique({
      where: { id: productId },
      include: {
        collection: true,
        images: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return this.serialize(product);
  }

  async update(productId: string, input: Record<string, unknown>) {
    const existing = await this.prisma.masterProduct.findUnique({ where: { id: productId } });
    if (!existing) throw new NotFoundException('Product not found');

    const data: Record<string, unknown> = {};
    for (const field of TEXT_FIELDS) {
      if (input[field] !== undefined) data[field] = this.optionalText(input[field], field);
    }

    if (input.images !== undefined) {
      if (!Array.isArray(input.images)) throw new BadRequestException('Images must be an array');
      if (input.images.length > 12) throw new BadRequestException('Maximum 12 product images');

      const images = input.images
        .map((raw, index) => this.normalizeImage(raw, index))
        .filter((image): image is NonNullable<typeof image> => image !== null);

      if (images.filter((image) => image.role === 'MAIN').length > 1) {
        throw new BadRequestException('Only one MAIN image is allowed');
      }

      data.images = {
        deleteMany: {},
        create: images,
      };
    }

    if (Object.keys(data).length === 0) throw new BadRequestException('No content fields supplied');

    const product = await this.prisma.masterProduct.update({
      where: { id: productId },
      data: data as any,
      include: {
        collection: true,
        images: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
      },
    });
    return this.serialize(product);
  }

  private normalizeImage(value: unknown, index: number) {
    if (!value || typeof value !== 'object') throw new BadRequestException(`Invalid image at position ${index + 1}`);
    const input = value as Record<string, unknown>;
    const url = String(input.url ?? '').trim();
    if (!url) return null;
    if (!(url.startsWith('https://') || url.startsWith('http://') || url.startsWith('/'))) {
      throw new BadRequestException(`Image ${index + 1} URL must start with https://, http:// or /`);
    }
    if (url.length > 2000) throw new BadRequestException(`Image ${index + 1} URL is too long`);

    const altText = String(input.altText ?? '').trim();
    if (!altText) throw new BadRequestException(`Alt text is required for image ${index + 1}`);
    if (altText.length > 300) throw new BadRequestException(`Alt text is too long for image ${index + 1}`);

    const role = String(input.role ?? 'GALLERY').toUpperCase();
    if (!IMAGE_ROLES.includes(role as (typeof IMAGE_ROLES)[number])) {
      throw new BadRequestException(`Invalid image role at position ${index + 1}`);
    }

    const sortOrder = Number(input.sortOrder ?? index);
    if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 999) {
      throw new BadRequestException(`Invalid sort order at position ${index + 1}`);
    }

    return { url, altText, role: role as any, sortOrder };
  }

  private optionalText(value: unknown, field: string) {
    const text = String(value ?? '').trim();
    if (!text) return null;
    const limit = field === 'seoTitle' ? 120 : field === 'seoDescription' ? 320 : 5000;
    if (text.length > limit) throw new BadRequestException(`${field} is too long`);
    return text;
  }

  private serialize(product: any) {
    return {
      id: product.id,
      nameFa: product.nameFa,
      slug: product.slug,
      masterSku: product.masterSku,
      purity: product.purity,
      status: product.status,
      collection: product.collection
        ? { id: product.collection.id, nameFa: product.collection.nameFa, slug: product.collection.slug }
        : null,
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
      updatedAt: product.updatedAt,
    };
  }
}
