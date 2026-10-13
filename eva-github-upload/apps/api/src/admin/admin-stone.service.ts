import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AdminStoneService {
  constructor(private readonly prisma: PrismaService) {}

  async forProduct(productId: string) {
    const product = await this.prisma.masterProduct.findUnique({
      where: { id: productId },
      select: {
        id: true,
        units: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            unitSku: true,
            stoneName: true,
            stoneCarat: true,
            stonePriceTomanPerGram: true,
          },
        },
      },
    });
    if (!product) throw new NotFoundException('Product not found');

    return {
      productId: product.id,
      units: product.units.map((unit) => ({
        id: unit.id,
        unitSku: unit.unitSku,
        hasStone: unit.stoneCarat !== null && unit.stonePriceTomanPerGram !== null,
        stoneName: unit.stoneName,
        stoneCarat: unit.stoneCarat === null ? null : unit.stoneCarat.toString(),
        stonePriceTomanPerGram: unit.stonePriceTomanPerGram === null ? null : Number(unit.stonePriceTomanPerGram),
      })),
    };
  }

  async updateUnitStone(id: string, input: Record<string, unknown>) {
    const unit = await this.prisma.physicalUnit.findUnique({ where: { id } });
    if (!unit) throw new NotFoundException('Unit not found');
    if (['RESERVED', 'SOLD', 'RETURNED'].includes(unit.status)) {
      throw new ConflictException('Reserved, sold or returned Unit stone data cannot be edited manually');
    }

    const hasStone = input.hasStone === true || String(input.hasStone ?? '').toLowerCase() === 'true';
    if (!hasStone) {
      return this.prisma.physicalUnit.update({
        where: { id },
        data: {
          stoneName: null,
          stoneCarat: null,
          stonePriceTomanPerGram: null,
          currentPriceToman: null,
        },
      });
    }

    const stoneName = String(input.stoneName ?? '').trim();
    const stoneCarat = Number(input.stoneCarat);
    const stonePriceTomanPerGram = Number(input.stonePriceTomanPerGram);

    if (!stoneName) throw new BadRequestException('Stone name is required');
    if (!Number.isFinite(stoneCarat) || stoneCarat <= 0 || stoneCarat >= 10000) {
      throw new BadRequestException('Stone carat must be a positive number');
    }
    if (!Number.isSafeInteger(stonePriceTomanPerGram) || stonePriceTomanPerGram <= 0) {
      throw new BadRequestException('Stone price per gram must be a positive integer in Toman');
    }

    return this.prisma.physicalUnit.update({
      where: { id },
      data: {
        stoneName,
        stoneCarat: stoneCarat.toFixed(3),
        stonePriceTomanPerGram: BigInt(stonePriceTomanPerGram),
        currentPriceToman: null,
      },
    });
  }
}
