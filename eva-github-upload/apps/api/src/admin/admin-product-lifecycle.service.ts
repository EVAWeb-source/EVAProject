import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AdminProductLifecycleService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.masterProduct.findMany({
      select: {
        id: true,
        nameFa: true,
        slug: true,
        masterSku: true,
        status: true,
        isVisible: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, input: Record<string, unknown>) {
    const product = await this.prisma.masterProduct.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');

    const data: Record<string, unknown> = {};
    if (input.isVisible !== undefined) {
      if (typeof input.isVisible !== 'boolean') {
        throw new BadRequestException('isVisible must be boolean');
      }
      data.isVisible = input.isVisible;
    }
    if (input.archive === true) {
      data.status = 'ARCHIVED';
      data.isVisible = false;
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
