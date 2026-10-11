import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AdminCollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: Record<string, unknown>) {
    const nameFa = this.requiredText(input.nameFa, 'Collection name');
    const slug = this.requiredText(input.slug, 'Slug').toLowerCase();
    const code = this.requiredText(input.code, 'Code').toUpperCase();
    const story = this.optionalText(input.story, 2000);
    this.validateSlug(slug);
    this.validateCode(code);

    try {
      return await this.prisma.collection.create({
        data: { nameFa, slug, code, story },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') throw new ConflictException('Collection slug or code already exists');
      throw error;
    }
  }

  async update(id: string, input: Record<string, unknown>) {
    const existing = await this.prisma.collection.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Collection not found');

    const data: Record<string, unknown> = {};
    if (input.nameFa !== undefined) data.nameFa = this.requiredText(input.nameFa, 'Collection name');
    if (input.slug !== undefined) {
      const slug = this.requiredText(input.slug, 'Slug').toLowerCase();
      this.validateSlug(slug);
      data.slug = slug;
    }
    if (input.code !== undefined) {
      const code = this.requiredText(input.code, 'Code').toUpperCase();
      this.validateCode(code);
      data.code = code;
    }
    if (input.story !== undefined) data.story = this.optionalText(input.story, 2000);
    if (Object.keys(data).length === 0) throw new BadRequestException('No collection fields supplied');

    try {
      return await this.prisma.collection.update({ where: { id }, data: data as any });
    } catch (error: any) {
      if (error?.code === 'P2002') throw new ConflictException('Collection slug or code already exists');
      throw error;
    }
  }

  async delete(id: string) {
    const collection = await this.prisma.collection.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!collection) throw new NotFoundException('Collection not found');
    if (collection._count.products > 0) {
      throw new ConflictException('Collection still contains products. Move them before deleting the collection.');
    }
    await this.prisma.collection.delete({ where: { id } });
    return { ok: true, id: collection.id, nameFa: collection.nameFa, code: collection.code };
  }

  private requiredText(value: unknown, field: string) {
    const text = String(value ?? '').trim();
    if (!text) throw new BadRequestException(`${field} is required`);
    if (text.length > 160) throw new BadRequestException(`${field} is too long`);
    return text;
  }

  private optionalText(value: unknown, limit: number) {
    const text = String(value ?? '').trim();
    if (!text) return null;
    if (text.length > limit) throw new BadRequestException('Collection story is too long');
    return text;
  }

  private validateSlug(slug: string) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new BadRequestException('Slug must contain only lowercase latin letters, numbers and hyphens');
    }
  }

  private validateCode(code: string) {
    if (!/^[A-Z0-9-]{2,12}$/.test(code)) {
      throw new BadRequestException('Collection code must use 2-12 uppercase letters, numbers or hyphens');
    }
  }
}
