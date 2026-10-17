import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { PrismaService } from '../prisma/prisma.service.js';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const MAX_FILE_SIZE = 10 * 1024 * 1024;

@Injectable()
export class MediaService {
  private readonly s3: S3Client;
  private readonly bucket: string;

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

  async setSlot(slot: string, assetId: string | null, altText?: unknown) {
    const normalizedSlot = this.normalizeSlot(slot);
    if (assetId) {
      const exists = await this.prisma.mediaAsset.findUnique({ where: { id: assetId } });
      if (!exists) throw new NotFoundException('Media asset not found');
    }
    const alt = String(altText ?? '').trim().slice(0, 300) || null;
    const record = await this.prisma.siteMediaSlot.upsert({
      where: { slot: normalizedSlot },
      create: { slot: normalizedSlot, assetId, altText: alt },
      update: { assetId, altText: alt },
      include: { asset: true },
    });
    return this.serializeSlot(record);
  }

  async getObject(id: string) {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException('Media asset not found');
    const object = await this.s3.send(new GetObjectCommand({ Bucket: this.bucket, Key: asset.storageKey }));
    if (!object.Body) throw new NotFoundException('Media file not found');
    const bytes = await object.Body.transformToByteArray();
    return { asset, bytes: Buffer.from(bytes), cacheControl: object.CacheControl || 'public, max-age=31536000, immutable' };
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
      asset: slot.asset ? this.serializeAsset(slot.asset) : null,
      updatedAt: slot.updatedAt,
    };
  }
}
