import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomInt } from 'node:crypto';
import { normalizeIranMobile } from '../common/normalize-mobile.js';
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
        order: { include: { lines: true, payments: true } },
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

    const lockedPrice = reservation.lockedPriceToman ?? unit.currentPriceToman;
    if (lockedPrice === null) {
      throw new BadRequestException('Reservation does not have a locked price');
    }

    const mobile = normalizeIranMobile(dto.mobile);
    const customer = await this.prisma.customer.upsert({
      where: { mobile },
      create: { mobile, name: dto.customerName },
      update: { name: dto.customerName },
    });

    const orderNumber = `EVA-${new Date().getUTCFullYear()}-${randomInt(100000, 999999)}`;

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          status: 'PENDING_PAYMENT',
          isDemo: true,
          customerId: customer.id,
          customerName: dto.customerName,
          mobile,
          province: dto.province,
          city: dto.city,
          address: dto.address,
          postalCode: dto.postalCode,
          recipientName: dto.recipientName,
          totalToman: lockedPrice,
          lines: {
            create: {
              unitId: unit.id,
              productNameFa: unit.product.nameFa,
              masterSku: unit.product.masterSku,
              unitSku: unit.unitSku,
              exactWeightGram: unit.exactWeightGram,
              purity: unit.product.purity,
              unitPriceToman: lockedPrice,
              goldRateTomanPerGram: reservation.goldRateTomanPerGram,
              goldValueToman: reservation.goldValueToman,
              makingToman: reservation.makingToman,
              profitToman: reservation.profitToman,
              taxToman: reservation.taxToman,
              rateVersion: reservation.rateVersion,
              pricingFormulaVersion: reservation.pricingFormulaVersion,
              pricingRuleId: reservation.pricingRuleId,
            },
          },
        },
        include: { lines: true, payments: true },
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
      include: { lines: true, payments: { orderBy: { createdAt: 'desc' } } },
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
      goldRateTomanPerGram: bigint | null;
      goldValueToman: bigint | null;
      makingToman: bigint | null;
      profitToman: bigint | null;
      taxToman: bigint | null;
      rateVersion: string | null;
      pricingFormulaVersion: string | null;
    }>;
    payments?: Array<{
      provider: string;
      status: string;
      amountToman: bigint;
      referenceId: string | null;
      failureCode: string | null;
      paidAt: Date | null;
      createdAt: Date;
    }>;
  }) {
    const line = order.lines[0];
    const payment = order.payments?.[0] ?? null;

    return {
      id: order.id,
      number: order.orderNumber,
      status: order.status,
      isDemo: order.isDemo,
      totalToman: Number(order.totalToman),
      createdAt: order.createdAt,
      payment: payment
        ? {
            provider: payment.provider,
            status: payment.status,
            amountToman: Number(payment.amountToman),
            referenceId: payment.referenceId,
            failureCode: payment.failureCode,
            paidAt: payment.paidAt,
          }
        : null,
      item: line
        ? {
            name: line.productNameFa,
            unitSku: line.unitSku,
            weightGram: String(line.exactWeightGram),
            purity: line.purity,
            priceToman: Number(line.unitPriceToman),
            pricing: {
              goldRateTomanPerGram:
                line.goldRateTomanPerGram === null
                  ? null
                  : Number(line.goldRateTomanPerGram),
              goldValueToman:
                line.goldValueToman === null ? null : Number(line.goldValueToman),
              makingToman:
                line.makingToman === null ? null : Number(line.makingToman),
              profitToman:
                line.profitToman === null ? null : Number(line.profitToman),
              taxToman: line.taxToman === null ? null : Number(line.taxToman),
              rateVersion: line.rateVersion,
              pricingFormulaVersion: line.pricingFormulaVersion,
            },
          }
        : null,
    };
  }
}
