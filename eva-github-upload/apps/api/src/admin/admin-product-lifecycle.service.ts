import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AdminProductLifecycleService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const products = await this.prisma.masterProduct.findMany({
      select: {
        id: true,
        nameFa: true,
        slug: true,
        masterSku: true,
        status: true,
        isVisible: true,
        updatedAt: true,
        units: { where: { status: 'AVAILABLE' }, select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return products.map(({ units, ...product }) => ({
      ...product,
      status: ['ACTIVE', 'OUT_OF_STOCK'].includes(product.status)
        ? (units.length > 0 ? 'ACTIVE' : 'OUT_OF_STOCK')
        : product.status,
    }));
  }

  async update(id: string, input: Record<string, unknown>) {
    const product = await this.prisma.masterProduct.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');

    const availableCount = await this.prisma.physicalUnit.count({
      where: { productId: id, status: 'AVAILABLE' },
    });
    const publishedStatus = availableCount > 0 ? 'ACTIVE' : 'OUT_OF_STOCK';
    const data: Record<string, unknown> = {};

    if (input.restore === true) {
      if (product.status !== 'ARCHIVED') {
        throw new BadRequestException('Only archived products can be restored');
      }
      data.status = publishedStatus;
      data.isVisible = true;
    } else if (input.archive === true) {
      data.status = 'ARCHIVED';
      data.isVisible = false;
    } else if (input.isVisible !== undefined) {
      if (typeof input.isVisible !== 'boolean') {
        throw new BadRequestException('isVisible must be boolean');
      }

      data.isVisible = input.isVisible;

      // ARCHIVED and the legacy HIDDEN status cannot be visible in the public
      // catalog. Turning visibility on migrates them back to the published
      // lifecycle, with availability derived from sellable Units.
      if (input.isVisible === true && ['ARCHIVED', 'HIDDEN'].includes(product.status)) {
        data.status = publishedStatus;
      }
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No lifecycle fields supplied');
    }

    return this.prisma.masterProduct.update({
      where: { id },
      data: data as any,
      select: {
        id: true,
        nameFa: true,
        slug: true,
        masterSku: true,
        status: true,
        isVisible: true,
        updatedAt: true,
      },
    });
  }

  async delete(id: string) {
    const product = await this.prisma.masterProduct.findUnique({
      where: { id },
      include: {
        units: {
          include: {
            _count: { select: { orderLines: true, reservations: true, afterSalesCases: true } },
          },
        },
      },
    });
    if (!product) throw new NotFoundException('Product not found');

    const protectedUnit = product.units.find((unit) =>
      ['RESERVED', 'SOLD', 'RETURNED'].includes(unit.status) ||
      unit._count.orderLines > 0 ||
      unit._count.reservations > 0 ||
      unit._count.afterSalesCases > 0,
    );
    if (protectedUnit) {
      throw new ConflictException('Product has sales, reservation or after-sales history and cannot be permanently deleted. Archive it instead.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.physicalUnit.deleteMany({ where: { productId: product.id } });
      await tx.masterProduct.delete({ where: { id: product.id } });
    });

    return { ok: true, id: product.id, nameFa: product.nameFa, masterSku: product.masterSku };
  }
}
