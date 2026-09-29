import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomInt } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { ReservationsService } from '../reservations/reservations.service.js';
import { CreateOrderDto } from './create-order.dto.js';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reservations: ReservationsService,
  ) {}

  async create(dto: CreateOrderDto) {
    await this.reservations.releaseExpired();

    const reservation = await this.prisma.reservation.findUnique({
      where: { token: dto.reservationToken },
      include: {
        unit: { include: { product: true } },
        order: { include: { lines: true } },
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (reservation.order) {
      return this.toPublicOrder(reservation.order);
    }

    if (reservation.status !== 'ACTIVE') {
      throw new BadRequestException('Reservation is no longer active');
    }

    if (reservation.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('Reservation has expired');
    }

    if (reservation.unitId !== dto.unitId) {
      throw new BadRequestException('Reservation does not match selected unit');
    }

    const unit = reservation.unit;

    if (unit.status !== 'RESERVED') {
      throw new BadRequestException('Unit is not reserved');
    }

    if (unit.currentPriceToman === null) {
      throw new BadRequestException('Unit does not have a current price');
    }

    const orderNumber = `EVA-${new Date().getUTCFullYear()}-${randomInt(100000, 999999)}`;

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
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
          totalToman: unit.currentPriceToman!,
          lines: {
            create: {
              unitId: unit.id,
              productNameFa: unit.product.nameFa,
              masterSku: unit.product.masterSku,
              unitSku: unit.unitSku,
              exactWeightGram: unit.exactWeightGram,
              purity: unit.product.purity,
              unitPriceToman: unit.currentPriceToman!,
            },
          },
        },
        include: { lines: true },
      });

      await tx.reservation.update({
        where: { id: reservation.id },
        data: { orderId: created.id },
      });

      return created;
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
