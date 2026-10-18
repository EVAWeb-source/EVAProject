import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import sharp from 'sharp';
import { PrismaService } from '../prisma/prisma.service.js';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const HOME_CONTENT_KEY = 'HOME';
const DEFAULT_HOME_CONTENT = {
  heroEyebrow: 'FINE JEWELRY',
  heroTitle: 'جواهراتی برای لحظه‌های ماندگار',
  heroBody: 'طراحی ظریف، وزن دقیق و خرید شفاف؛ برای قطعه‌هایی که قرار است بخشی از داستان تو شوند.',
  heroCtaLabel: 'مشاهده کالکشن ←',
  heroCtaHref: '/collections/aghaz',
  storyEyebrow: 'OUR STORY',
  storyTitle: 'داستان ایوا',
  storyBody: 'در EVA به قطعه‌هایی باور داریم که قرار نیست فقط دیده شوند؛ جواهراتی ظریف و امروزی که با زمان، بخشی از داستان شخصی تو می‌شوند.',
  storyCtaLabel: 'درباره ما ←',
  storyCtaHref: '/about',
};

type CropInput = { positionX?: unknown; positionY?: unknown; zoom?: unknown };

@Injectable()
export class MediaService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly variantCache = new Map<string, Buffer>();

  constructor(private readonly prisma: PrismaService) {
    const endpoint = process.env.MEDIA_S3_ENDPOINT;
    const bucket = process.env.MEDIA_S3_BUCKET;
    const accessKeyId = process.env.MEDIA_S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.MEDIA_S3_SECRET_ACCESS_KEY;
    if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
      throw new Error('EVA media storage is not configured');
    }
    this.bucket = bucket;
    this.s3 = new S3Client({
      endpoint,
      region: process.env.MEDIA_S3_REGION || 'auto',
      forcePathStyle: false,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  publicUrl(id: string) {
    const base = (process.env.MEDIA_PUBLIC_BASE_URL || '').replace(/\/$/, '');
    return `${base}/api/v1/media/${id}`;
  }

  async upload(file: { originalname?: string; mimetype?: string; size?: number; buffer?: Buffer }) {
    if (!file?.buffer?.length) throw new BadRequestException('No image file received');
    const mimeType = String(file.mimetype || '').toLowerCase();
    if (!ALLOWED_TYPES.has(mimeType)) throw new BadRequestException('Only JPG, PNG, WebP and AVIF images are allowed');
    if ((file.size || file.buffer.length) > MAX_FILE_SIZE) throw new BadRequestException('Image must be smaller than 10 MB');

    const originalName = String(file.originalname || 'image').slice(0, 240);
    const extension = this.safeExtension(originalName, mimeType);
    const now = new Date();
    const storageKey = `media/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${randomUUID()}${extension}`;

    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
      Body: file.buffer,
      ContentType: mimeType,
      CacheControl: 'public, max-age=31536000, immutable',
    }));

    const asset = await this.prisma.mediaAsset.create({
      data: {
        storageKey,
        originalName,
        mimeType,
        sizeBytes: file.size || file.buffer.length,
      },
    });
    return this.serializeAsset(asset);
  }

  async listAdmin() {
    const [assets, slots] = await Promise.all([
      this.prisma.mediaAsset.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }),
      this.prisma.siteMediaSlot.findMany({ include: { asset: true }, orderBy: { slot: 'asc' } }),
    ]);
    return {
      assets: assets.map((asset) => this.serializeAsset(asset)),
      slots: slots.map((slot) => this.serializeSlot(slot)),
    };
  }

  async getSiteMedia() {
    const slots = await this.prisma.siteMediaSlot.findMany({
      where: { assetId: { not: null } },
      include: { asset: true },
      orderBy: { slot: 'asc' },
    });
    return Object.fromEntries(slots.map((slot) => [slot.slot, this.serializeSlot(slot)]));
  }

  async getHomeContent() {
    const record = await this.prisma.siteContent.findUnique({ where: { key: HOME_CONTENT_KEY } });
    const stored = record?.value && typeof record.value === 'object' && !Array.isArray(record.value)
      ? record.value as Record<string, unknown>
      : {};
    return { ...DEFAULT_HOME_CONTENT, ...stored };
  }

  async setHomeContent(input: Record<string, unknown>) {
    const current = await this.getHomeContent();
    const next = {
      heroEyebrow: this.text(input.heroEyebrow ?? current.heroEyebrow, 80),
      heroTitle: this.text(input.heroTitle ?? current.heroTitle, 180),
      heroBody: this.text(input.heroBody ?? current.heroBody, 700),
      heroCtaLabel: this.text(input.heroCtaLabel ?? current.heroCtaLabel, 80),
      heroCtaHref: this.href(input.heroCtaHref ?? current.heroCtaHref),
      storyEyebrow: this.text(input.storyEyebrow ?? current.storyEyebrow, 80),
      storyTitle: this.text(input.storyTitle ?? current.storyTitle, 160),
      storyBody: this.text(input.storyBody ?? current.storyBody, 700),
      storyCtaLabel: this.text(input.storyCtaLabel ?? current.storyCtaLabel, 80),
      storyCtaHref: this.href(input.storyCtaHref ?? current.storyCtaHref),
    };
    await this.prisma.siteContent.upsert({
      where: { key: HOME_CONTENT_KEY },
      create: { key: HOME_CONTENT_KEY, value: next as any },
      update: { value: next as any },
    });
    return next;
  }

  async setSlot(slot: string, assetId: string | null, altText?: unknown, crop: CropInput = {}) {
    const normalizedSlot = this.normalizeSlot(slot);
    if (assetId) {
      const exists = await this.prisma.mediaAsset.findUnique({ where: { id: assetId } });
      if (!exists) throw new NotFoundException('Media asset not found');
    }
    const alt = String(altText ?? '').trim().slice(0, 300) || null;
    const positionX = this.intRange(crop.positionX, 50, 0, 100);
    const positionY = this.intRange(crop.positionY, 50, 0, 100);
    const zoom = this.intRange(crop.zoom, 100, 100, 200);
    const record = await this.prisma.siteMediaSlot.upsert({
      where: { slot: normalizedSlot },
      create: { slot: normalizedSlot, assetId, altText: alt, positionX, positionY, zoom },
      update: { assetId, altText: alt, positionX, positionY, zoom },
      include: { asset: true },
    });
    return this.serializeSlot(record);
  }

  async getObject(id: string, options: { width?: unknown; quality?: unknown } = {}) {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException('Media asset not found');

    const requestedWidth = Number(options.width);
    const width = Number.isFinite(requestedWidth) && requestedWidth > 0
      ? [180, 480, 900, 1400, 1800].find((candidate) => requestedWidth <= candidate) ?? 1800
      : null;
    const quality = this.intRange(options.quality, 82, 60, 90);
    const cacheKey = width ? `${id}:${width}:${quality}` : '';
    const cached = cacheKey ? this.variantCache.get(cacheKey) : undefined;
    if (cached) {
      return { asset, bytes: cached, contentType: 'image/webp', cacheControl: 'public, max-age=31536000, immutable' };
    }

    const object = await this.s3.send(new GetObjectCommand({ Bucket: this.bucket, Key: asset.storageKey }));
    if (!object.Body) throw new NotFoundException('Media file not found');
    const source = Buffer.from(await object.Body.transformToByteArray());

    if (!width) {
      return { asset, bytes: source, contentType: asset.mimeType, cacheControl: object.CacheControl || 'public, max-age=31536000, immutable' };
    }

    const bytes = await sharp(source, { failOn: 'none' })
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality, effort: 4 })
      .toBuffer();

    this.variantCache.set(cacheKey, bytes);
    if (this.variantCache.size > 60) {
      const oldest = this.variantCache.keys().next().value;
      if (oldest) this.variantCache.delete(oldest);
    }
    return { asset, bytes, contentType: 'image/webp', cacheControl: 'public, max-age=31536000, immutable' };
  }

  async remove(id: string) {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id }, include: { siteSlots: true } });
    if (!asset) throw new NotFoundException('Media asset not found');
    const url = this.publicUrl(asset.id);
    const productReferences = await this.prisma.productImage.count({ where: { url } });
    if (productReferences > 0 || asset.siteSlots.length > 0) {
      throw new BadRequestException('This image is currently in use and cannot be deleted');
    }
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: asset.storageKey }));
    await this.prisma.mediaAsset.delete({ where: { id } });
    return { ok: true };
  }

  private normalizeSlot(slot: string) {
    const value = String(slot || '').trim().toUpperCase();
    if (!/^[A-Z0-9_]{2,80}$/.test(value)) throw new BadRequestException('Invalid media slot');
    return value;
  }

  private safeExtension(name: string, mimeType: string) {
    const known: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/avif': '.avif',
    };
    const candidate = extname(name).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(candidate)) return candidate === '.jpeg' ? '.jpg' : candidate;
    return known[mimeType] || '';
  }

  private text(value: unknown, max: number) {
    return String(value ?? '').trim().slice(0, max);
  }

  private href(value: unknown) {
    const href = String(value ?? '').trim().slice(0, 300);
    if (!href) return '/';
    if (href.startsWith('/') || /^https?:\/\//i.test(href)) return href;
    throw new BadRequestException('Link must start with / or http(s)://');
  }

  private intRange(value: unknown, fallback: number, min: number, max: number) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.max(min, Math.min(max, Math.round(number)));
  }

  private serializeAsset(asset: any) {
    return {
      id: asset.id,
      url: this.publicUrl(asset.id),
      originalName: asset.originalName,
      mimeType: asset.mimeType,
      sizeBytes: asset.sizeBytes,
      width: asset.width,
      height: asset.height,
      createdAt: asset.createdAt,
    };
  }

  private serializeSlot(slot: any) {
    return {
      slot: slot.slot,
      altText: slot.altText,
      positionX: slot.positionX ?? 50,
      positionY: slot.positionY ?? 50,
      zoom: slot.zoom ?? 100,
      asset: slot.asset ? this.serializeAsset(slot.asset) : null,
      updatedAt: slot.updatedAt,
    };
  }
}
