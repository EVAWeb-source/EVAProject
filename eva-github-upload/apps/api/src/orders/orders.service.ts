import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomInt } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrderDto } from './create-order.dto.js';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrderDto) {
    const unit = await this.prisma.physicalUnit.findUnique({
      where: { id: dto.unitId },
      include: { product: true },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    if (unit.status !== 'AVAILABLE') {
      throw new BadRequestException('Unit is not available');
    }

    if (unit.currentPriceToman === null) {
      throw new BadRequestException('Unit does not have a current price');
    }

    const orderNumber = `EVA-${new Date().getUTCFullYear()}-${randomInt(100000, 999999)}`;

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        status: 'DEMO_CONFIRMED',
        isDemo: true,
        customerName: dto.customerName,
        mobile: dto.mobile,
        province: dto.province,
        city: dto.city,
        address: dto.address,
        postalCode: dto.postalCode,
        recipientName: dto.recipientName,
        totalToman: unit.currentPriceToman,
        lines: {
          create: {
            unitId: unit.id,
            productNameFa: unit.product.nameFa,
            masterSku: unit.product.masterSku,
            unitSku: unit.unitSku,
            exactWeightGram: unit.exactWeightGram,
            purity: unit.product.purity,
            unitPriceToman: unit.currentPriceToman,
          },
        },
      },
      include: { lines: true },
    });

    return this.toPublicOrder(order);
  }

  async findByNumber(orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: { lines: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.toPublicOrder(order);
  }

  private toPublicOrder(order: {
    id: string;
    orderNumber: string;
    status: string;
    isDemo: boolean;
    customerName: string;
    mobile: string;
    totalToman: bigint;
    createdAt: Date;
    lines: Array<{
      productNameFa: string;
      unitSku: string;
      exactWeightGram: unknown;
      purity: number;
      unitPriceToman: bigint;
    }>;
  }) {
    const line = order.lines[0];

    return {
      id: order.id,
      number: order.orderNumber,
      status: order.status,
      isDemo: order.isDemo,
      customerName: order.customerName,
      mobile: order.mobile,
      totalToman: Number(order.totalToman),
      createdAt: order.createdAt,
      item: line
        ? {
            name: line.productNameFa,
            unitSku: line.unitSku,
            weightGram: String(line.exactWeightGram),
            purity: line.purity,
            priceToman: Number(line.unitPriceToman),
          }
        : null,
    };
  }
}
